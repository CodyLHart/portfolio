import type { List, ListItemFields } from "../../../../lib/types";
import { itemFieldOptions } from "../../lib/list-utils";
import { ListToolModal } from "./ListToolModal";
import styles from "./ListModals.module.css";

export function ListSettingsModal({
  activeList,
  clearAll,
  deleteActiveList,
  deleteListConfirmation,
  isOwner,
  itemFields,
  listNameDraft,
  onClose,
  removeCompleted,
  setDeleteListConfirmation,
  setListNameDraft,
  updateItemFieldSetting,
  updateListName,
}: {
  activeList: List;
  clearAll: () => void;
  deleteActiveList: () => void;
  deleteListConfirmation: string;
  isOwner: boolean;
  itemFields: ListItemFields;
  listNameDraft: string;
  onClose: () => void;
  removeCompleted: () => void;
  setDeleteListConfirmation: (confirmation: string) => void;
  setListNameDraft: (name: string) => void;
  updateItemFieldSetting: (field: keyof ListItemFields, value: boolean) => void;
  updateListName: () => void;
}) {
  return (
    <ListToolModal title="List settings" onClose={onClose}>
      <p className="muted">
        These actions change the current list for every collaborator.
      </p>
      <p className="eyebrow">List Name</p>
      <div className={styles.fieldGrid}>
        <input
          disabled={!isOwner}
          onChange={(event) => setListNameDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void updateListName();
            }
          }}
          value={listNameDraft}
        />
        <button
          className="secondary-button"
          disabled={
            !isOwner ||
            !listNameDraft.trim() ||
            listNameDraft.trim() === activeList.title
          }
          onClick={updateListName}
          type="button"
        >
          Save name
        </button>
      </div>
      <p className="eyebrow">Item Fields</p>
      <div className={styles.fieldToggleGrid}>
        {itemFieldOptions.map((fieldOption) => (
          <label className={styles.fieldToggle} key={fieldOption.key}>
            <input
              checked={itemFields[fieldOption.key]}
              disabled={!isOwner}
              onChange={(event) =>
                updateItemFieldSetting(fieldOption.key, event.target.checked)
              }
              type="checkbox"
            />
            <span>{fieldOption.label}</span>
          </label>
        ))}
      </div>
      <p className="eyebrow">List Actions</p>
      <div className="inline-actions">
        <button
          className="danger-button"
          disabled={!isOwner}
          onClick={removeCompleted}
          type="button"
        >
          Remove completed
        </button>
        <button
          className="danger-button"
          disabled={!isOwner}
          onClick={clearAll}
          type="button"
        >
          Clear all
        </button>
      </div>
      <p className="eyebrow">Delete list</p>
      <div className={styles.dangerZone}>
        <p className="muted">
          Type <strong>{activeList.title}</strong> to permanently delete this
          list.
        </p>
        <input
          disabled={!isOwner}
          onChange={(event) => setDeleteListConfirmation(event.target.value)}
          value={deleteListConfirmation}
        />
        <button
          className="danger-button"
          disabled={!isOwner || deleteListConfirmation !== activeList.title}
          onClick={deleteActiveList}
          type="button"
        >
          Delete list
        </button>
      </div>
    </ListToolModal>
  );
}
