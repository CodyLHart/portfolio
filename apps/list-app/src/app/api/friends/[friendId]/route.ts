import { NextResponse } from "next/server";
import { loadSharedFriend } from "../../../../lib/friends-query";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ friendId: string }> },
) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { friendId } = await params;
  const result = await loadSharedFriend(authorization, friendId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ friend: result.data });
}
