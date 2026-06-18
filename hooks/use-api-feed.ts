"use client";

import { useEffect, useState } from "react";
import type { ApiCall } from "@/lib/whop";

const POLL_MS = 2_000;

export function useApiFeed() {
  const [calls, setCalls] = useState<ApiCall[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/activity");
        if (!res.ok) return;
        const json: { total: number; calls: ApiCall[] } = await res.json();
        if (!cancelled) {
          setCalls(json.calls.slice().reverse());
          setTotal(json.total);
        }
      } catch {
        // keep last known feed
      }
    }
    load();
    const handle = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  return { calls, total };
}
