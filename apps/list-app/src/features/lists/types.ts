import type { Dispatch, SetStateAction } from "react";
import type {
  Collaborator,
  ItemDraft,
  List,
  ListItem,
  ListItemFields,
  Priority,
  Profile,
  Suggestion,
} from "../../lib/types";

export type DropPlacement = "before" | "after";

export type MobileView = "lists" | "detail";

export type ItemGroup = {
  category: string | null;
  items: ListItem[];
};

export type DropIndicator = {
  itemId: string;
  placement: DropPlacement;
} | null;

export type ListDropIndicator = {
  listId: string;
  placement: DropPlacement;
} | null;

export type ListsWorkspaceProps = {
  activeList: List | null;
  activeListId: string | null;
  beginItemDrag: (itemId: string) => void;
  canEdit: boolean;
  canCreate: boolean;
  categoryOptions: string[];
  collaborators: Collaborator[];
  completeItemDrop: (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => void;
  deleteItem: (item: ListItem) => void;
  draggedItemId: string | null;
  draggedListId: string | null;
  draft: ItemDraft;
  dropIndicator: DropIndicator;
  finishItemDrag: () => void;
  hasFilterOptions: boolean;
  isAddItemOpen: boolean;
  isLoading: boolean;
  itemFields: ListItemFields;
  items: ListItem[];
  listDropIndicator: ListDropIndicator;
  lists: List[];
  matchingCategoryOptions: string[];
  matchingSuggestions: Suggestion[];
  mobileView: MobileView;
  onAddItem: () => void;
  onCreateList: () => void;
  onOpenCollaboration: () => void;
  onOpenHistory: () => void;
  onOpenOwnerSettings: () => void;
  onClearFilters: () => void;
  onReorderListByDrop: (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => void;
  onSelectActiveList: (listId: string) => void;
  onShowMobileListIndex: () => void;
  presenceUsers: Profile[];
  priorityFilterOptions: Priority[];
  selectedCategories: string[];
  selectedPriorities: Priority[];
  setDraggedListId: Dispatch<SetStateAction<string | null>>;
  setDraft: Dispatch<SetStateAction<ItemDraft>>;
  setDropIndicator: Dispatch<SetStateAction<DropIndicator>>;
  setEditingItem: Dispatch<SetStateAction<ListItem | null>>;
  setIsAddItemOpen: Dispatch<SetStateAction<boolean>>;
  setListDropIndicator: Dispatch<SetStateAction<ListDropIndicator>>;
  statusMessage: string | null;
  toggleCategoryFilter: (category: string) => void;
  toggleItem: (item: ListItem) => void;
  togglePriorityFilter: (priority: Priority) => void;
  visibleItemGroups: ItemGroup[];
};
