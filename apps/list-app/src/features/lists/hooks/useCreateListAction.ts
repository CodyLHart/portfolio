import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { NewListDraft } from "../components/modals/CreateListModal";
import {
  createListWithOwner,
  isMissingListOrderPreferencesError,
} from "../lib/list-api";
import { emptyNewListDraft } from "../lib/list-utils";
import type { List } from "../../../lib/types";
import { getErrorMessage } from "../../../lib/errors";

export function useCreateListAction({
  lists,
  loadLists,
  setActiveListId,
  setIsCreateListOpen,
  setStatusMessage,
  supabase,
  user,
}: {
  lists: List[];
  loadLists: (userId: string) => Promise<void>;
  setActiveListId: Dispatch<SetStateAction<string | null>>;
  setIsCreateListOpen: Dispatch<SetStateAction<boolean>>;
  setStatusMessage: Dispatch<SetStateAction<string | null>>;
  supabase: SupabaseClient;
  user: User | null;
}) {
  const [newListDraft, setNewListDraft] =
    useState<NewListDraft>(emptyNewListDraft);
  const [isCreatingList, setIsCreatingList] = useState(false);

  const createList = useCallback(async () => {
    if (isCreatingList || !user || !newListDraft.title.trim()) {
      return;
    }

    setIsCreatingList(true);

    let data: List;
    let orderError: unknown = null;

    try {
      const result = await createListWithOwner(supabase, {
        collaboratorEmail: newListDraft.collaboratorEmail,
        collaboratorRole: newListDraft.collaboratorRole,
        itemFields: newListDraft.itemFields,
        lists,
        ownerId: user.id,
        title: newListDraft.title.trim(),
      });

      data = result.list;
      orderError = result.orderError;

      if (result.collaboratorLookupFailed) {
        setStatusMessage(
          "List created, but no account was found for that collaborator email.",
        );
      }
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
      setIsCreatingList(false);
      return;
    }

    if (orderError && !isMissingListOrderPreferencesError(orderError)) {
      setStatusMessage(getErrorMessage(orderError));
    }

    setNewListDraft(emptyNewListDraft);
    setIsCreateListOpen(false);
    await loadLists(user.id);
    setActiveListId(data.id);
    setIsCreatingList(false);
  }, [
    isCreatingList,
    lists,
    loadLists,
    newListDraft,
    setActiveListId,
    setIsCreateListOpen,
    setStatusMessage,
    supabase,
    user,
  ]);

  return {
    createList,
    isCreatingList,
    newListDraft,
    setNewListDraft,
  };
}
