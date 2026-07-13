import Link from "next/link";
import { getSafeCmsHref } from "../../lib/content";
import type {
  NavigationItemContent,
  SiteSettingsContent,
} from "../../sanity/lib/types";
import { CmsLink } from "../content/CmsLink";

const fallbackTitle = "Cody Hart Store";
const cartHref = "/cart";

const getValidLinks = (links: NavigationItemContent[] | null | undefined) =>
  (links ?? []).filter((link) => {
    const label = link.label?.trim();
    const href = getSafeCmsHref(link.href);

    return Boolean(label && href && href !== cartHref);
  });

export function SiteHeader({
  settings,
}: {
  settings: SiteSettingsContent | null;
}) {
  const title = settings?.siteTitle?.trim() || fallbackTitle;
  const headerLinks = getValidLinks(settings?.headerLinks);
  const links =
    headerLinks.length > 0
      ? headerLinks
      : [
          {
            _key: "fallback-store",
            label: "Store",
            href: "/store",
            openInNewTab: false,
          },
        ];

  return (
    <header className="site-header storefront-chrome">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="site-title" href="/">
          {title}
        </Link>
        <div className="site-nav-links">
          {links.map((link) => (
            <CmsLink
              key={link._key ?? `${link.label}-${link.href}`}
              label={link.label}
              href={link.href}
              openInNewTab={link.openInNewTab}
            />
          ))}
          <Link href={cartHref}>Cart</Link>
        </div>
      </nav>
    </header>
  );
}
