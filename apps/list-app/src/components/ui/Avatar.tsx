import type { Profile } from "../../lib/types";
import styles from "./Avatar.module.css";

export function Avatar({
  profile,
  size = "default",
}: {
  profile: Profile;
  size?: "default" | "large";
}) {
  return (
    <span
      className={[styles.avatar, size === "large" ? styles.large : ""]
        .filter(Boolean)
        .join(" ")}
      style={
        profile.avatar_url
          ? { backgroundImage: `url(${profile.avatar_url})` }
          : undefined
      }
      title={profile.email}
    >
      {profile.avatar_url ? null : profile.display_name.slice(0, 2).toUpperCase()}
    </span>
  );
}
