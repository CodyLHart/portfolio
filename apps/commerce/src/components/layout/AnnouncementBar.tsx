import Link from "next/link";
import { getSafeCmsHref, isExternalHref } from "../../lib/content";
import type { SiteSettingsContent } from "../../sanity/lib/types";
import styles from "./AnnouncementBar.module.css";

type AnnouncementBarProps = {
  settings: SiteSettingsContent | null;
};

export function AnnouncementBar({ settings }: AnnouncementBarProps) {
  const text = settings?.announcementText?.trim();

  if (!settings?.announcementEnabled || !text) {
    return null;
  }

  const link = settings.announcementLink;
  const safeHref = getSafeCmsHref(link?.href);
  const shouldOpenInNewTab = Boolean(link?.openInNewTab);
  const newTabProps = shouldOpenInNewTab
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <aside
      className={`${styles.bar} storefront-chrome`}
      aria-label="Store announcement"
    >
      {safeHref && isExternalHref(safeHref) ? (
        <a
          className={styles.link}
          href={safeHref}
          {...newTabProps}
        >
          {text}
        </a>
      ) : safeHref ? (
        <Link className={styles.link} href={safeHref} {...newTabProps}>
          {text}
        </Link>
      ) : (
        <p>{text}</p>
      )}
    </aside>
  );
}
