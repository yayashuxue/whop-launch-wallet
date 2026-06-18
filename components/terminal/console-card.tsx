"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/format";
import type { LogEntry, LogLevel } from "@/hooks/use-bot";

const LEVEL_STYLES: Record<LogLevel, { tag: string; klass: string }> = {
  info: { tag: "info", klass: "text-zinc-500" },
  signal: { tag: "sig ", klass: "text-sky-400" },
  news: { tag: "news", klass: "text-violet-400" },
  trade: { tag: "exec", klass: "text-orange-400" },
  success: { tag: "fill", klass: "text-emerald-400" },
  error: { tag: "err ", klass: "text-red-400" },
};

export function ConsoleCard({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-400">Bot console</CardTitle>
        <span className="font-mono text-xs text-zinc-600">{logs.length} events</span>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="h-56 overflow-y-auto rounded-lg border border-zinc-800 bg-black/60 p-3 font-mono text-xs leading-relaxed"
        >
          {logs.length === 0 ? (
            <span className="text-zinc-700">
              $ idle — press START BOT to begin trading
              <span className="animate-pulse">▌</span>
            </span>
          ) : (
            logs.map((entry) => {
              const style = LEVEL_STYLES[entry.level];
              return (
                <div key={entry.id} className="whitespace-pre-wrap break-all">
                  <span className="text-zinc-700">{formatTime(entry.t)} </span>
                  <span className={style.klass}>[{style.tag}]</span>{" "}
                  <span className="text-zinc-300">{entry.msg}</span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
