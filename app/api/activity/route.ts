import { getRecentCalls } from "@/lib/whop";

export async function GET() {
  return Response.json(getRecentCalls());
}
