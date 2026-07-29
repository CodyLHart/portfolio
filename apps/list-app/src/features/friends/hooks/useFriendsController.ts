import { useMemo } from "react";
import type { Collaborator, List } from "../../../lib/types";
import {
  buildFriendSummaries,
  findFriendSummary,
  type FriendSummary,
} from "../lib/friend-utils";

export function useFriendsController({
  allListCollaborators,
  currentUserId,
  lists,
  selectedFriendId,
}: {
  allListCollaborators: Collaborator[];
  currentUserId: string | null;
  lists: List[];
  selectedFriendId: string | null;
}): {
  friendSummaries: FriendSummary[];
  selectedFriend: FriendSummary | null;
} {
  const friendSummaries = useMemo<FriendSummary[]>(
    () =>
      buildFriendSummaries({
        collaborators: allListCollaborators,
        currentUserId,
        lists,
      }),
    [allListCollaborators, currentUserId, lists],
  );
  const selectedFriend = useMemo(
    () => findFriendSummary(friendSummaries, selectedFriendId),
    [friendSummaries, selectedFriendId],
  );

  return { friendSummaries, selectedFriend };
}
