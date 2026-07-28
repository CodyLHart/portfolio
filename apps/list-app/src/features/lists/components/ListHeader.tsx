import type { Profile } from "../../../lib/types";

export function ListHeader({
  activeListTitle,
  onOpenCollaboration,
  onOpenHistory,
  onOpenOwnerSettings,
  onShowMobileListIndex,
  presenceUsers,
}: {
  activeListTitle: string;
  onOpenCollaboration: () => void;
  onOpenHistory: () => void;
  onOpenOwnerSettings: () => void;
  onShowMobileListIndex: () => void;
  presenceUsers: Profile[];
}) {
  return (
    <div className="toolbar">
      <div>
        <button
          className="mobile-back-button"
          onClick={onShowMobileListIndex}
          type="button"
        >
          &larr; Your lists
        </button>
        <p className="eyebrow">Current list</p>
        <h1 className="list-title">{activeListTitle}</h1>
        <div className="presence">
          {presenceUsers.map((presenceUser) => (
            <span key={presenceUser.id}>{presenceUser.display_name}</span>
          ))}
        </div>
      </div>
      <div className="list-management-actions">
        <button
          aria-label="Collaboration"
          className="list-tool-button"
          onClick={onOpenCollaboration}
          title="Collaboration"
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M19 14a1.4 1.4 0 0 0-1.4 1.4V18H6V6h2.6A1.4 1.4 0 0 0 10 4.6 1.4 1.4 0 0 0 8.6 3.2H5.4A2.2 2.2 0 0 0 3.2 5.4v13.2a2.2 2.2 0 0 0 2.2 2.2h13.2a2.2 2.2 0 0 0 2.2-2.2v-3.2A1.4 1.4 0 0 0 19.4 14H19Z"
              fill="currentColor"
            />
            <path
              d="M20.5 9.9 14.4 3.8A1.5 1.5 0 0 0 11.8 5v2.5C7.5 8.1 5.1 10.6 4.4 15c-.2 1.2 1.3 1.8 2 .8 1.4-2 3.1-2.9 5.4-3.1V15a1.5 1.5 0 0 0 2.6 1.1l6.1-6.1Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <button
          aria-label="History"
          className="list-tool-button"
          onClick={onOpenHistory}
          title="History"
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M12 2a10 10 0 0 1 7 17.1 1.55 1.55 0 0 1-2.2-2.2A6.9 6.9 0 1 0 5.3 10h1.1a1.4 1.4 0 0 1 1 2.4l-3 3a1.4 1.4 0 0 1-2 0l-3-3A1.4 1.4 0 0 1 .4 10h1.8A10 10 0 0 1 12 2Z"
              fill="currentColor"
            />
            <path
              d="M10.4 7.2A1.6 1.6 0 0 1 12 5.6a1.6 1.6 0 0 1 1.6 1.6v4l3 1.5a1.6 1.6 0 1 1-1.4 2.8l-3.9-2A1.6 1.6 0 0 1 10.4 12V7.2Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <button
          aria-label="Settings"
          className="list-tool-button"
          onClick={onOpenOwnerSettings}
          title="Settings"
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M13.6 1.5a1.4 1.4 0 0 1 1.3 1l.5 1.9c.5.2.9.4 1.3.7l1.9-1a1.4 1.4 0 0 1 1.6.3l1.4 1.4a1.4 1.4 0 0 1 .3 1.6l-1 1.9c.3.4.5.8.7 1.3l1.9.5a1.4 1.4 0 0 1 1 1.3v2a1.4 1.4 0 0 1-1 1.3l-1.9.5c-.2.5-.4.9-.7 1.3l1 1.9a1.4 1.4 0 0 1-.3 1.6l-1.4 1.4a1.4 1.4 0 0 1-1.6.3l-1.9-1c-.4.3-.8.5-1.3.7l-.5 1.9a1.4 1.4 0 0 1-1.3 1h-2a1.4 1.4 0 0 1-1.3-1l-.5-1.9a8.5 8.5 0 0 1-1.3-.7l-1.9 1a1.4 1.4 0 0 1-1.6-.3l-1.4-1.4a1.4 1.4 0 0 1-.3-1.6l1-1.9a8.5 8.5 0 0 1-.7-1.3l-1.9-.5a1.4 1.4 0 0 1-1-1.3v-2a1.4 1.4 0 0 1 1-1.3l1.9-.5c.2-.5.4-.9.7-1.3l-1-1.9a1.4 1.4 0 0 1 .3-1.6l1.4-1.4a1.4 1.4 0 0 1 1.6-.3l1.9 1c.4-.3.8-.5 1.3-.7l.5-1.9a1.4 1.4 0 0 1 1.3-1h2Zm-1 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
