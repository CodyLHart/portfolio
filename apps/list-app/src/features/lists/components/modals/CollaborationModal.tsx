import type {
  Collaborator,
  FriendRequest,
  List,
  ListRole,
  Profile,
} from "../../../../lib/types";
import { ListToolModal } from "./ListToolModal";
import styles from "./ListModals.module.css";

export function CollaborationModal({
  acceptedFriendProfiles,
  activeList,
  appOrigin,
  collaborators,
  friendEmail,
  friends,
  inviteCollaborator,
  inviteEmail,
  inviteRole,
  isOwner,
  onClose,
  sendFriendRequest,
  setFriendEmail,
  setInviteEmail,
  setInviteRole,
  setShareRole,
  shareRole,
  updateCollaboratorRole,
  userId,
}: {
  acceptedFriendProfiles: Profile[];
  activeList: List;
  appOrigin: string;
  collaborators: Collaborator[];
  friendEmail: string;
  friends: FriendRequest[];
  inviteCollaborator: () => void;
  inviteEmail: string;
  inviteRole: ListRole;
  isOwner: boolean;
  onClose: () => void;
  sendFriendRequest: () => void;
  setFriendEmail: (email: string) => void;
  setInviteEmail: (email: string) => void;
  setInviteRole: (role: ListRole) => void;
  setShareRole: (role: ListRole) => void;
  shareRole: ListRole;
  updateCollaboratorRole: (collaboratorId: string, role: ListRole) => void;
  userId: string;
}) {
  return (
    <ListToolModal title="Collaboration" onClose={onClose}>
      <p className="eyebrow">Friends</p>
      <div className={styles.fieldGrid}>
        <input
          onChange={(event) => setFriendEmail(event.target.value)}
          placeholder="Friend email"
          value={friendEmail}
        />
        <button
          className="secondary-button"
          onClick={sendFriendRequest}
          type="button"
        >
          Add Friend
        </button>
      </div>
      <FriendList friends={friends} userId={userId} />
      <p className="eyebrow">Invite To List</p>
      <div className={styles.fieldGrid}>
        {acceptedFriendProfiles.length > 0 ? (
          <select
            disabled={!isOwner}
            onChange={(event) => {
              if (event.target.value) {
                setInviteEmail(event.target.value);
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
          disabled={!isOwner}
          onChange={(event) => setInviteEmail(event.target.value)}
          placeholder="Invite exact email"
          value={inviteEmail}
        />
        <select
          disabled={!isOwner}
          onChange={(event) => setInviteRole(event.target.value as ListRole)}
          value={inviteRole}
        >
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <button
          className="secondary-button"
          disabled={!isOwner}
          onClick={inviteCollaborator}
          type="button"
        >
          Invite to list
        </button>
      </div>
      <div className={styles.fieldGrid}>
        <label>
          Share role
          <select
            onChange={(event) => setShareRole(event.target.value as ListRole)}
            value={shareRole}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
        </label>
        <input
          readOnly
          value={`${appOrigin}?join=${activeList.share_token}&role=${shareRole}`}
        />
      </div>
      <CollaboratorList
        collaborators={collaborators}
        isOwner={isOwner}
        updateCollaboratorRole={updateCollaboratorRole}
      />
    </ListToolModal>
  );
}

function FriendList({
  friends,
  userId,
}: {
  friends: FriendRequest[];
  userId: string;
}) {
  const accepted = friends.filter((friend) => friend.status === "accepted");

  return (
    <div className={styles.friendList}>
      <p className="eyebrow">Friends</p>
      {accepted.length === 0 ? (
        <p className="muted">No accepted friends yet.</p>
      ) : null}
      {accepted.map((friend) => {
        const other =
          friend.requester_id === userId ? friend.addressee : friend.requester;
        return (
          <div className="small-card" key={friend.id}>
            <strong>{other?.display_name ?? "Friend"}</strong>
            <span className="muted">{other?.email}</span>
          </div>
        );
      })}
    </div>
  );
}

function CollaboratorList({
  collaborators,
  isOwner,
  updateCollaboratorRole,
}: {
  collaborators: Collaborator[];
  isOwner: boolean;
  updateCollaboratorRole: (collaboratorId: string, role: ListRole) => void;
}) {
  return (
    <div className={styles.collaboratorList}>
      <p className="eyebrow">Collaborators</p>
      {collaborators.map((collaborator) => (
        <div className="small-card" key={collaborator.id}>
          <strong>
            {collaborator.profile?.display_name ?? collaborator.user_id}
          </strong>
          <span className="muted">{collaborator.status}</span>
          <select
            disabled={!isOwner || collaborator.role === "owner"}
            onChange={(event) =>
              updateCollaboratorRole(
                collaborator.id,
                event.target.value as ListRole,
              )
            }
            value={collaborator.role}
          >
            <option value="owner">Owner</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      ))}
    </div>
  );
}
