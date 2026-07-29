import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import type {
  Collaborator,
  List,
  ListItem,
  ListItemFields,
  ListSnapshot,
  Priority,
  Suggestion,
} from "../../../lib/types";
import {
  deleteListById,
  renameList,
  updateListItemFields,
} from "../lib/list-api";
import type { ActiveListModal } from "./useListModalState";

export function useListSettingsController({
  activeList,
  deleteListConfirmation,
  isOwner,
  itemFields,
  lists,
  listNameDraft,
  setActiveListId,
  setActiveListModal,
  setCollaborators,
  setDeleteListConfirmation,
  setItems,
  setListNameDraft,
  setLists,
  setSelectedCategories,
  setSelectedPriorities,
  setSnapshots,
  setStatusMessage,
  setSuggestions,
  supabase,
}: {
  activeList: List | null;
  deleteListConfirmation: string;
  isOwner: boolean;
  itemFields: ListItemFields;
  lists: List[];
  listNameDraft: string;
  setActiveListId: Dispatch<SetStateAction<string | null>>;
  setActiveListModal: Dispatch<SetStateAction<ActiveListModal>>;
  setCollaborators: Dispatch<SetStateAction<Collaborator[]>>;
  setDeleteListConfirmation: Dispatch<SetStateAction<string>>;
  setItems: Dispatch<SetStateAction<ListItem[]>>;
  setListNameDraft: Dispatch<SetStateAction<string>>;
  setLists: Dispatch<SetStateAction<List[]>>;
  setSelectedCategories: Dispatch<SetStateAction<string[]>>;
  setSelectedPriorities: Dispatch<SetStateAction<Priority[]>>;
  setSnapshots: Dispatch<SetStateAction<ListSnapshot[]>>;
  setStatusMessage: (message: string | null) => void;
  setSuggestions: Dispatch<SetStateAction<Suggestion[]>>;
  supabase: SupabaseClient;
}) {
  const openOwnerSettings = () => {
    setListNameDraft(activeList?.title ?? "");
    setActiveListModal("owner");
  };

  const deleteActiveList = async () => {
    if (
      !activeList ||
      !isOwner ||
      deleteListConfirmation !== activeList.title
    ) {
      return;
    }

    const { error } = await deleteListById(supabase, activeList.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    const remainingLists = lists.filter((list) => list.id !== activeList.id);
    setLists(remainingLists);
    setActiveListId(remainingLists[0]?.id ?? null);
    setItems([]);
    setCollaborators([]);
    setSnapshots([]);
    setSuggestions([]);
    setDeleteListConfirmation("");
    setActiveListModal(null);
  };

  const updateListName = async () => {
    if (!activeList || !isOwner || !listNameDraft.trim()) {
      return;
    }

    const nextTitle = listNameDraft.trim();
    const { error } = await renameList(supabase, {
      listId: activeList.id,
      title: nextTitle,
    });

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setLists((current) =>
      current.map((list) =>
        list.id === activeList.id ? { ...list, title: nextTitle } : list,
      ),
    );
    setDeleteListConfirmation("");
  };

  const updateItemFieldSetting = async (
    field: keyof ListItemFields,
    value: boolean,
  ) => {
    if (!activeList || !isOwner) {
      return;
    }

    const nextFields = {
      ...itemFields,
      [field]: value,
    };

    const { error } = await updateListItemFields(supabase, {
      itemFields: nextFields,
      listId: activeList.id,
    });

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setLists((current) =>
      current.map((list) =>
        list.id === activeList.id ? { ...list, item_fields: nextFields } : list,
      ),
    );

    if (field === "category" && !value) {
      setSelectedCategories([]);
    }

    if (field === "priority" && !value) {
      setSelectedPriorities([]);
    }
  };

  return {
    deleteActiveList,
    openOwnerSettings,
    updateItemFieldSetting,
    updateListName,
  };
}
