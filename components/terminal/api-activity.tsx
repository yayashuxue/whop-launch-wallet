"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/format";
import type { ApiCall } from "@/lib/whop";

export function ApiActivity({ calls, total }: { calls: ApiCall[]; total: number }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Whop API
          <span className="ml-2 font-mono text-xs text-zinc-600">api.whop.com/api/v1</span>
        </CardTitle>
        <Badge variant="outline" className="border-zinc-700 bg-zinc-950 font-mono text-zinc-400">
          {total} calls
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="h-52 overflow-y-auto rounded-lg border border-zinc-800 bg-black/40 font-mono text-xs">
          {calls.length === 0 ? (
            <div className="flex h-full items-center justify-center text-zinc-700">
              waiting for requests…<span className="animate-pulse">▌</span>
            </div>
          ) : (
            calls.map((call) => (
              <div
                key={call.id}
                className="flex animate-in items-center gap-2 border-b border-zinc-900 px-3 py-1.5 fade-in slide-in-from-top-1"
              >
                <span
                  className={`w-11 shrink-0 font-semibold ${
                    call.method === "GET" ? "text-sky-400" : "text-orange-400"
                  }`}
                >
                  {call.method}
                </span>
                <span className="min-w-0 flex-1 truncate text-zinc-300">{call.path}</span>
                <span
                  className={`shrink-0 tabular-nums ${
                    call.status >= 200 && call.status < 300 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {call.status || "ERR"}
                </span>
                <span className="w-14 shrink-0 text-right tabular-nums text-zinc-500">
                  {call.ms}ms
                </span>
                <span className="hidden w-16 shrink-0 text-right tabular-nums text-zinc-700 sm:block">
                  {formatTime(call.t)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
