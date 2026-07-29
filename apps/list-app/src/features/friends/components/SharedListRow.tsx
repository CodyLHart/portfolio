import { AppIcon } from "../../../components/ui/AppIcon";
import type { SharedListSummary } from "../lib/friend-utils";
import { ParticipantList } from "./ParticipantList";
import styles from "./SharedListRow.module.css";

export function SharedListRow({
  onOpenList,
  sharedList,
}: {
  onOpenList: (listId: string) => void;
  sharedList: SharedListSummary;
}) {
  return (
    <a
      className={styles.row}
      href="/"
      onClick={(event) => {
        event.preventDefault();
        onOpenList(sharedList.list.id);
      }}
    >
      <span className={styles.main}>
        <strong>{sharedList.list.title}</strong>
        <ParticipantList participants={sharedList.participants} />
      </span>
      <span aria-hidden="true" className="list-row-chevron">
        <AppIcon icon="fa-solid fa-chevron-right" />
      </span>
    </a>
  );
}
