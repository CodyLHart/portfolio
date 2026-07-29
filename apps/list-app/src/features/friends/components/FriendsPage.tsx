import type { FriendSummary } from "../lib/friend-utils";
import { FriendsIndex } from "./FriendsIndex";
import { FriendsIndexLoadingPanel } from "./FriendsLoadingRegion";

export function FriendsPage({
  friendSummaries,
  isLoading,
  onOpenFriend,
  onOpenList,
  selectedFriend,
  selectedFriendId,
  showLists,
}: {
  friendSummaries: FriendSummary[];
  isLoading: boolean;
  onOpenFriend: (friendId: string) => void;
  onOpenList: (listId: string) => void;
  selectedFriend: FriendSummary | null;
  selectedFriendId: string | null;
  showLists: () => void;
}) {
  const shouldShowLoading =
    isLoading && friendSummaries.length === 0;

  if (shouldShowLoading) {
    return <FriendsIndexLoadingPanel showLists={showLists} />;
  }

  return (
    <FriendsIndex
      friendSummaries={friendSummaries}
      onOpenFriend={onOpenFriend}
      showLists={showLists}
      onOpenList={onOpenList}
      selectedFriend={selectedFriend}
      selectedFriendId={selectedFriendId}
    />
  );
}
