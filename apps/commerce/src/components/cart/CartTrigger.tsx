"use client";

import { useRef } from "react";
import { useCartDrawer } from "./CartDrawerProvider";

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
      className="cart-trigger"
      type="button"
      onClick={() => {
        onBeforeOpen?.();
        openCart(buttonRef.current);
      }}
    >
      <span>Cart{totalQuantity ? ` (${totalQuantity})` : ""}</span>
    </button>
  );
}
