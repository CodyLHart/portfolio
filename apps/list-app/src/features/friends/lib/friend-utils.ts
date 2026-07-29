import type { Collaborator, List, ListRole, Profile } from "../../../lib/types";

export type SharedListSummary = {
  currentUserRole: ListRole | null;
  friendRole: ListRole | null;
  list: List;
  ownerLabel: string;
  participants: SharedListParticipant[];
};

export type FriendSummary = {
  profile: Profile;
  sharedLists: SharedListSummary[];
};

export type SharedListParticipant = {
  accessLabel: string;
  profile: Profile;
};

export const getRoleForList = (
  list: List,
  collaborators: Collaborator[],
  userId: string | null,
): ListRole | null => {
  if (!userId) {
    return null;
  }

  if (list.owner_id === userId) {
    return "owner";
  }

  return (
    collaborators.find(
      (collaborator) =>
        collaborator.list_id === list.id &&
        collaborator.user_id === userId &&
        collaborator.status === "accepted",
    )?.role ?? null
  );
};

export const roleLabel = (role: ListRole) => {
  if (role === "owner") {
    return "Owner";
  }

  if (role === "editor") {
    return "Can edit";
  }

  return "View only";
};

export const formatSharedListCount = (count: number) =>
  `${count} shared list${count === 1 ? "" : "s"}`;

export const getFriendDisplayName = (profile: Profile | null | undefined) =>
  profile?.display_name?.trim() || "Friend";

export const buildFriendSummaries = ({
  collaborators,
  currentUserId,
  lists,
}: {
  collaborators: Collaborator[];
  currentUserId: string | null;
  lists: List[];
}): FriendSummary[] => {
  if (!currentUserId) {
    return [];
  }

  const profileById = new Map<string, Profile>();

  collaborators.forEach((collaborator) => {
    if (collaborator.profile) {
      profileById.set(collaborator.profile.id, collaborator.profile);
    }
  });

  const friendSummaries = new Map<string, FriendSummary>();

  lists.forEach((list) => {
    const currentUserRole = getRoleForList(list, collaborators, currentUserId);

    if (!currentUserRole) {
      return;
    }

    const acceptedCollaborators = collaborators.filter(
      (collaborator) =>
        collaborator.list_id === list.id && collaborator.status === "accepted",
    );

    acceptedCollaborators.forEach((collaborator) => {
      if (collaborator.user_id === currentUserId) {
        return;
      }

      const profile =
        collaborator.profile ?? profileById.get(collaborator.user_id);

      if (!profile) {
        return;
      }

      const existing = friendSummaries.get(profile.id) ?? {
        profile,
        sharedLists: [],
      };

      if (
        !existing.sharedLists.some(
          (sharedList) => sharedList.list.id === list.id,
        )
      ) {
        const owner = profileById.get(list.owner_id);
        const participants = getListParticipants(
          list,
          acceptedCollaborators,
          profileById,
        );

        existing.sharedLists.push({
          currentUserRole,
          friendRole: getRoleForList(list, collaborators, profile.id),
          list,
          ownerLabel:
            list.owner_id === currentUserId
              ? "Owned by you"
              : list.owner_id === profile.id
                ? `Owned by ${profile.display_name}`
                : `Shared with both of you${owner ? ` by ${owner.display_name}` : ""}`,
          participants,
        });
      }

      friendSummaries.set(profile.id, existing);
    });
  });

  return Array.from(friendSummaries.values())
    .map((summary) => ({
      ...summary,
      sharedLists: summary.sharedLists.sort((first, second) =>
        second.list.updated_at.localeCompare(first.list.updated_at),
      ),
    }))
    .sort((first, second) =>
      first.profile.display_name.localeCompare(second.profile.display_name),
    );
};

export const findFriendSummary = (
  friendSummaries: FriendSummary[],
  friendId: string | null,
) =>
  friendId
    ? friendSummaries.find((friend) => friend.profile.id === friendId) ?? null
    : null;

const getListParticipants = (
  list: List,
  acceptedCollaborators: Collaborator[],
  profileById: Map<string, Profile>,
): SharedListParticipant[] => {
  const participantsById = new Map<string, SharedListParticipant>();

  acceptedCollaborators.forEach((collaborator) => {
    const profile = collaborator.profile ?? profileById.get(collaborator.user_id);

    if (!profile) {
      return;
    }

    participantsById.set(profile.id, {
      accessLabel:
        profile.id === list.owner_id ? "Owner" : roleLabel(collaborator.role),
      profile,
    });
  });

  const participants = Array.from(participantsById.values());

  return participants.sort((first, second) => {
    if (first.profile.id === list.owner_id) {
      return -1;
    }

    if (second.profile.id === list.owner_id) {
      return 1;
    }

    return first.profile.display_name.localeCompare(second.profile.display_name);
  });
};
