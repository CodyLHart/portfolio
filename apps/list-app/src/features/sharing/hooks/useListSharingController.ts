import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { List, ListRole } from "../../../lib/types";
import { getErrorMessage } from "../../../lib/errors";
import { sendFriendRequestByEmail } from "../../friends/lib/friends-api";
import {
  inviteListCollaborator,
  updateListCollaboratorRole,
} from "../../lists/lib/sharing-api";

export function useListSharingController({
  activeList,
  isOwner,
  setStatusMessage,
  supabase,
  user,
}: {
  activeList: List | null;
  isOwner: boolean;
  setStatusMessage: Dispatch<SetStateAction<string | null>>;
  supabase: SupabaseClient;
  user: User | null;
}) {
  const [friendEmail, setFriendEmail] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ListRole>("editor");
  const [shareRole, setShareRole] = useState<ListRole>("viewer");

  const sendFriendRequest = useCallback(async () => {
    if (!user || !friendEmail.trim()) {
      return;
    }

    try {
      await sendFriendRequestByEmail(supabase, {
        email: friendEmail,
        userId: user.id,
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
      return;
    }

    setFriendEmail("");
  }, [friendEmail, setStatusMessage, supabase, user]);

  const inviteCollaborator = useCallback(async () => {
    if (!activeList || !user || !isOwner || !inviteEmail.trim()) {
      return;
    }

    try {
      await inviteListCollaborator(supabase, {
        invitedBy: user.id,
        listId: activeList.id,
        listTitle: activeList.title,
        role: inviteRole,
        targetEmail: inviteEmail,
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
      return;
    }

    setInviteEmail("");
  }, [activeList, inviteEmail, inviteRole, isOwner, setStatusMessage, supabase, user]);

  const updateCollaboratorRole = useCallback(
    async (collaboratorId: string, role: ListRole) => {
      if (!isOwner) {
        return;
      }

      const { error } = await updateListCollaboratorRole(supabase, {
        collaboratorId,
        role,
      });

      if (error) {
        setStatusMessage(error.message);
      }
    },
    [isOwner, setStatusMessage, supabase],
  );

  return {
    friendEmail,
    inviteCollaborator,
    inviteEmail,
    inviteRole,
    sendFriendRequest,
    setFriendEmail,
    setInviteEmail,
    setInviteRole,
    setShareRole,
    shareRole,
    updateCollaboratorRole,
  };
}
