"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatToken, formatUsd } from "@/lib/format";
import type { Account } from "@/lib/types";

export function StatCards({
  account,
  btcPrice,
  loading,
}: {
  account: Account | null;
  btcPrice: number | null;
  loading: boolean;
}) {
  const tokens = account?.balance?.tokens ?? [];
  const usdt = Number(
    tokens.find((t) => t.symbol?.toUpperCase().startsWith("USDT"))?.balance ?? 0,
  );
  const btc = Number(
    tokens.find((t) => t.symbol?.toUpperCase() === "CBBTC")?.balance ?? 0,
  );
  const btcUsd = btcPrice ? btc * btcPrice : null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat
        label="Portfolio value"
        loading={loading}
        value={formatUsd(account?.balance?.total_usd)}
        accent="text-zinc-50"
      />
      <Stat
        label="USDT (cash)"
        loading={loading}
        value={formatToken(usdt, 2)}
        sub={formatUsd(usdt)}
        accent="text-emerald-400"
      />
      <Stat
        label="cbBTC (bitcoin)"
        loading={loading}
        value={formatToken(btc)}
        sub={btcUsd != null ? formatUsd(btcUsd) : "—"}
        accent="text-orange-400"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  loading: boolean;
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-28 bg-zinc-800" />
        ) : (
          <>
            <div className={`font-mono text-2xl font-semibold tabular-nums ${accent}`}>
              {value}
            </div>
            {sub && (
              <div className="mt-1 font-mono text-xs tabular-nums text-zinc-500">{sub}</div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
