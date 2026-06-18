import { getLaunchState, mutateLaunch } from "@/lib/launch";
import { errorResponse } from "@/lib/whop";

export async function GET() {
  return Response.json(getLaunchState());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const next = await mutateLaunch(body);
    return Response.json(next);
  } catch (error) {
    return errorResponse(error);
  }
}
