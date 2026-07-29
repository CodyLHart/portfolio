import { redirect } from "next/navigation";

export default async function FriendPage({
  params,
}: {
  params: Promise<{ friendId: string }>;
}) {
  const { friendId } = await params;

  redirect(`/friends?friend=${encodeURIComponent(friendId)}`);
}
