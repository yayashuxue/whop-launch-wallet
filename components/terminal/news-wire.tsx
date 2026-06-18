"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SentimentMark } from "@/components/terminal/ticker-tape";
import type { NewsItem } from "@/lib/news";

export function NewsWire({
  items,
  sentiment,
}: {
  items: NewsItem[];
  sentiment: number | null;
}) {
  const wire = items.slice(0, 14);

  return (
    <Card className="flex h-full flex-col border-zinc-800 bg-zinc-900/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-400">
          News wire
          <span className="ml-2 text-xs text-zinc-600">signal input</span>
        </CardTitle>
        <SentimentBadge sentiment={sentiment} />
      </CardHeader>
      <CardContent className="flex-1">
        <div className="relative h-full min-h-72 overflow-hidden rounded-lg border border-zinc-800 bg-black/40">
          {wire.length === 0 ? (
            <div className="flex h-full items-center justify-center font-mono text-xs text-zinc-700">
              scanning news sources…<span className="animate-pulse">▌</span>
            </div>
          ) : (
            <>
              <div className="animate-[wire-flow_50s_linear_infinite] hover:[animation-play-state:paused]">
                {[...wire, ...wire].map((item, i) => (
                  <WireItem key={`${item.id}-${i}`} item={item} />
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-zinc-950 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-950 to-transparent" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WireItem({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noreferrer"
      className="flex gap-2 border-b border-zinc-900 px-3 py-2.5 transition-colors hover:bg-zinc-900/60"
    >
      <span className="mt-0.5 text-xs">
        <SentimentMark score={item.score} />
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 text-xs leading-snug text-zinc-300">{item.title}</span>
        <span className="mt-0.5 block font-mono text-[10px] text-zinc-600">
          {item.source} · {ago(item.publishedAt)}
        </span>
      </span>
    </a>
  );
}

function SentimentBadge({ sentiment }: { sentiment: number | null }) {
  if (sentiment == null) {
    return (
      <Badge variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-500">
        no data
      </Badge>
    );
  }
  const pct = Math.round(sentiment * 100);
  const bullish = sentiment > 0.05;
  const bearish = sentiment < -0.05;
  return (
    <Badge
      variant="outline"
      className={
        bullish
          ? "border-emerald-800 bg-emerald-950/60 font-mono text-emerald-400"
          : bearish
            ? "border-red-800 bg-red-950/60 font-mono text-red-400"
            : "border-zinc-700 bg-zinc-950 font-mono text-zinc-400"
      }
    >
      {bullish ? "bullish" : bearish ? "bearish" : "neutral"} {pct >= 0 ? "+" : ""}
      {pct}%
    </Badge>
  );
}

function ago(ts: number) {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
