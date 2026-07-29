import type { FriendSummary } from "../lib/friend-utils";
import { FriendDetail, FriendNotFound } from "./FriendDetail";
import { FriendsIndex } from "./FriendsIndex";
import {
  FriendDetailLoadingPanel,
  FriendsIndexLoadingPanel,
} from "./FriendsLoadingRegion";

export function FriendsPage({
  friendSummaries,
  isLoading,
  onBackToFriends,
  onOpenFriend,
  onOpenList,
  selectedFriend,
  selectedFriendId,
  showLists,
}: {
  friendSummaries: FriendSummary[];
  isLoading: boolean;
  onBackToFriends: () => void;
  onOpenFriend: (friendId: string) => void;
  onOpenList: (listId: string) => void;
  selectedFriend: FriendSummary | null;
  selectedFriendId: string | null;
  showLists: () => void;
}) {
  const shouldShowLoading =
    isLoading &&
    (selectedFriendId ? !selectedFriend : friendSummaries.length === 0);

  if (shouldShowLoading) {
    return selectedFriendId ? (
      <FriendDetailLoadingPanel onBackToFriends={onBackToFriends} />
    ) : (
      <FriendsIndexLoadingPanel showLists={showLists} />
    );
  }

  if (selectedFriendId && !selectedFriend) {
    return <FriendNotFound onBackToFriends={onBackToFriends} />;
  }

  if (selectedFriend) {
    return (
      <FriendDetail
        onBackToFriends={onBackToFriends}
        onOpenList={onOpenList}
        selectedFriend={selectedFriend}
      />
    );
  }

  return (
    <FriendsIndex
      friendSummaries={friendSummaries}
      onOpenFriend={onOpenFriend}
      showLists={showLists}
    />
  );
}
