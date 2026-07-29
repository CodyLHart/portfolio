import type { Dispatch, SetStateAction } from "react";
import type {
  Collaborator,
  ListItem,
  ListItemFields,
  Priority,
} from "../../../../lib/types";
import { getCategoryStyle, priorityOptions } from "../../lib/list-utils";
import styles from "./ListModals.module.css";

export function EditItemModal({
  categoryOptions,
  collaborators,
  itemFields,
  item,
  listId,
  saveItemDetails,
  setEditingItem,
}: {
  categoryOptions: string[];
  collaborators: Collaborator[];
  itemFields: ListItemFields;
  item: ListItem;
  listId: string | null;
  saveItemDetails: () => void;
  setEditingItem: Dispatch<SetStateAction<ListItem | null>>;
}) {
  const categoryQuery = item.category?.trim().toLowerCase() ?? "";
  const matchingCategories = categoryQuery
    ? categoryOptions.filter((category) =>
        category.toLowerCase().includes(categoryQuery),
      )
    : categoryOptions;

  return (
    <div className={styles.backdrop} onMouseDown={() => setEditingItem(null)}>
      <div
        aria-label="Edit item"
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2>Edit item</h2>
        <div className={styles.fieldGrid}>
          <label>
            Title
            <input
              onChange={(event) =>
                setEditingItem({ ...item, title: event.target.value })
              }
              value={item.title}
            />
          </label>
          {itemFields.quantity || itemFields.category ? (
            <div className={`${styles.fieldGrid} ${styles.two}`}>
              {itemFields.quantity ? (
                <label>
                  Quantity
                  <input
                    onChange={(event) =>
                      setEditingItem({ ...item, quantity: event.target.value })
                    }
                    value={item.quantity ?? ""}
                  />
                </label>
              ) : null}
              {itemFields.category ? (
                <label>
                  Category
                  <input
                    list="edit-item-categories"
                    onChange={(event) =>
                      setEditingItem({ ...item, category: event.target.value })
                    }
                    value={item.category ?? ""}
                  />
                </label>
              ) : null}
            </div>
          ) : null}
          {itemFields.category ? (
            <datalist id="edit-item-categories">
              {categoryOptions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          ) : null}
          {itemFields.category && matchingCategories.length > 0 ? (
            <div className={styles.categoryOptions}>
              {matchingCategories.slice(0, 8).map((category) => (
                <button
                  key={category}
                  onClick={() => setEditingItem({ ...item, category })}
                  style={getCategoryStyle(listId, category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}
          {itemFields.dueDate || itemFields.priority ? (
            <div className={`${styles.fieldGrid} ${styles.two}`}>
              {itemFields.dueDate ? (
                <label>
                  Due date
                  <input
                    onChange={(event) =>
                      setEditingItem({ ...item, due_date: event.target.value })
                    }
                    type="date"
                    value={item.due_date ?? ""}
                  />
                </label>
              ) : null}
              {itemFields.priority ? (
                <label>
                  Priority
                  <select
                    onChange={(event) =>
                      setEditingItem({
                        ...item,
                        priority: event.target.value
                          ? (event.target.value as Priority)
                          : null,
                      })
                    }
                    value={item.priority ?? ""}
                  >
                    <option value="">None</option>
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}
          {itemFields.assignee ? (
            <label>
              Assignee
              <select
                onChange={(event) =>
                  setEditingItem({ ...item, assigned_to: event.target.value })
                }
                value={item.assigned_to ?? ""}
              >
                <option value="">Unassigned</option>
                {collaborators
                  .filter((collaborator) => collaborator.status === "accepted")
                  .map((collaborator) => (
                    <option
                      key={collaborator.user_id}
                      value={collaborator.user_id}
                    >
                      {collaborator.profile?.display_name ??
                        collaborator.user_id}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
          {itemFields.notes ? (
            <label>
              Notes
              <textarea
                onChange={(event) =>
                  setEditingItem({ ...item, notes: event.target.value })
                }
                value={item.notes ?? ""}
              />
            </label>
          ) : null}
        </div>
        <div className="inline-actions">
          <button
            className="primary-button"
            onClick={saveItemDetails}
            type="button"
          >
            Save
          </button>
          <button
            className="secondary-button"
            onClick={() => setEditingItem(null)}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
