import type { Dispatch, SetStateAction } from "react";
import { AppIcon } from "../../../components/ui/AppIcon";
import type { ItemDraft, ListItem, Priority } from "../../../lib/types";
import { getCategoryStyle } from "../lib/list-utils";
import type { ListsWorkspaceProps } from "../types";
import { AddItemForm } from "./AddItemForm";
import { ListDetailLoadingPanel } from "./ListDetailLoadingPanel";
import { ListHeader } from "./ListHeader";
import { ListItems } from "./ListItems";

type ListDetailProps = Omit<ListsWorkspaceProps, "mobileView">;

export function ListDetail({
  activeList,
  beginItemDrag,
  canEdit,
  categoryOptions,
  collaborators,
  completeItemDrop,
  deleteItem,
  draggedItemId,
  draft,
  dropIndicator,
  finishItemDrag,
  hasFilterOptions,
  isAddItemOpen,
  isLoading,
  itemFields,
  items,
  matchingCategoryOptions,
  matchingSuggestions,
  onAddItem,
  onCreateList,
  onOpenCollaboration,
  onOpenHistory,
  onOpenOwnerSettings,
  onClearFilters,
  onShowMobileListIndex,
  presenceUsers,
  priorityFilterOptions,
  selectedCategories,
  selectedPriorities,
  setDraft,
  setDropIndicator,
  setEditingItem,
  setIsAddItemOpen,
  statusMessage,
  toggleCategoryFilter,
  toggleItem,
  togglePriorityFilter,
  visibleItemGroups,
}: ListDetailProps) {
  return (
    <section className="panel list-detail-panel">
      {!activeList ? (
        isLoading ? (
          <ListDetailLoadingPanel onShowMobileListIndex={onShowMobileListIndex} />
        ) : (
          <div className="empty-state">
            <h2>No lists yet</h2>
            <p>Create your first list to start keeping things organized.</p>
            <button
              className="primary-button"
              onClick={onCreateList}
              type="button"
            >
              Create list
            </button>
          </div>
        )
      ) : (
        <>
          <ListHeader
            activeListTitle={activeList.title}
            onOpenCollaboration={onOpenCollaboration}
            onOpenHistory={onOpenHistory}
            onOpenOwnerSettings={onOpenOwnerSettings}
            onShowMobileListIndex={onShowMobileListIndex}
            presenceUsers={presenceUsers}
          />

          <ListFilters
            activeListId={activeList.id}
            categoryOptions={categoryOptions}
            hasFilterOptions={hasFilterOptions}
            isAddItemOpen={isAddItemOpen}
            itemFields={itemFields}
            canEdit={canEdit}
            onClearFilters={onClearFilters}
            priorityFilterOptions={priorityFilterOptions}
            selectedCategories={selectedCategories}
            selectedPriorities={selectedPriorities}
            setIsAddItemOpen={setIsAddItemOpen}
            toggleCategoryFilter={toggleCategoryFilter}
            togglePriorityFilter={togglePriorityFilter}
          />

          {isAddItemOpen ? (
            <AddItemForm
              activeListId={activeList.id}
              canEdit={canEdit}
              categoryOptions={categoryOptions}
              collaborators={collaborators}
              draft={draft}
              itemFields={itemFields}
              matchingCategoryOptions={matchingCategoryOptions}
              matchingSuggestions={matchingSuggestions}
              onAddItem={onAddItem}
              setDraft={setDraft}
            />
          ) : null}

          <ListItems
            activeListId={activeList.id}
            beginItemDrag={beginItemDrag}
            canEdit={canEdit}
            collaborators={collaborators}
            completeItemDrop={completeItemDrop}
            deleteItem={deleteItem}
            draggedItemId={draggedItemId}
            dropIndicator={dropIndicator}
            finishItemDrag={finishItemDrag}
            itemFields={itemFields}
            items={items}
            selectedCategories={selectedCategories}
            setDropIndicator={setDropIndicator}
            setEditingItem={setEditingItem}
            setIsAddItemOpen={setIsAddItemOpen}
            toggleCategoryFilter={toggleCategoryFilter}
            toggleItem={toggleItem}
            visibleItemGroups={visibleItemGroups}
          />
          {statusMessage ? (
            <p className="status-message">{statusMessage}</p>
          ) : null}
        </>
      )}
    </section>
  );
}

function ListFilters({
  activeListId,
  categoryOptions,
  hasFilterOptions,
  isAddItemOpen,
  itemFields,
  canEdit,
  onClearFilters,
  priorityFilterOptions,
  selectedCategories,
  selectedPriorities,
  setIsAddItemOpen,
  toggleCategoryFilter,
  togglePriorityFilter,
}: {
  activeListId: string;
  categoryOptions: string[];
  canEdit: boolean;
  hasFilterOptions: boolean;
  isAddItemOpen: boolean;
  itemFields: ListDetailProps["itemFields"];
  onClearFilters: () => void;
  priorityFilterOptions: Priority[];
  selectedCategories: string[];
  selectedPriorities: Priority[];
  setIsAddItemOpen: Dispatch<SetStateAction<boolean>>;
  toggleCategoryFilter: (category: string) => void;
  togglePriorityFilter: (priority: Priority) => void;
}) {
  return (
    <div className="list-action-bar">
      <button
        aria-expanded={isAddItemOpen}
        aria-label="Add item"
        className="add-item-toggle"
        disabled={!canEdit}
        onClick={() => setIsAddItemOpen((open) => !open)}
        type="button"
      >
        <AppIcon
          icon={isAddItemOpen ? "fa-solid fa-xmark" : "fa-solid fa-plus"}
        />
      </button>
      {hasFilterOptions ? (
        <div className="filter-box">
          <span className="filter-label">Filter</span>
          <div className="filter-groups">
            {itemFields.category && categoryOptions.length > 0 ? (
              <div className="filter-group">
                <span>Category</span>
                <div className="category-filter-bar" aria-label="Category filters">
                  {categoryOptions.map((category) => {
                    const isSelected = selectedCategories.some(
                      (selectedCategory) =>
                        selectedCategory.toLowerCase() ===
                        category.toLowerCase(),
                    );

                    return (
                      <button
                        className={isSelected ? "selected" : ""}
                        key={category}
                        onClick={() => toggleCategoryFilter(category)}
                        style={getCategoryStyle(activeListId, category)}
                        type="button"
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {itemFields.priority && priorityFilterOptions.length > 0 ? (
              <div className="filter-group">
                <span>Priority</span>
                <div className="priority-filter-bar" aria-label="Priority filters">
                  {priorityFilterOptions.map((priority) => (
                    <button
                      className={
                        selectedPriorities.includes(priority) ? "selected" : ""
                      }
                      key={priority}
                      onClick={() => togglePriorityFilter(priority)}
                      type="button"
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {selectedCategories.length > 0 || selectedPriorities.length > 0 ? (
              <button
                className="clear-filter-button"
                onClick={onClearFilters}
                type="button"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
