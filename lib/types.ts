export type CardStatus = "draft" | "active" | "paused";
export type ApiMode = "demo" | "live";

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
  kind: "deposit" | "card_spend" | "sale" | "sweep";
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

export type TokenBalance = {
  symbol?: string;
  balance?: string | number;
};

export type Account = {
  id?: string;
  email?: string;
  balance?: {
    total_usd?: string | number;
    tokens?: TokenBalance[];
  };
};

export type Quote = {
  amount_in?: string | number;
  amount_out?: string | number;
  amount_out_min?: string | number;
  rate?: string | number;
  fee_bps?: number;
};

export type Swap = {
  id: string;
  status: string;
  amount_out_expected?: string | number;
  tx_hashes?: string[];
  error?: string;
};

export type HistoryEntry = {
  id: string;
  at: number;
  amount: string;
  fromToken: string;
  toToken: string;
  status: string;
  txHashes?: string[];
};

export const TERMINAL_OK = ["completed", "complete", "succeeded", "success"];
export const TERMINAL_FAIL = ["failed", "error"];
