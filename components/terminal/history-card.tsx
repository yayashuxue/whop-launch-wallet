"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime, shortHash } from "@/lib/format";
import { TERMINAL_FAIL, TERMINAL_OK, type HistoryEntry } from "@/lib/types";

export function HistoryCard({ entries }: { entries: HistoryEntry[] }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">Trade history</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-6 text-center text-xs text-zinc-600">
            No trades yet — your swaps will show up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2 font-mono text-xs tabular-nums"
              >
                <div className="space-y-0.5">
                  <div className="text-zinc-200">
                    {entry.amount} {entry.fromToken}
                    <span className="text-zinc-600"> → </span>
                    {entry.toToken}
                  </div>
                  <div className="text-zinc-600">
                    {formatTime(entry.at)} · {entry.id}
                    {entry.txHashes?.map((hash) => (
                      <a
                        key={hash}
                        href={`https://basescan.org/tx/${hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-orange-400/70 hover:text-orange-300"
                      >
                        {shortHash(hash)} ↗
                      </a>
                    ))}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    TERMINAL_OK.includes(entry.status)
                      ? "border-emerald-800 bg-emerald-950/60 text-emerald-400"
                      : TERMINAL_FAIL.includes(entry.status)
                        ? "border-red-800 bg-red-950/60 text-red-400"
                        : "border-amber-800 bg-amber-950/60 text-amber-400"
                  }
                >
                  {entry.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
