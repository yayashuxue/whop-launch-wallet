"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DepositCard() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reveal() {
    setLoading(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 10 }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Could not fetch deposit address", {
          description: JSON.stringify(json.error),
        });
        return;
      }
      const evm = json.deposit_address?.evm;
      if (evm) setAddress(evm);
      else toast.info("Deposit address still provisioning — try again shortly");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success("Address copied");
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">Deposit funds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {address ? (
          <button
            type="button"
            onClick={copy}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-left font-mono text-xs break-all text-zinc-300 transition-colors hover:border-orange-800 hover:text-orange-300"
            title="Click to copy"
          >
            {address}
          </button>
        ) : (
          <Button
            variant="outline"
            className="w-full border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800"
            onClick={reveal}
            disabled={loading}
          >
            {loading ? "Fetching…" : "Reveal deposit address"}
          </Button>
        )}
        <p className="text-xs leading-relaxed text-zinc-600">
          Send <span className="text-zinc-400">USDC on Base</span> to this address. Deposits
          are swept and auto-converted to USDT in ~10 minutes. Amounts under ~$10 fall below
          the sweep minimum and will not credit.
        </p>
      </CardContent>
    </Card>
  );
}
