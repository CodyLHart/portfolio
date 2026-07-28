import { NextResponse } from "next/server";
import { loadSharedFriends } from "../../../lib/friends-query";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const result = await loadSharedFriends(authorization);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ friends: result.data });
}
