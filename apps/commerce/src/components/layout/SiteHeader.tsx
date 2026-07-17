import Image from "next/image";
import Link from "next/link";
import { getSafeCmsHref } from "../../lib/content";
import { urlForSanityImage } from "../../sanity/lib/image";
import type {
  NavigationItemContent,
  SanityHeroImage,
  SiteSettingsContent,
} from "../../sanity/lib/types";
import { CartTrigger } from "../cart/CartTrigger";
import { CmsLink } from "../content/CmsLink";
import { MobileHeaderNav } from "./MobileHeaderNav";
import styles from "./SiteHeader.module.css";

const fallbackTitle = "Cody Hart Store";
const cartHref = "/cart";

type HeaderLogoImage = SanityHeroImage & {
  asset: NonNullable<SanityHeroImage["asset"]> & {
    url: string;
  };
};

const getValidLinks = (links: NavigationItemContent[] | null | undefined) =>
  (links ?? []).filter((link) => {
    const label = link.label?.trim();
    const href = getSafeCmsHref(link.href);

    return Boolean(label && href && href !== cartHref);
  });

const hasHeaderLogo = (
  logo: SanityHeroImage | null | undefined,
): logo is HeaderLogoImage => Boolean(logo?.asset?.url);

export function SiteHeader({
  settings,
}: {
  settings: SiteSettingsContent | null;
}) {
  const title = settings?.siteTitle?.trim() || fallbackTitle;
  const logo = hasHeaderLogo(settings?.logo) ? settings.logo : null;
  const logoSrc = logo
    ? urlForSanityImage(logo)
        .width(160)
        .height(160)
        .fit("crop")
        .auto("format")
        .url()
    : null;
  const logoAlt = logo?.alt?.trim() || title;
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
    <header className={`${styles.header} storefront-chrome`}>
      <nav className={styles.desktopNav} aria-label="Main navigation">
        {logo && logoSrc ? (
          <Link className={styles.logoLink} href="/" aria-label={title}>
            <Image
              className={styles.logoImage}
              src={logoSrc}
              alt={logoAlt}
              width={160}
              height={160}
              sizes="48px"
              priority
            />
          </Link>
        ) : (
          <Link className={styles.title} href="/">
            {title}
          </Link>
        )}
        <div className={styles.links}>
          {links.map((link) => (
            <CmsLink
              key={link._key ?? `${link.label}-${link.href}`}
              label={link.label}
              href={link.href}
              openInNewTab={link.openInNewTab}
            />
          ))}
          <CartTrigger />
        </div>
      </nav>
      <MobileHeaderNav
        title={title}
        logo={logoSrc ? { src: logoSrc, alt: logoAlt } : null}
        links={links}
        styles={styles}
      />
    </header>
  );
}
