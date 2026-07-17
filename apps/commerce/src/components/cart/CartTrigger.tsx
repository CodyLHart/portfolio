"use client";

import { useRef } from "react";
import { useCartDrawer } from "./CartDrawerProvider";
import styles from "./CartTrigger.module.css";

export function CartTrigger({ onBeforeOpen }: { onBeforeOpen?: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { cart, error, isOpen, openCart } = useCartDrawer();
  const totalQuantity =
    !error && cart && cart.totalQuantity > 0 ? cart.totalQuantity : null;
  const accessibleLabel = totalQuantity
    ? `Cart, ${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`
    : "Cart";

  return (
    <button
      ref={buttonRef}
      aria-label={accessibleLabel}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      className={styles.trigger}
      type="button"
      onClick={() => {
        onBeforeOpen?.();
        openCart(buttonRef.current);
      }}
    >
      <svg
        aria-hidden="true"
        className={styles.icon}
        fill="none"
        focusable="false"
        viewBox="0 0 24 24"
      >
        <path
          d="M3.5 4.5h2.25l2.1 10.1a2 2 0 0 0 1.96 1.6h7.58a2 2 0 0 0 1.92-1.44l1.34-4.7a1.4 1.4 0 0 0-1.35-1.78H7.2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <circle cx="9.3" cy="20" r="0.95" fill="currentColor" />
        <circle cx="17.3" cy="20" r="0.95" fill="currentColor" />
      </svg>
      {totalQuantity ? (
        <span className={styles.count}>({totalQuantity})</span>
      ) : null}
    </button>
  );
}
