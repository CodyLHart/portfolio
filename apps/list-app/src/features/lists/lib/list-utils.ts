import type { CSSProperties } from "react";
import type {
  List,
  ListItem,
  ListItemFields,
  ListOrderPreference,
  ListRole,
  Priority,
  Suggestion,
} from "../../../lib/types";
import type { DropPlacement, ItemGroup } from "../types";

export const priorityOptions: Priority[] = ["low", "medium", "high", "urgent"];

export const defaultItemFields: ListItemFields = {
  assignee: true,
  category: true,
  dueDate: true,
  notes: true,
  priority: true,
  quantity: true,
};

export const emptyNewListDraft = {
  collaboratorEmail: "",
  collaboratorRole: "editor" as ListRole,
  itemFields: defaultItemFields,
  title: "",
};

export const itemFieldOptions: Array<{
  key: keyof ListItemFields;
  label: string;
}> = [
  { key: "quantity", label: "Quantity" },
  { key: "category", label: "Category" },
  { key: "dueDate", label: "Due date" },
  { key: "priority", label: "Priority" },
  { key: "assignee", label: "Assignee" },
  { key: "notes", label: "Notes" },
];

const categoryPalette = [
  { background: "#dbeafe", color: "#1e3a8a" },
  { background: "#dcfce7", color: "#14532d" },
  { background: "#fef3c7", color: "#78350f" },
  { background: "#fce7f3", color: "#831843" },
  { background: "#ede9fe", color: "#4c1d95" },
  { background: "#ccfbf1", color: "#134e4a" },
  { background: "#fee2e2", color: "#7f1d1d" },
  { background: "#e0e7ff", color: "#312e81" },
];

export const getDropPlacement = (
  clientY: number,
  rect: DOMRect,
): DropPlacement => (clientY > rect.top + rect.height / 2 ? "after" : "before");

export const getCategoryStyle = (
  listId: string | null | undefined,
  category: string,
): CSSProperties => {
  const seed = `${listId ?? "list"}:${category.trim().toLowerCase()}`;
  const index = Array.from(seed).reduce(
    (hash, character) =>
      (hash * 31 + character.charCodeAt(0)) % categoryPalette.length,
    0,
  );

  return categoryPalette[index];
};

export const normalizeItemFields = (
  fields: Partial<ListItemFields> | null | undefined,
): ListItemFields => ({
  ...defaultItemFields,
  ...(fields ?? {}),
});

export const sortListsByPreference = (
  nextLists: List[],
  preferences: ListOrderPreference[],
) => {
  const positions = new Map(
    preferences.map((preference) => [
      preference.list_id,
      Number(preference.position),
    ]),
  );

  return [...nextLists].sort((first, second) => {
    const firstPosition = positions.get(first.id);
    const secondPosition = positions.get(second.id);

    if (firstPosition !== undefined && secondPosition !== undefined) {
      return firstPosition - secondPosition;
    }

    if (firstPosition !== undefined) {
      return -1;
    }

    if (secondPosition !== undefined) {
      return 1;
    }

    return second.updated_at.localeCompare(first.updated_at);
  });
};

export const buildVisibleItemGroups = ({
  items,
  selectedCategories,
  selectedPriorities,
}: {
  items: ListItem[];
  selectedCategories: string[];
  selectedPriorities: Priority[];
}): ItemGroup[] => {
  const next = [...items].sort((first, second) => {
    if (first.completed !== second.completed) {
      return first.completed ? 1 : -1;
    }

    return first.position - second.position;
  });

  const selectedCategorySet = new Set(
    selectedCategories.map((category) => category.toLowerCase()),
  );
  const selectedPrioritySet = new Set(selectedPriorities);
  const filteredItems = next.filter(
    (item) =>
      (selectedCategorySet.size === 0 ||
        selectedCategorySet.has(
          (item.category?.trim() || "Uncategorized").toLowerCase(),
        )) &&
      (selectedPrioritySet.size === 0 ||
        (item.priority && selectedPrioritySet.has(item.priority))),
  );

  if (selectedCategories.length <= 1) {
    return [{ category: null, items: filteredItems }];
  }

  const groups = new Map<string, ListItem[]>();
  filteredItems.forEach((item) => {
    const category = item.category?.trim() || "Uncategorized";
    groups.set(category, [...(groups.get(category) ?? []), item]);
  });

  return selectedCategories
    .map((category) => ({
      category,
      items: groups.get(category) ?? [],
    }))
    .filter((group) => group.items.length > 0);
};

export const getCategoryOptions = ({
  itemFields,
  items,
  suggestions,
}: {
  itemFields: ListItemFields;
  items: ListItem[];
  suggestions: Suggestion[];
}) => {
  if (!itemFields.category) {
    return [];
  }

  const categories = new Map<string, string>();

  items.forEach((item) => {
    const category = item.category?.trim();
    if (category) {
      categories.set(category.toLowerCase(), category);
    } else {
      categories.set("uncategorized", "Uncategorized");
    }
  });

  suggestions.forEach((suggestion) => {
    const category = suggestion.category?.trim();
    if (category) {
      categories.set(category.toLowerCase(), category);
    }
  });

  return Array.from(categories.values()).sort((first, second) =>
    first.localeCompare(second),
  );
};

export const getPriorityFilterOptions = ({
  itemFields,
  items,
}: {
  itemFields: ListItemFields;
  items: ListItem[];
}) => {
  if (!itemFields.priority) {
    return [];
  }

  const availablePriorities = new Set(
    items.map((item) => item.priority).filter(Boolean) as Priority[],
  );
  return priorityOptions.filter((priority) =>
    availablePriorities.has(priority),
  );
};
