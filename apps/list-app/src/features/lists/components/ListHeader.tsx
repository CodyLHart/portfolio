import { AppIcon } from "../../../components/ui/AppIcon";
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
          <AppIcon icon="fa-solid fa-arrow-left" />
          Your lists
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
          <AppIcon icon="fa-solid fa-share-nodes" />
        </button>
        <button
          aria-label="History"
          className="list-tool-button"
          onClick={onOpenHistory}
          title="History"
          type="button"
        >
          <AppIcon icon="fa-solid fa-clock-rotate-left" />
        </button>
        <button
          aria-label="Settings"
          className="list-tool-button"
          onClick={onOpenOwnerSettings}
          title="Settings"
          type="button"
        >
          <AppIcon icon="fa-solid fa-gear" />
        </button>
      </div>
    </div>
  );
}
