const BASE = process.env.WHOP_API_BASE ?? "https://api.whop.com/api/v1";

export const ACCOUNT_ID = process.env.WHOP_ACCOUNT_ID ?? "biz_usJMTJwlmH1zVX";

export type ApiCall = {
  id: number;
  t: number;
  method: string;
  path: string;
  status: number;
  ms: number;
};

const RECENT_MAX = 100;
const recentCalls: ApiCall[] = [];
let callCounter = 0;

function recordCall(method: string, path: string, status: number, ms: number) {
  recentCalls.push({ id: ++callCounter, t: Date.now(), method, path, status, ms });
  if (recentCalls.length > RECENT_MAX) recentCalls.shift();
}

export function getRecentCalls() {
  return { total: callCounter, calls: recentCalls.slice(-50) };
}

export class WhopApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Whop API ${status}: ${JSON.stringify(body)}`);
  }
}

export async function whop<T = unknown>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const key = process.env.WHOP_API_KEY;
  if (!key) throw new WhopApiError(500, { error: "WHOP_API_KEY is not set" });

  const method = init?.method ?? "GET";
  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch (error) {
    recordCall(method, path, 0, Date.now() - started);
    throw error;
  }
  recordCall(method, path, res.status, Date.now() - started);

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new WhopApiError(res.status, json);
  return json as T;
}

export function errorResponse(error: unknown) {
  if (error instanceof WhopApiError) {
    return Response.json(
      { error: error.body ?? error.message },
      { status: error.status >= 400 && error.status < 600 ? error.status : 502 },
    );
  }
  return Response.json(
    { error: error instanceof Error ? error.message : "Unknown error" },
    { status: 500 },
  );
}
