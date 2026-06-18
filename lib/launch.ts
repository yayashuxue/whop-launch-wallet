import { WhopApiError, whop } from "@/lib/whop";

type CardStatus = "draft" | "active" | "paused";
type TransactionKind = "deposit" | "card_spend" | "sale" | "sweep";
type ApiMode = "demo" | "live";

export type LaunchCard = {
  id: string;
  label: string;
  vendor: string;
  limitUsd: number;
  spentUsd: number;
  status: CardStatus;
  last4: string;
  metric: string;
};

export type LaunchTransaction = {
  id: string;
  at: number;
  kind: TransactionKind;
  label: string;
  amountUsd: number;
  status: "posted" | "pending" | "settled";
};

export type LaunchEvent = {
  id: string;
  at: number;
  method: string;
  path: string;
  status: number;
  ms: number;
  mode: ApiMode;
  summary: string;
};

export type LaunchState = {
  launchName: string;
  accountId: string | null;
  depositAddress: string | null;
  balanceUsd: number;
  reserveUsd: number;
  profitTargetUsd: number;
  revenueUsd: number;
  cards: LaunchCard[];
  transactions: LaunchTransaction[];
  events: LaunchEvent[];
  mode: ApiMode;
};

type LaunchAction =
  | { action: "create_wallet" }
  | { action: "request_deposit"; amountUsd?: number }
  | { action: "issue_card"; label?: string; vendor?: string; limitUsd?: number; metric?: string }
  | { action: "record_sale"; amountUsd?: number }
  | { action: "sweep_profit"; amountUsd?: number };

const DEFAULT_CARDS: Omit<LaunchCard, "id" | "last4" | "status" | "spentUsd">[] = [
  {
    label: "Acquire",
    vendor: "Meta + TikTok ads",
    limitUsd: 750,
    metric: "CAC < $18",
  },
  {
    label: "Stack",
    vendor: "AI tools + automations",
    limitUsd: 240,
    metric: "ship 3 assets/day",
  },
  {
    label: "Fulfill",
    vendor: "contractors + editing",
    limitUsd: 480,
    metric: "margin > 62%",
  },
];

let state: LaunchState = {
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

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function last4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function logEvent(event: Omit<LaunchEvent, "id" | "at">) {
  state.events = [{ id: id("evt"), at: Date.now(), ...event }, ...state.events].slice(0, 36);
}

function logTransaction(transaction: Omit<LaunchTransaction, "id" | "at">) {
  state.transactions = [
    { id: id("tx"), at: Date.now(), ...transaction },
    ...state.transactions,
  ].slice(0, 24);
}

async function callWhop<T>(path: string, method: string, body?: unknown) {
  const started = Date.now();
  try {
    const result = await whop<T>(path, { method, body });
    logEvent({
      method,
      path,
      status: 200,
      ms: Date.now() - started,
      mode: "live",
      summary: "Whop API call completed",
    });
    state.mode = "live";
    return result;
  } catch (error) {
    if (error instanceof WhopApiError && error.status === 500) {
      logEvent({
        method,
        path,
        status: 204,
        ms: Date.now() - started,
        mode: "demo",
        summary: "Demo fallback: WHOP_API_KEY is not set",
      });
      state.mode = "demo";
      return null;
    }
    throw error;
  }
}

export function getLaunchState() {
  return state;
}

export async function mutateLaunch(input: LaunchAction) {
  if (input.action === "create_wallet") {
    if (!state.accountId) {
      const account = await callWhop<{ id: string }>("/accounts", "POST", {
        email: `launch-${Date.now()}@example.com`,
        metadata: { product: "launch-wallet", launch: state.launchName },
      });
      state.accountId = account?.id ?? id("acct");
    }

    if (state.cards.length === 0) {
      state.cards = DEFAULT_CARDS.map((card) => ({
        ...card,
        id: id("card"),
        last4: last4(),
        status: "draft",
        spentUsd: 0,
      }));
    }
    return state;
  }

  if (input.action === "request_deposit") {
    const amountUsd = Number(input.amountUsd ?? 1500);
    const destination = state.accountId ?? id("acct");
    state.accountId = destination;
    const deposit = await callWhop<{ deposit_address?: { evm?: string } }>("/deposits", "POST", {
      destination,
      amount: amountUsd,
    });
    state.depositAddress =
      deposit?.deposit_address?.evm ?? "0x3A0F6d15b8fB7E7b7f63a17C4aC7d9D2aC1a9F01";
    state.balanceUsd += amountUsd;
    logTransaction({
      kind: "deposit",
      label: "USDC launch float",
      amountUsd,
      status: "posted",
    });
    return state;
  }

  if (input.action === "issue_card") {
    const card = state.cards[0] ?? {
      id: id("card"),
      label: input.label ?? "Acquire",
      vendor: input.vendor ?? "growth spend",
      limitUsd: Number(input.limitUsd ?? 500),
      spentUsd: 0,
      metric: input.metric ?? "CAC under target",
      last4: last4(),
      status: "draft" as const,
    };
    await callWhop("/cards", "POST", {
      account_id: state.accountId,
      label: card.label,
      spend_limit_usd: card.limitUsd,
      metadata: { vendor: card.vendor, metric: card.metric },
    });
    state.cards = state.cards.map((entry) =>
      entry.id === card.id ? { ...entry, status: "active" } : entry,
    );
    logTransaction({
      kind: "card_spend",
      label: `${card.label} card issued`,
      amountUsd: 0,
      status: "posted",
    });
    return state;
  }

  if (input.action === "record_sale") {
    const amountUsd = Number(input.amountUsd ?? 899);
    state.revenueUsd += amountUsd;
    state.balanceUsd += amountUsd;
    logTransaction({
      kind: "sale",
      label: "Whop checkout revenue",
      amountUsd,
      status: "settled",
    });
    return state;
  }

  if (input.action === "sweep_profit") {
    const availableProfit = Math.max(0, state.balanceUsd - state.reserveUsd);
    const amountUsd = Math.min(Number(input.amountUsd ?? Math.round(availableProfit * 0.35)), availableProfit);
    if (amountUsd <= 0) return state;

    await callWhop("/swaps/quote", "POST", {
      amount: String(amountUsd),
      from_token: "USDC",
      to_token: "cbBTC",
      slippage_bps: 75,
    });
    await callWhop("/swaps", "POST", {
      account_id: state.accountId,
      amount: String(amountUsd),
      from_token: "USDC",
      to_token: "cbBTC",
      slippage_bps: 75,
    });
    state.balanceUsd -= amountUsd;
    logTransaction({
      kind: "sweep",
      label: "Profit swept to cbBTC",
      amountUsd,
      status: "settled",
    });
    return state;
  }

  return state;
}
