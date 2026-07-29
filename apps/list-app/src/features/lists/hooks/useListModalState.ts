import { useState } from "react";
import type { ListItem, ListSnapshot } from "../../../lib/types";

export type ActiveListModal = "collaboration" | "owner" | "history" | null;

export function useListModalState() {
  const [activeListModal, setActiveListModal] =
    useState<ActiveListModal>(null);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [restoreSnapshot, setRestoreSnapshot] = useState<ListSnapshot | null>(
    null,
  );

  return {
    activeListModal,
    editingItem,
    isCreateListOpen,
    restoreSnapshot,
    setActiveListModal,
    setEditingItem,
    setIsCreateListOpen,
    setRestoreSnapshot,
  };
}
