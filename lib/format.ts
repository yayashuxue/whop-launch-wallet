export function formatUsd(value: number | string | undefined | null) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "$0.00";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatToken(value: number | string | undefined | null, maxDigits = 8) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: maxDigits });
}

export function shortHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour12: false });
}
