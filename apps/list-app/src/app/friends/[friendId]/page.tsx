import { ListApp } from "../../ListApp";

export default async function FriendPage({
  params,
}: {
  params: Promise<{ friendId: string }>;
}) {
  const { friendId } = await params;

  return <ListApp initialFriendId={friendId} initialSection="friends" />;
}
