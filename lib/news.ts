export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: number;
  score: number;
};

const BULLISH = [
  "surge", "soar", "rally", "record", "all-time high", "ath", "etf", "adoption",
  "approve", "bull", "gain", "jump", "rise", "breakout", "accumulat", "inflow",
  "buy", "institutional", "halving", "upgrade", "milestone", "boom", "spike",
];

const BEARISH = [
  "crash", "plunge", "drop", "fall", "ban", "hack", "exploit", "lawsuit",
  "sell-off", "selloff", "bear", "fear", "liquidat", "outflow", "fraud", "sink",
  "tumble", "warn", "scam", "dump", "decline", "slump", "crackdown", "risk",
];

export function scoreHeadline(title: string): number {
  const lower = title.toLowerCase();
  let score = 0;
  for (const word of BULLISH) if (lower.includes(word)) score += 1;
  for (const word of BEARISH) if (lower.includes(word)) score -= 1;
  return Math.max(-1, Math.min(1, score));
}

export function aggregateSentiment(items: NewsItem[], window = 25): number | null {
  const recent = items.slice(0, window);
  if (recent.length === 0) return null;
  return recent.reduce((sum, item) => sum + item.score, 0) / recent.length;
}
