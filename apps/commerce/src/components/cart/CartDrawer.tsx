"use client";

import Link from "next/link";
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useRef,
} from "react";
import { CartDrawerLine } from "./CartDrawerLine";
import { useCartDrawer } from "./CartDrawerProvider";
import { formatShopifyPrice } from "../../lib/shopify/format";

export function CartDrawer() {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { cart, closeCart, error, isLoading, isOpen, refreshCart } =
    useCartDrawer();
  const lines = cart?.lines.nodes.filter((line) => line.quantity > 0) ?? [];
  const hasLines = lines.length > 0 && (cart?.totalQuantity ?? 0) > 0;
  const totalQuantity =
    !error && cart && cart.totalQuantity > 0 ? cart.totalQuantity : null;
  const headingLabel = totalQuantity
    ? `Cart, ${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`
    : "Cart";

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
      document.body.classList.add("cart-drawer-open");
      closeButtonRef.current?.focus();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
      document.body.classList.remove("cart-drawer-open");
    }

    return () => {
      document.body.classList.remove("cart-drawer-open");
    };
  }, [isOpen]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      closeCart();
    }
  };

  const handleCancel = (event: Event) => {
    event.preventDefault();
    closeCart();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const focusableElements = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    dialog.addEventListener("cancel", handleCancel);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  });

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cart-drawer-heading"
      aria-modal="true"
      className="cart-drawer-dialog"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <section className="cart-drawer-panel">
        <header className="cart-drawer-header">
          <h2 id="cart-drawer-heading" aria-label={headingLabel}>
            <span>Cart</span>
            {totalQuantity ? (
              <span aria-hidden="true" className="cart-drawer-heading-count">
                {totalQuantity}
              </span>
            ) : null}
          </h2>
          <button
            ref={closeButtonRef}
            aria-label="Close cart"
            className="cart-drawer-close"
            type="button"
            onClick={() => closeCart()}
          >
            ×
          </button>
        </header>

        <div className="cart-drawer-body">
          {isLoading && !cart ? (
            <p className="cart-drawer-status" role="status">
              Loading cart...
            </p>
          ) : null}
          {isLoading && cart ? (
            <p className="cart-drawer-status" role="status">
              Refreshing cart...
            </p>
          ) : null}

          {error ? (
            <div className="cart-drawer-state" role="alert">
              <p>The cart could not be loaded.</p>
              <button type="button" onClick={() => void refreshCart()}>
                Retry
              </button>
              <Link
                href="/cart"
                onClick={() => closeCart({ restoreFocus: false })}
              >
                View full cart
              </Link>
            </div>
          ) : null}

          {!error && !isLoading && !hasLines ? (
            <div className="cart-drawer-state">
              <p>Your cart is empty.</p>
              <Link href="/store">Continue shopping</Link>
            </div>
          ) : null}

          {!error && hasLines ? (
            <ul className="cart-drawer-lines">
              {lines.map((line) => (
                <CartDrawerLine
                  key={line.lineId}
                  line={line}
                  onMutationSuccess={refreshCart}
                />
              ))}
            </ul>
          ) : null}
        </div>

        <footer className="cart-drawer-footer">
          {!error && cart && hasLines ? (
            <div className="cart-drawer-totals">
              <div>
                <span>Subtotal</span>
                <span>{formatShopifyPrice(cart.cost.subtotalAmount)}</span>
              </div>
              <div>
                <span>Total</span>
                <span>{formatShopifyPrice(cart.cost.totalAmount)}</span>
              </div>
            </div>
          ) : null}
          {!error && cart && hasLines ? (
            <a className="checkout-link" href={cart.checkoutUrl}>
              Continue to checkout
            </a>
          ) : null}
          <Link
            className="cart-store-link"
            href="/cart"
            onClick={() => closeCart({ restoreFocus: false })}
          >
            View full cart
          </Link>
        </footer>
      </section>
    </dialog>
  );
}
