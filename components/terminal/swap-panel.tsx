"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatToken, shortHash } from "@/lib/format";
import {
  TERMINAL_FAIL,
  TERMINAL_OK,
  type Quote,
  type Swap,
} from "@/lib/types";

const SLIPPAGE_BPS = 100;

export function SwapPanel({
  usdtBalance,
  btcBalance,
  onSettled,
  onSubmitted,
}: {
  usdtBalance: number;
  btcBalance: number;
  onSettled: (swap: Swap) => void;
  onSubmitted: (swap: Swap, amount: string, fromToken: string, toToken: string) => void;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("10");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeSwap, setActiveSwap] = useState<Swap | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fromToken = side === "buy" ? "USDT" : "cbBTC";
  const toToken = side === "buy" ? "cbBTC" : "USDT";
  const available = side === "buy" ? usdtBalance : btcBalance;
  const amountNum = Number(amount);
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;

  useEffect(() => {
    setQuote(null);
    if (!amountValid) return;
    setQuoting(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            from_token: fromToken,
            to_token: toToken,
            slippage_bps: SLIPPAGE_BPS,
          }),
        });
        const json = await res.json();
        if (res.ok) setQuote(json);
      } finally {
        setQuoting(false);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [amount, fromToken, toToken, amountValid]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function execute() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          from_token: fromToken,
          to_token: toToken,
          slippage_bps: SLIPPAGE_BPS,
        }),
      });
      const swap: Swap = await res.json();
      if (!res.ok) {
        toast.error("Swap rejected", {
          description: JSON.stringify((swap as unknown as { error?: unknown }).error),
        });
        return;
      }
      toast.success(`Swap ${swap.id} submitted`);
      setActiveSwap(swap);
      onSubmitted(swap, amount, fromToken, toToken);
      pollRef.current = setInterval(async () => {
        const statusRes = await fetch(`/api/swaps/${encodeURIComponent(swap.id)}`);
        if (!statusRes.ok) return;
        const status: Swap = await statusRes.json();
        setActiveSwap({ ...swap, ...status });
        if (TERMINAL_OK.includes(status.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
          toast.success(`Swap settled: ${amount} ${fromToken} → ${toToken}`);
          onSettled({ ...swap, ...status });
        } else if (TERMINAL_FAIL.includes(status.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
          toast.error(`Swap failed: ${status.error ?? "unknown error"}`);
          onSettled({ ...swap, ...status });
        }
      }, 5000);
    } finally {
      setSubmitting(false);
    }
  }

  const swapInFlight =
    activeSwap != null &&
    !TERMINAL_OK.includes(activeSwap.status) &&
    !TERMINAL_FAIL.includes(activeSwap.status);

  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-400">Trade</CardTitle>
        <div className="flex gap-1 rounded-lg bg-zinc-950 p-1">
          <SideButton active={side === "buy"} onClick={() => setSide("buy")} color="buy">
            Buy BTC
          </SideButton>
          <SideButton active={side === "sell"} onClick={() => setSide("sell")} color="sell">
            Sell BTC
          </SideButton>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
            <span>Amount ({fromToken})</span>
            <button
              type="button"
              className="font-mono tabular-nums hover:text-zinc-300"
              onClick={() => setAmount(String(available))}
            >
              max {formatToken(available)}
            </button>
          </div>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="border-zinc-800 bg-zinc-950 font-mono text-lg tabular-nums"
          />
        </div>

        <div className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 font-mono text-xs tabular-nums">
          <QuoteRow
            label={`You receive (${toToken})`}
            value={quoting ? "…" : quote ? `≈ ${formatToken(quote.amount_out)}` : "—"}
            strong
          />
          <QuoteRow
            label="Minimum after slippage"
            value={quote?.amount_out_min != null ? formatToken(quote.amount_out_min) : "—"}
          />
          <QuoteRow
            label="Fee"
            value={quote?.fee_bps != null ? `${quote.fee_bps} bps` : "—"}
          />
          <QuoteRow
            label="Rate"
            value={quote?.rate != null ? String(quote.rate) : "—"}
          />
        </div>

        <Button
          className={
            side === "buy"
              ? "w-full bg-orange-500 font-semibold text-zinc-950 hover:bg-orange-400"
              : "w-full bg-emerald-500 font-semibold text-zinc-950 hover:bg-emerald-400"
          }
          disabled={!amountValid || !quote || submitting || swapInFlight}
          onClick={execute}
        >
          {submitting
            ? "Submitting…"
            : swapInFlight
              ? "Swap in flight…"
              : side === "buy"
                ? `Buy bitcoin with ${amount || "0"} USDT`
                : `Sell ${amount || "0"} cbBTC`}
        </Button>

        {activeSwap && (
          <>
            <Separator className="bg-zinc-800" />
            <ActiveSwap swap={activeSwap} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SideButton({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: "buy" | "sell";
  children: React.ReactNode;
}) {
  const activeClass =
    color === "buy" ? "bg-orange-500 text-zinc-950" : "bg-emerald-500 text-zinc-950";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
        active ? activeClass : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function QuoteRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={strong ? "text-zinc-100" : "text-zinc-400"}>{value}</span>
    </div>
  );
}

function ActiveSwap({ swap }: { swap: Swap }) {
  const ok = TERMINAL_OK.includes(swap.status);
  const failed = TERMINAL_FAIL.includes(swap.status);
  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-zinc-500">{swap.id}</span>
        <Badge
          variant="outline"
          className={
            ok
              ? "border-emerald-800 bg-emerald-950/60 text-emerald-400"
              : failed
                ? "border-red-800 bg-red-950/60 text-red-400"
                : "animate-pulse border-amber-800 bg-amber-950/60 text-amber-400"
          }
        >
          {swap.status}
        </Badge>
      </div>
      {swap.tx_hashes?.map((hash) => (
        <a
          key={hash}
          href={`https://basescan.org/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
          className="block font-mono text-orange-400/80 hover:text-orange-300"
        >
          tx {shortHash(hash)} ↗
        </a>
      ))}
      {swap.error && <p className="text-red-400">{swap.error}</p>}
    </div>
  );
}
