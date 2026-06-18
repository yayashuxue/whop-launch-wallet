"use client";

import {
  ArrowDownToLine,
  BadgeDollarSign,
  Bitcoin,
  Bolt,
  Check,
  CreditCard,
  Landmark,
  LockKeyhole,
  Megaphone,
  Play,
  ReceiptText,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatTime, formatUsd } from "@/lib/format";
import type { LaunchCard, LaunchEvent, LaunchState, LaunchTransaction } from "@/lib/types";

const INITIAL_STATE: LaunchState = {
  launchName: "AI fitness offer launch",
  accountId: null,
  depositAddress: null,
  balanceUsd: 0,
  reserveUsd: 500,
  profitTargetUsd: 2500,
  revenueUsd: 0,
  cards: [],
  transactions: [],
  events: [],
  mode: "demo",
};

const FLOW = [
  { action: "create_wallet", label: "Create launch wallet" },
  { action: "request_deposit", label: "Fund with USDC" },
  { action: "issue_card", label: "Issue spend card" },
  { action: "record_sale", label: "Record first sales" },
  { action: "sweep_profit", label: "Sweep profit" },
] as const;

export function Dashboard() {
  const [state, setState] = useState<LaunchState>(INITIAL_STATE);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/launch", { cache: "no-store" });
    const json = await res.json();
    if (res.ok) setState(json);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runAction = useCallback(
    async (action: string) => {
      setBusyAction(action);
      try {
        const res = await fetch("/api/launch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(json.error ?? json));
        setState(json);
        toast.success(FLOW.find((item) => item.action === action)?.label ?? "Updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      } finally {
        setBusyAction(null);
      }
    },
    [],
  );

  const profitUsd = Math.max(0, state.balanceUsd - state.reserveUsd);
  const spentUsd = state.cards.reduce((sum, card) => sum + card.spentUsd, 0);
  const availableToSpend = Math.max(0, state.balanceUsd - state.reserveUsd);
  const progress = Math.min(100, Math.round((profitUsd / state.profitTargetUsd) * 100));
  const activeCards = state.cards.filter((card) => card.status === "active").length;

  const nextAction = useMemo(() => {
    if (!state.accountId) return "create_wallet";
    if (!state.depositAddress || state.balanceUsd === 0) return "request_deposit";
    if (activeCards === 0) return "issue_card";
    if (state.revenueUsd === 0) return "record_sale";
    return "sweep_profit";
  }, [activeCards, state.accountId, state.balanceUsd, state.depositAddress, state.revenueUsd]);

  return (
    <main className="min-h-screen bg-[#f1f1f1] text-[#151515]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <Header state={state} onRefresh={refresh} />

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Hero
            balanceUsd={state.balanceUsd}
            profitUsd={profitUsd}
            progress={progress}
            mode={state.mode}
            nextAction={nextAction}
            busyAction={busyAction}
            onAction={runAction}
          />
          <CommandPanel
            nextAction={nextAction}
            busyAction={busyAction}
            onAction={runAction}
            accountId={state.accountId}
            depositAddress={state.depositAddress}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric
            icon={<WalletCards />}
            label="Launch wallet"
            value={formatUsd(state.balanceUsd)}
            detail={`${formatUsd(availableToSpend)} spendable after reserve`}
          />
          <Metric
            icon={<CreditCard />}
            label="Cards live"
            value={`${activeCards}/${Math.max(3, state.cards.length || 3)}`}
            detail={`${formatUsd(spentUsd)} captured spend`}
          />
          <Metric
            icon={<TrendingUp />}
            label="Revenue tracked"
            value={formatUsd(state.revenueUsd)}
            detail={`${progress}% of profit target`}
          />
          <Metric
            icon={<Bitcoin />}
            label="Profit sweep"
            value={formatUsd(profitUsd)}
            detail="reserve protected before trades"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <SpendCards cards={state.cards} />
          <LaunchLedger transactions={state.transactions} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <BusinessCase />
          <ApiTimeline events={state.events} />
        </section>
      </div>
    </main>
  );
}

function Header({ state, onRefresh }: { state: LaunchState; onRefresh: () => void }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d7d7d2] bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-[#fa4616] text-lg font-black text-white">
          w
        </div>
        <div>
          <p className="text-sm font-medium text-[#77766f]">Whop Wallet concept</p>
          <h1 className="text-xl font-semibold tracking-normal">Launch Wallet</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-[#d7d7d2] bg-[#f7f7f4] px-3 py-1 text-sm">
          {state.mode === "live" ? "Live API" : "Demo API-safe mode"}
        </span>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw />
          Sync
        </Button>
      </div>
    </header>
  );
}

function Hero({
  balanceUsd,
  profitUsd,
  progress,
  mode,
  nextAction,
  busyAction,
  onAction,
}: {
  balanceUsd: number;
  profitUsd: number;
  progress: number;
  mode: string;
  nextAction: string;
  busyAction: string | null;
  onAction: (action: string) => void;
}) {
  return (
    <div className="rounded-lg bg-[#151515] p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-[#c1fa81]">
            <Sparkles className="size-4" />
            internet entrepreneurs need a launch treasury
          </p>
          <h2 className="max-w-2xl text-4xl font-medium leading-[1.03] tracking-normal sm:text-5xl">
            one wallet to fund growth, issue cards, and sweep profit.
          </h2>
        </div>
        <Button
          size="lg"
          className="h-11 bg-[#fa4616] px-4 text-base font-semibold text-white hover:bg-[#e33b12]"
          disabled={!!busyAction}
          onClick={() => onAction(nextAction)}
        >
          {busyAction ? <RefreshCw className="animate-spin" /> : <Play />}
          {FLOW.find((item) => item.action === nextAction)?.label ?? "Run flow"}
        </Button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <HeroStat label="wallet balance" value={formatUsd(balanceUsd)} />
        <HeroStat label="sweepable profit" value={formatUsd(profitUsd)} />
        <HeroStat label="mode" value={mode === "live" ? "live" : "demo"} />
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm text-[#b6b5b0]">
          <span>profit target</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#c1fa81]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="text-sm text-[#b6b5b0]">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function CommandPanel({
  nextAction,
  busyAction,
  onAction,
  accountId,
  depositAddress,
}: {
  nextAction: string;
  busyAction: string | null;
  onAction: (action: string) => void;
  accountId: string | null;
  depositAddress: string | null;
}) {
  return (
    <div className="rounded-lg border border-[#d7d7d2] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-[#77766f]">v1 flow</p>
          <h3 className="text-xl font-semibold">Launch operating system</h3>
        </div>
        <Rocket className="size-6 text-[#fa4616]" />
      </div>

      <div className="mt-4 space-y-2">
        {FLOW.map((step, index) => {
          const isNext = step.action === nextAction;
          const done = FLOW.findIndex((item) => item.action === nextAction) > index;
          return (
            <button
              key={step.action}
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                isNext
                  ? "border-[#fa4616] bg-[#fff1eb]"
                  : done
                    ? "border-[#d9ecd0] bg-[#f2ffe9]"
                    : "border-[#e5e5df] bg-[#fafaf7] hover:bg-[#f5f5f0]"
              }`}
              disabled={!!busyAction}
              onClick={() => onAction(step.action)}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex size-7 items-center justify-center rounded-md ${
                    done ? "bg-[#c1fa81]" : isNext ? "bg-[#fa4616] text-white" : "bg-white"
                  }`}
                >
                  {done ? <Check className="size-4" /> : index + 1}
                </span>
                <span>
                  <span className="block font-medium">{step.label}</span>
                  <span className="text-sm text-[#77766f]">{stepCopy(step.action)}</span>
                </span>
              </span>
              {busyAction === step.action && <RefreshCw className="size-4 animate-spin" />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <Identity label="account" value={accountId ?? "not created"} />
        <Identity label="deposit" value={depositAddress ?? "not requested"} />
      </div>
    </div>
  );
}

function stepCopy(action: string) {
  if (action === "create_wallet") return "child account for one launch";
  if (action === "request_deposit") return "bank, card, or crypto float";
  if (action === "issue_card") return "vendor card with KPI guardrail";
  if (action === "record_sale") return "Whop checkout revenue event";
  return "convert surplus into long-term asset";
}

function Identity({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-[#f7f7f4] px-3 py-2">
      <span className="text-[#77766f]">{label}</span>
      <span className="max-w-[240px] truncate font-mono text-xs">{value}</span>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[#d7d7d2] bg-white p-4">
      <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-[#151515] text-white">
        {icon}
      </div>
      <div className="text-sm text-[#77766f]">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      <p className="mt-2 text-sm text-[#77766f]">{detail}</p>
    </div>
  );
}

function SpendCards({ cards }: { cards: LaunchCard[] }) {
  const visibleCards = cards.length
    ? cards
    : [
        {
          id: "placeholder",
          label: "Acquire",
          vendor: "create wallet first",
          limitUsd: 0,
          spentUsd: 0,
          status: "draft" as const,
          last4: "----",
          metric: "waiting for launch account",
        },
      ];
  return (
    <div className="rounded-lg border border-[#d7d7d2] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#77766f]">virtual visa cards</p>
          <h3 className="text-xl font-semibold">Spend by workstream</h3>
        </div>
        <CreditCard className="text-[#fa4616]" />
      </div>
      <div className="mt-4 grid gap-3">
        {visibleCards.map((card) => (
          <div key={card.id} className="rounded-lg border border-[#e2e1dc] bg-[#fafaf7] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{card.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      card.status === "active"
                        ? "bg-[#c1fa81] text-[#151515]"
                        : "bg-[#eeeeea] text-[#77766f]"
                    }`}
                  >
                    {card.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#77766f]">{card.vendor}</p>
              </div>
              <div className="text-right font-mono text-sm">•• {card.last4}</div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-sm">
                <span>{formatUsd(card.spentUsd)} spent</span>
                <span>{formatUsd(card.limitUsd)} limit</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e8e8e2]">
                <div
                  className="h-full rounded-full bg-[#354b98]"
                  style={{
                    width: `${Math.min(100, (card.spentUsd / Math.max(1, card.limitUsd)) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-[#77766f]">
              <ShieldCheck className="size-4" />
              {card.metric}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LaunchLedger({ transactions }: { transactions: LaunchTransaction[] }) {
  return (
    <div className="rounded-lg border border-[#d7d7d2] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#77766f]">treasury ledger</p>
          <h3 className="text-xl font-semibold">Money movement</h3>
        </div>
        <ReceiptText className="text-[#fa4616]" />
      </div>
      <div className="mt-4 space-y-2">
        {transactions.length === 0 ? (
          <EmptyState text="Run the first flow to create a ledger event." />
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg bg-[#fafaf7] px-3 py-2">
              <div className="flex items-center gap-3">
                <TransactionIcon kind={tx.kind} />
                <div>
                  <div className="font-medium">{tx.label}</div>
                  <div className="text-sm text-[#77766f]">{formatTime(tx.at)} · {tx.status}</div>
                </div>
              </div>
              <div className="font-semibold tabular-nums">{formatUsd(tx.amountUsd)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TransactionIcon({ kind }: { kind: LaunchTransaction["kind"] }) {
  const icon =
    kind === "deposit" ? <ArrowDownToLine /> : kind === "sale" ? <BadgeDollarSign /> : kind === "sweep" ? <Bitcoin /> : <CreditCard />;
  return <span className="flex size-9 items-center justify-center rounded-md bg-[#f1f1f1] text-[#151515]">{icon}</span>;
}

function BusinessCase() {
  return (
    <div className="rounded-lg border border-[#d7d7d2] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#77766f]">business model</p>
          <h3 className="text-xl font-semibold">Why this can make money</h3>
        </div>
        <Landmark className="text-[#fa4616]" />
      </div>
      <div className="mt-4 grid gap-3">
        <BusinessPoint
          icon={<Megaphone />}
          title="Who pays"
          text="Whop sellers running paid communities, courses, signals, or AI products need a cleaner way to separate launch capital from personal cards."
        />
        <BusinessPoint
          icon={<Bolt />}
          title="How it monetizes"
          text="Freemium treasury dashboard, then 1% of virtual-card spend or $29/mo for higher limits, approvals, and profit automation."
        />
        <BusinessPoint
          icon={<LockKeyhole />}
          title="Key metric"
          text="Net revenue retained per launch: card spend, deposits, sales captured, and profit swept without leaving Whop."
        />
      </div>
    </div>
  );
}

function BusinessPoint({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-[#fafaf7] p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#151515] text-white">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <p className="mt-1 text-sm leading-5 text-[#77766f]">{text}</p>
      </div>
    </div>
  );
}

function ApiTimeline({ events }: { events: LaunchEvent[] }) {
  return (
    <div className="rounded-lg border border-[#d7d7d2] bg-[#151515] p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#b6b5b0]">server-side Whop calls</p>
          <h3 className="text-xl font-semibold">API trace</h3>
        </div>
        <LockKeyhole className="text-[#c1fa81]" />
      </div>
      <div className="mt-4 space-y-2">
        {events.length === 0 ? (
          <EmptyState text="Actions will stream here with method, path, and latency." dark />
        ) : (
          events.map((event) => (
            <div key={event.id} className="grid grid-cols-[auto_56px_1fr_auto] items-center gap-3 rounded-lg bg-white/10 px-3 py-2 font-mono text-sm">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${
                  event.mode === "live"
                    ? "bg-[#c1fa81] text-[#151515]"
                    : "bg-[#fa4616] text-white"
                }`}
              >
                {event.mode === "live" ? "LIVE" : "DEMO"}
              </span>
              <span className="text-[#c1fa81]">{event.method}</span>
              <span className="truncate">{event.path}</span>
              <span className="text-right text-[#b6b5b0]">{event.status || "—"} · {event.ms}ms</span>
              <span className="col-span-4 text-xs text-[#b6b5b0]">{event.summary}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <div className={`rounded-lg border border-dashed p-4 text-sm ${dark ? "border-white/20 text-[#b6b5b0]" : "border-[#d7d7d2] text-[#77766f]"}`}>
      {text}
    </div>
  );
}
