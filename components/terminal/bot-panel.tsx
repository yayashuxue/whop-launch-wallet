"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatUsd } from "@/lib/format";
import type { BotStats } from "@/hooks/use-bot";

export function BotPanel({
  running,
  start,
  stop,
  stats,
  currentValueUsd,
  intervalSec,
  setIntervalSec,
  sizeUsd,
  setSizeUsd,
}: {
  running: boolean;
  start: () => void;
  stop: () => void;
  stats: BotStats;
  currentValueUsd: number;
  intervalSec: number;
  setIntervalSec: (v: number) => void;
  sizeUsd: number;
  setSizeUsd: (v: number) => void;
}) {
  const pnl =
    stats.startValueUsd != null ? currentValueUsd - stats.startValueUsd : null;

  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-400">Autotrader</CardTitle>
        <Badge
          variant="outline"
          className={
            running
              ? "border-emerald-800 bg-emerald-950/60 text-emerald-400"
              : "border-zinc-700 bg-zinc-950 text-zinc-500"
          }
        >
          <span
            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
              running ? "animate-pulse bg-emerald-400" : "bg-zinc-600"
            }`}
          />
          {running ? "RUNNING" : "STOPPED"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs text-zinc-500">
            Interval (sec)
            <Input
              type="number"
              min={5}
              value={intervalSec}
              disabled={running}
              onChange={(e) => setIntervalSec(Math.max(5, Number(e.target.value) || 10))}
              className="border-zinc-800 bg-zinc-950 font-mono tabular-nums"
            />
          </label>
          <label className="space-y-1 text-xs text-zinc-500">
            Trade size ($)
            <Input
              type="number"
              min={0.5}
              step={0.5}
              value={sizeUsd}
              disabled={running}
              onChange={(e) => setSizeUsd(Math.max(0.5, Number(e.target.value) || 1))}
              className="border-zinc-800 bg-zinc-950 font-mono tabular-nums"
            />
          </label>
        </div>

        <Button
          className={
            running
              ? "w-full bg-red-500 font-bold text-zinc-950 hover:bg-red-400"
              : "w-full bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
          }
          onClick={running ? stop : start}
        >
          {running ? "■ STOP BOT" : "▶ START BOT"}
        </Button>

        <div className="grid grid-cols-3 gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-center font-mono text-xs tabular-nums">
          <MiniStat label="trades" value={String(stats.trades)} />
          <MiniStat label="fills" value={String(stats.fills)} accent="text-emerald-400" />
          <MiniStat
            label="session p&l"
            value={pnl == null ? "—" : `${pnl >= 0 ? "+" : ""}${formatUsd(pnl)}`}
            accent={pnl == null ? undefined : pnl >= 0 ? "text-emerald-400" : "text-red-400"}
          />
        </div>

        <p className="text-xs leading-relaxed text-zinc-600">
          Strategy: <span className="text-zinc-400">SMA(12) mean reversion + news sentiment</span>{" "}
          — scans the news wire every tick; strong bullish or bearish headline flow overrides
          the technicals, otherwise price vs. moving average decides. Flips sides if one leg
          lacks funds and never stacks swaps.
        </p>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <div className={`text-sm font-semibold ${accent ?? "text-zinc-200"}`}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
    </div>
  );
}
