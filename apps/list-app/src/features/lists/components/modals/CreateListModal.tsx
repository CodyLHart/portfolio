import type { Dispatch, SetStateAction } from "react";
import type { ListItemFields, ListRole, Profile } from "../../../../lib/types";
import { itemFieldOptions } from "../../lib/list-utils";
import { ListToolModal } from "./ListToolModal";
import styles from "./ListModals.module.css";

export type NewListDraft = {
  collaboratorEmail: string;
  collaboratorRole: ListRole;
  itemFields: ListItemFields;
  title: string;
};

export function CreateListModal({
  acceptedFriendProfiles,
  createList,
  newListDraft,
  onClose,
  setNewListDraft,
}: {
  acceptedFriendProfiles: Profile[];
  createList: () => void;
  newListDraft: NewListDraft;
  onClose: () => void;
  setNewListDraft: Dispatch<SetStateAction<NewListDraft>>;
}) {
  return (
    <ListToolModal title="Create list" onClose={onClose}>
      <div className={styles.fieldGrid}>
        <label>
          List name
          <input
            autoFocus
            onChange={(event) =>
              setNewListDraft((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void createList();
              }
            }}
            value={newListDraft.title}
          />
        </label>
      </div>
      <p className="eyebrow">Item Fields</p>
      <div className={styles.fieldToggleGrid}>
        {itemFieldOptions.map((fieldOption) => (
          <label className={styles.fieldToggle} key={fieldOption.key}>
            <input
              checked={newListDraft.itemFields[fieldOption.key]}
              onChange={(event) =>
                setNewListDraft((current) => ({
                  ...current,
                  itemFields: {
                    ...current.itemFields,
                    [fieldOption.key]: event.target.checked,
                  },
                }))
              }
              type="checkbox"
            />
            <span>{fieldOption.label}</span>
          </label>
        ))}
      </div>
      <p className="eyebrow">Optional Collaborator</p>
      <div className={styles.fieldGrid}>
        {acceptedFriendProfiles.length > 0 ? (
          <select
            onChange={(event) => {
              if (event.target.value) {
                setNewListDraft((current) => ({
                  ...current,
                  collaboratorEmail: event.target.value,
                }));
              }
            }}
            value=""
          >
            <option value="">Select existing friend</option>
            {acceptedFriendProfiles.map((friend) => (
              <option key={friend.id} value={friend.email}>
                {friend.display_name} ({friend.email})
              </option>
            ))}
          </select>
        ) : null}
        <input
          onChange={(event) =>
            setNewListDraft((current) => ({
              ...current,
              collaboratorEmail: event.target.value,
            }))
          }
          placeholder="Exact email"
          value={newListDraft.collaboratorEmail}
        />
        <select
          onChange={(event) =>
            setNewListDraft((current) => ({
              ...current,
              collaboratorRole: event.target.value as ListRole,
            }))
          }
          value={newListDraft.collaboratorRole}
        >
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <div className="inline-actions">
        <button className="primary-button" onClick={createList} type="button">
          Create list
        </button>
        <button className="secondary-button" onClick={onClose} type="button">
          Cancel
        </button>
      </div>
    </ListToolModal>
  );
}
