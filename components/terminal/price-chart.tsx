"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime, formatUsd } from "@/lib/format";

export type PricePoint = { t: number; price: number };

export function PriceChart({
  series,
  feedError,
}: {
  series: PricePoint[];
  feedError?: string | null;
}) {
  const latest = series[series.length - 1];
  const first = series[0];
  const changePct =
    latest && first && first.price > 0
      ? ((latest.price - first.price) / first.price) * 100
      : 0;
  const up = changePct >= 0;

  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium text-zinc-400">
            BTC / USDT
            <span className="ml-2 text-xs text-zinc-600">via swap quotes</span>
          </CardTitle>
          {latest ? (
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold tabular-nums text-zinc-50">
                {formatUsd(latest.price)}
              </span>
              <Badge
                variant="outline"
                className={
                  up
                    ? "border-emerald-800 bg-emerald-950/60 text-emerald-400"
                    : "border-red-800 bg-red-950/60 text-red-400"
                }
              >
                {up ? "▲" : "▼"} {Math.abs(changePct).toFixed(3)}%
              </Badge>
            </div>
          ) : (
            <Skeleton className="mt-2 h-9 w-44 bg-zinc-800" />
          )}
        </div>
        {latest && (
          <span className="font-mono text-xs text-zinc-600">
            updated {formatTime(latest.t)}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {feedError && series.length < 2 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-1 text-xs">
            <span className="text-red-400">Quote feed unavailable</span>
            <span className="max-w-md truncate font-mono text-zinc-600">{feedError}</span>
          </div>
        ) : (
          <Sparkline series={series} up={up} />
        )}
      </CardContent>
    </Card>
  );
}

function Sparkline({ series, up }: { series: PricePoint[]; up: boolean }) {
  if (series.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-zinc-600">
        Collecting quotes — chart fills in as prices stream…
      </div>
    );
  }

  const W = 800;
  const H = 160;
  const prices = series.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = (max - min || max * 0.001 || 1) * 0.15;
  const lo = min - pad;
  const hi = max + pad;

  const x = (i: number) => (i / (series.length - 1)) * W;
  const y = (price: number) => H - ((price - lo) / (hi - lo)) * H;

  const line = series
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(p.price).toFixed(2)}`)
    .join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const color = up ? "#34d399" : "#f87171";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-40 w-full"
      role="img"
      aria-label="BTC price chart"
    >
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chart-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
