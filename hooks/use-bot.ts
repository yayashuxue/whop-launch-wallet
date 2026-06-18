"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TERMINAL_FAIL, TERMINAL_OK, type Swap } from "@/lib/types";

export type LogLevel = "info" | "signal" | "news" | "trade" | "success" | "error";
export type LogEntry = { id: number; t: number; level: LogLevel; msg: string };

export type BotStats = {
  trades: number;
  fills: number;
  failures: number;
  startValueUsd: number | null;
  lastSignal: string | null;
};

export type BotSnapshot = {
  price: number | null;
  sma: number | null;
  usdt: number;
  btc: number;
  totalUsd: number;
  newsSentiment: number | null;
  headlines: number;
};

const NEWS_OVERRIDE_THRESHOLD = 0.2;

const MAX_LOGS = 300;

export function useBot(opts: {
  getSnapshot: () => BotSnapshot;
  refreshAccount: () => Promise<void>;
  onSubmitted: (swap: Swap, amount: string, fromToken: string, toToken: string) => void;
  onSettled: (swap: Swap) => void;
}) {
  const [running, setRunning] = useState(false);
  const [intervalSec, setIntervalSec] = useState(10);
  const [sizeUsd, setSizeUsd] = useState(1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<BotStats>({
    trades: 0,
    fills: 0,
    failures: 0,
    startValueUsd: null,
    lastSignal: null,
  });

  const optsRef = useRef(opts);
  optsRef.current = opts;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSwapRef = useRef<{ swap: Swap; amount: string; from: string; to: string } | null>(
    null,
  );
  const tickingRef = useRef(false);
  const logIdRef = useRef(0);

  const log = useCallback((level: LogLevel, msg: string) => {
    setLogs((prev) => [
      ...prev.slice(-(MAX_LOGS - 1)),
      { id: ++logIdRef.current, t: Date.now(), level, msg },
    ]);
  }, []);

  const tick = useCallback(async () => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    try {
      const { getSnapshot, refreshAccount, onSubmitted, onSettled } = optsRef.current;

      const active = activeSwapRef.current;
      if (active) {
        const res = await fetch(`/api/swaps/${encodeURIComponent(active.swap.id)}`);
        if (!res.ok) {
          log("error", `status check failed for ${active.swap.id} (http ${res.status})`);
          return;
        }
        const status: Swap = await res.json();
        if (TERMINAL_OK.includes(status.status)) {
          activeSwapRef.current = null;
          setStats((s) => ({ ...s, fills: s.fills + 1 }));
          log(
            "success",
            `filled ${active.amount} ${active.from} → ${active.to}` +
              (status.tx_hashes?.length ? ` (tx ${status.tx_hashes[0].slice(0, 10)}…)` : ""),
          );
          onSettled({ ...active.swap, ...status });
          await refreshAccount();
        } else if (TERMINAL_FAIL.includes(status.status)) {
          activeSwapRef.current = null;
          setStats((s) => ({ ...s, failures: s.failures + 1 }));
          log("error", `swap ${active.swap.id} failed: ${status.error ?? "unknown"}`);
          onSettled({ ...active.swap, ...status });
        } else {
          log("info", `swap ${active.swap.id} still ${status.status} — holding`);
        }
        return;
      }

      const snap = getSnapshot();
      if (!snap.price) {
        log("info", "no price yet — waiting for quote feed");
        return;
      }

      const sentiment = snap.newsSentiment;
      if (sentiment != null) {
        const pct = Math.round(sentiment * 100);
        const mood =
          sentiment > 0.05 ? "bullish" : sentiment < -0.05 ? "bearish" : "neutral";
        log(
          "news",
          `scanned ${snap.headlines} headlines — sentiment ${mood} (${pct >= 0 ? "+" : ""}${pct}%)`,
        );
      }

      let side: "buy" | "sell";
      let signal: string;
      if (sentiment != null && Math.abs(sentiment) >= NEWS_OVERRIDE_THRESHOLD) {
        side = sentiment > 0 ? "buy" : "sell";
        signal = `strong ${sentiment > 0 ? "bullish" : "bearish"} news flow overrides technicals → ${side.toUpperCase()}`;
      } else if (snap.sma != null) {
        side = snap.price <= snap.sma ? "buy" : "sell";
        signal = `price ${snap.price.toFixed(2)} ${snap.price <= snap.sma ? "≤" : ">"} sma ${snap.sma.toFixed(2)} → ${side.toUpperCase()}`;
        if (sentiment != null) {
          const agrees = (side === "buy") === (sentiment >= 0);
          signal += agrees ? " (news concurs)" : " (news disagrees, technicals win)";
        }
      } else {
        side = snap.usdt >= sizeUsd ? "buy" : "sell";
        signal = `warming up sma — defaulting to ${side.toUpperCase()}`;
      }

      const btcValueUsd = snap.btc * snap.price;
      if (side === "buy" && snap.usdt < sizeUsd) {
        if (btcValueUsd < sizeUsd) {
          log("error", `insufficient funds on both sides (usdt ${snap.usdt.toFixed(2)}, btc $${btcValueUsd.toFixed(2)}) — skipping tick`);
          return;
        }
        side = "sell";
        signal += " (no USDT — flipped to SELL)";
      } else if (side === "sell" && btcValueUsd < sizeUsd) {
        if (snap.usdt < sizeUsd) {
          log("error", `insufficient funds on both sides (usdt ${snap.usdt.toFixed(2)}, btc $${btcValueUsd.toFixed(2)}) — skipping tick`);
          return;
        }
        side = "buy";
        signal += " (no cbBTC — flipped to BUY)";
      }

      log("signal", signal);
      setStats((s) => ({ ...s, lastSignal: signal }));

      const fromToken = side === "buy" ? "USDT" : "cbBTC";
      const toToken = side === "buy" ? "cbBTC" : "USDT";
      const amount =
        side === "buy" ? sizeUsd.toFixed(2) : (sizeUsd / snap.price).toFixed(8);

      log("trade", `submitting ${side.toUpperCase()}: ${amount} ${fromToken} → ${toToken}`);
      const res = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          from_token: fromToken,
          to_token: toToken,
          slippage_bps: 100,
        }),
      });
      const swap: Swap = await res.json();
      if (!res.ok) {
        setStats((s) => ({ ...s, failures: s.failures + 1 }));
        log(
          "error",
          `swap rejected: ${JSON.stringify((swap as unknown as { error?: unknown }).error)}`,
        );
        return;
      }
      activeSwapRef.current = { swap, amount, from: fromToken, to: toToken };
      setStats((s) => ({ ...s, trades: s.trades + 1 }));
      log("trade", `swap ${swap.id} accepted (${swap.status})`);
      onSubmitted(swap, amount, fromToken, toToken);
    } catch (error) {
      log("error", error instanceof Error ? error.message : "tick crashed");
    } finally {
      tickingRef.current = false;
    }
  }, [log, sizeUsd]);

  const start = useCallback(() => {
    if (timerRef.current) return;
    const snap = optsRef.current.getSnapshot();
    setStats({
      trades: 0,
      fills: 0,
      failures: 0,
      startValueUsd: snap.totalUsd,
      lastSignal: null,
    });
    setRunning(true);
    log(
      "info",
      `bot started — every ${intervalSec}s, $${sizeUsd} per trade, sma(12) mean reversion + news sentiment`,
    );
    tick();
    timerRef.current = setInterval(tick, intervalSec * 1000);
  }, [intervalSec, sizeUsd, tick, log]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
    log("info", "bot stopped");
  }, [log]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    running,
    start,
    stop,
    logs,
    stats,
    intervalSec,
    setIntervalSec,
    sizeUsd,
    setSizeUsd,
  };
}
