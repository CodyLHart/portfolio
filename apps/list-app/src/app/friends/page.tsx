import { ListApp } from "../ListApp";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ friend?: string }>;
}) {
  const { friend } = await searchParams;

  return <ListApp initialFriendId={friend ?? null} initialSection="friends" />;
}
