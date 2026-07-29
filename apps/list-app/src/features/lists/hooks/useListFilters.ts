import { useMemo, useState } from "react";
import type {
  ListItem,
  ListItemFields,
  Priority,
  Suggestion,
} from "../../../lib/types";
import {
  buildVisibleItemGroups,
  getCategoryOptions,
  getPriorityFilterOptions,
} from "../lib/list-utils";

export function useListFilters({
  draftCategory,
  itemFields,
  items,
  suggestions,
}: {
  draftCategory: string;
  itemFields: ListItemFields;
  items: ListItem[];
  suggestions: Suggestion[];
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);

  const visibleItemGroups = useMemo(
    () =>
      buildVisibleItemGroups({
        items,
        selectedCategories,
        selectedPriorities,
      }),
    [items, selectedCategories, selectedPriorities],
  );

  const categoryOptions = useMemo(
    () => getCategoryOptions({ itemFields, items, suggestions }),
    [itemFields, items, suggestions],
  );

  const priorityFilterOptions = useMemo(
    () => getPriorityFilterOptions({ itemFields, items }),
    [itemFields, items],
  );

  const hasFilterOptions =
    categoryOptions.length > 0 ||
    priorityFilterOptions.length > 0 ||
    selectedCategories.length > 0 ||
    selectedPriorities.length > 0;

  const matchingCategoryOptions = useMemo(() => {
    const query = draftCategory.trim().toLowerCase();

    if (!query) {
      return categoryOptions;
    }

    return categoryOptions.filter((category) =>
      category.toLowerCase().includes(query),
    );
  }, [categoryOptions, draftCategory]);

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedPriorities([]);
  };

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories((current) =>
      current.some(
        (selectedCategory) =>
          selectedCategory.toLowerCase() === category.toLowerCase(),
      )
        ? current.filter(
            (selectedCategory) =>
              selectedCategory.toLowerCase() !== category.toLowerCase(),
          )
        : [...current, category],
    );
  };

  const togglePriorityFilter = (priority: Priority) => {
    setSelectedPriorities((current) =>
      current.includes(priority)
        ? current.filter((selectedPriority) => selectedPriority !== priority)
        : [...current, priority],
    );
  };

  return {
    categoryOptions,
    clearFilters,
    hasFilterOptions,
    matchingCategoryOptions,
    priorityFilterOptions,
    selectedCategories,
    selectedPriorities,
    setSelectedCategories,
    setSelectedPriorities,
    toggleCategoryFilter,
    togglePriorityFilter,
    visibleItemGroups,
  };
}
