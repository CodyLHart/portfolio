"use client";

import { useRef } from "react";
import { useCartDrawer } from "./CartDrawerProvider";

export function CartTrigger() {
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
      onClick={() => openCart(buttonRef.current)}
    >
      <span>Cart</span>
      {totalQuantity ? (
        <span aria-hidden="true" className="cart-trigger-count">
          {totalQuantity}
        </span>
      ) : null}
    </button>
  );
}
