import type { Dispatch, SetStateAction } from "react";
import type {
  Collaborator,
  ItemDraft,
  ListItemFields,
  Priority,
  Suggestion,
} from "../../../lib/types";
import { getCategoryStyle, priorityOptions } from "../lib/list-utils";

export function AddItemForm({
  activeListId,
  canEdit,
  categoryOptions,
  collaborators,
  draft,
  itemFields,
  matchingCategoryOptions,
  matchingSuggestions,
  onAddItem,
  setDraft,
}: {
  activeListId: string;
  canEdit: boolean;
  categoryOptions: string[];
  collaborators: Collaborator[];
  draft: ItemDraft;
  itemFields: ListItemFields;
  matchingCategoryOptions: string[];
  matchingSuggestions: Suggestion[];
  onAddItem: () => void;
  setDraft: Dispatch<SetStateAction<ItemDraft>>;
}) {
  return (
    <div className="panel add-item-panel">
      <p className="eyebrow">Add item</p>
      <div className="item-form">
        <input
          aria-label="Item name"
          disabled={!canEdit}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void onAddItem();
            }
          }}
          placeholder="Add an item"
          value={draft.title}
        />
        {matchingSuggestions.length > 0 ? (
          <div className="suggestions">
            {matchingSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    category: suggestion.category ?? "",
                    title: suggestion.title,
                  }))
                }
                type="button"
              >
                {suggestion.title}
              </button>
            ))}
          </div>
        ) : null}
        {itemFields.quantity || itemFields.category ? (
          <div className="field-grid two">
            {itemFields.quantity ? (
              <input
                disabled={!canEdit}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    quantity: event.target.value,
                  }))
                }
                placeholder="Quantity"
                value={draft.quantity}
              />
            ) : null}
            {itemFields.category ? (
              <input
                disabled={!canEdit}
                list="add-item-categories"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                placeholder="Category"
                value={draft.category}
              />
            ) : null}
          </div>
        ) : null}
        {itemFields.category ? (
          <datalist id="add-item-categories">
            {categoryOptions.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        ) : null}
        {itemFields.category && matchingCategoryOptions.length > 0 ? (
          <div className="category-options">
            {matchingCategoryOptions.slice(0, 8).map((category) => (
              <button
                key={category}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    category,
                  }))
                }
                style={getCategoryStyle(activeListId, category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        ) : null}
        {itemFields.dueDate || itemFields.priority ? (
          <div className="field-grid two">
            {itemFields.dueDate ? (
              <input
                disabled={!canEdit}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    due_date: event.target.value,
                  }))
                }
                type="date"
                value={draft.due_date}
              />
            ) : null}
            {itemFields.priority ? (
              <select
                disabled={!canEdit}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priority: event.target.value as "" | Priority,
                  }))
                }
                value={draft.priority}
              >
                <option value="">Priority</option>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ) : null}
        {itemFields.assignee ? (
          <select
            disabled={!canEdit}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                assigned_to: event.target.value,
              }))
            }
            value={draft.assigned_to}
          >
            <option value="">Unassigned</option>
            {collaborators
              .filter((collaborator) => collaborator.status === "accepted")
              .map((collaborator) => (
                <option key={collaborator.user_id} value={collaborator.user_id}>
                  {collaborator.profile?.display_name ?? collaborator.user_id}
                </option>
              ))}
          </select>
        ) : null}
        {itemFields.notes ? (
          <textarea
            disabled={!canEdit}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            placeholder="Notes"
            value={draft.notes}
          />
        ) : null}
        <button
          className="primary-button"
          disabled={!canEdit || !draft.title.trim()}
          onClick={onAddItem}
          type="button"
        >
          Add item
        </button>
      </div>
    </div>
  );
}
