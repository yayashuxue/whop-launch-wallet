"use client";

import { useEffect, useMemo, useState } from "react";
import { aggregateSentiment, type NewsItem } from "@/lib/news";

const POLL_MS = 120_000;

export function useNews() {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) return;
        const json: NewsItem[] = await res.json();
        if (!cancelled && Array.isArray(json)) setItems(json);
      } catch {
        // keep showing the last good feed
      }
    }
    load();
    const handle = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  const sentiment = useMemo(() => aggregateSentiment(items), [items]);
  return { items, sentiment };
}
