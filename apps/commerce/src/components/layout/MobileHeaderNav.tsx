"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { NavigationItemContent } from "../../sanity/lib/types";
import { CartTrigger } from "../cart/CartTrigger";
import { useCartDrawer } from "../cart/CartDrawerProvider";
import { CmsLink } from "../content/CmsLink";

type MobileHeaderNavProps = {
  links: NavigationItemContent[];
  logo: {
    alt: string;
    src: string;
  } | null;
  styles: Record<string, string>;
  title: string;
};

export function MobileHeaderNav({
  links,
  logo,
  styles,
  title,
}: MobileHeaderNavProps) {
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { closeCart, isOpen: isCartOpen } = useCartDrawer();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    if (!isMenuOpen && isCartOpen) {
      closeCart({ restoreFocus: false });
    }

    setIsMenuOpen((isOpen) => !isOpen);
  };

  return (
    <div className={styles.mobileNav}>
      <div className={styles.mobileRow}>
        <div className={styles.mobileLeft}>
          <button
            ref={menuButtonRef}
            aria-controls={menuId}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className={styles.menuButton}
            type="button"
            onClick={toggleMenu}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        {logo ? (
          <Link
            className={styles.mobileLogoLink}
            href="/"
            aria-label={title}
            onClick={closeMenu}
          >
            <Image
              className={styles.mobileLogoImage}
              src={logo.src}
              alt={logo.alt}
              width={160}
              height={160}
              sizes="96px"
              priority
            />
          </Link>
        ) : (
          <Link className={styles.mobileTitle} href="/" onClick={closeMenu}>
            {title}
          </Link>
        )}

        <div className={styles.mobileRight}>
          <CartTrigger onBeforeOpen={closeMenu} />
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className={styles.mobilePanel}
        hidden={!isMenuOpen}
        id={menuId}
      >
        {links.map((link) => (
          <CmsLink
            key={link._key ?? `${link.label}-${link.href}`}
            className={styles.mobileLink}
            label={link.label}
            href={link.href}
            openInNewTab={link.openInNewTab}
            onClick={closeMenu}
          />
        ))}
      </nav>
    </div>
  );
}
