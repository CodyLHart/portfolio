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
  title: string;
};

export function MobileHeaderNav({ links, logo, title }: MobileHeaderNavProps) {
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
    <div className="mobile-site-nav">
      <div className="mobile-site-nav-row">
        <div className="mobile-site-nav-left">
          <button
            ref={menuButtonRef}
            aria-controls={menuId}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="mobile-menu-button"
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
            className="mobile-site-logo-link"
            href="/"
            aria-label={title}
            onClick={closeMenu}
          >
            <Image
              className="mobile-site-logo-image"
              src={logo.src}
              alt={logo.alt}
              width={160}
              height={160}
              sizes="96px"
              priority
            />
          </Link>
        ) : (
          <Link className="mobile-site-title" href="/" onClick={closeMenu}>
            {title}
          </Link>
        )}

        <div className="mobile-site-nav-right">
          <CartTrigger onBeforeOpen={closeMenu} />
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="mobile-menu-panel"
        hidden={!isMenuOpen}
        id={menuId}
      >
        {links.map((link) => (
          <CmsLink
            key={link._key ?? `${link.label}-${link.href}`}
            className="mobile-menu-link"
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
