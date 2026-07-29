import type { SharedListParticipant } from "../lib/friend-utils";
import styles from "./ParticipantList.module.css";

export function ParticipantList({
  participants,
}: {
  participants: SharedListParticipant[];
}) {
  return (
    <span className={styles.participants}>
      {participants.map((participant) => (
        <span className={styles.participant} key={participant.profile.id}>
          <span className={styles.name}>
            {participant.profile.display_name || "Friend"}
          </span>
          <span className={styles.access}>{participant.accessLabel}</span>
        </span>
      ))}
    </span>
  );
}
