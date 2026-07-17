import { getSafeCmsHref, splitTextParagraphs } from "../../lib/content";
import type {
  NavigationItemContent,
  SiteSettingsContent,
} from "../../sanity/lib/types";
import { CmsLink } from "../content/CmsLink";
import styles from "./SiteFooter.module.css";

const fallbackCopyright = "© Cody Hart";

const getValidLinks = (links: NavigationItemContent[] | null | undefined) =>
  (links ?? []).filter((link) =>
    Boolean(link.label?.trim() && getSafeCmsHref(link.href)),
  );

export function SiteFooter({
  settings,
}: {
  settings: SiteSettingsContent | null;
}) {
  const heading = settings?.footerHeading?.trim();
  const body = settings?.footerBody?.trim();
  const footerLinks = getValidLinks(settings?.footerLinks);
  const copyright = settings?.copyrightText?.trim() || fallbackCopyright;

  return (
    <footer className={`${styles.footer} storefront-chrome`}>
      {heading || body ? (
        <div className={styles.content}>
          {heading ? <h2>{heading}</h2> : null}
          {body ? (
            <div className={styles.body}>
              {splitTextParagraphs(body).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {footerLinks.length > 0 ? (
        <nav className={styles.links} aria-label="Footer navigation">
          <ul>
            {footerLinks.map((link) => (
              <li key={link._key ?? `${link.label}-${link.href}`}>
                <CmsLink
                  label={link.label}
                  href={link.href}
                  openInNewTab={link.openInNewTab}
                />
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <small>{copyright}</small>
    </footer>
  );
}
