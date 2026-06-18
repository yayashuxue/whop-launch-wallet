"use client";

import type { NewsItem } from "@/lib/news";

export function TickerTape({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;
  const tape = items.slice(0, 20);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/80">
      <div className="flex w-max animate-[ticker-scroll_70s_linear_infinite] items-center gap-8 whitespace-nowrap px-4 py-1.5 font-mono text-xs hover:[animation-play-state:paused]">
        {[...tape, ...tape].map((item, i) => (
          <a
            key={`${item.id}-${i}`}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <SentimentMark score={item.score} />
            <span>{item.title}</span>
            <span className="text-zinc-700">· {item.source}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function SentimentMark({ score }: { score: number }) {
  if (score > 0) return <span className="text-emerald-400">▲</span>;
  if (score < 0) return <span className="text-red-400">▼</span>;
  return <span className="text-zinc-600">•</span>;
}
