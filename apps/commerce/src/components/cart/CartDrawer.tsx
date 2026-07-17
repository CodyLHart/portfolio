"use client";

import Link from "next/link";
import {
  type TransitionEvent,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { CartDrawerLine } from "./CartDrawerLine";
import { useCartDrawer } from "./CartDrawerProvider";
import { formatShopifyPrice } from "../../lib/shopify/format";
import styles from "./CartDrawer.module.css";

export function CartDrawer() {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const openFrameRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { cart, closeCart, error, isLoading, isOpen, refreshCart } =
    useCartDrawer();
  const lines = cart?.lines.nodes.filter((line) => line.quantity > 0) ?? [];
  const hasLines = lines.length > 0 && (cart?.totalQuantity ?? 0) > 0;
  const totalQuantity =
    !error && cart && cart.totalQuantity > 0 ? cart.totalQuantity : null;
  const headingLabel = totalQuantity
    ? `Cart, ${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`
    : "Cart";

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  }, []);

  const clearOpenFrame = useCallback(() => {
    if (openFrameRef.current === null) {
      return;
    }

    window.cancelAnimationFrame(openFrameRef.current);
    openFrameRef.current = null;
  }, []);

  const shouldReduceMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const finishClose = useCallback(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    clearCloseTimeout();

    if (dialog.open) {
      dialog.close();
    }

    document.body.classList.remove("cart-drawer-open");
  }, [clearCloseTimeout]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      clearCloseTimeout();
      clearOpenFrame();
      setIsVisible(false);
      dialog.showModal();
      document.body.classList.add("cart-drawer-open");
      openFrameRef.current = window.requestAnimationFrame(() => {
        openFrameRef.current = null;
        setIsVisible(true);
        closeButtonRef.current?.focus();
      });

      return;
    }

    if (isOpen && dialog.open) {
      clearCloseTimeout();
      clearOpenFrame();
      setIsVisible(true);
      closeButtonRef.current?.focus();

      return;
    }

    if (!isOpen && dialog.open) {
      clearOpenFrame();
      setIsVisible(false);

      if (shouldReduceMotion()) {
        finishClose();
        return;
      }

      clearCloseTimeout();
      closeTimeoutRef.current = window.setTimeout(() => {
        finishClose();
      }, 240);
    }
  }, [clearCloseTimeout, clearOpenFrame, finishClose, isOpen]);

  useEffect(
    () => () => {
      clearCloseTimeout();
      clearOpenFrame();
      document.body.classList.remove("cart-drawer-open");
    },
    [clearCloseTimeout, clearOpenFrame],
  );

  const handlePanelTransitionEnd = (
    event: TransitionEvent<HTMLElement>,
  ) => {
    if (
      event.target === event.currentTarget &&
      event.propertyName === "transform" &&
      !isOpen
    ) {
      finishClose();
    }
  };

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
      className={
        isVisible ? `${styles.dialog} ${styles.dialogOpen}` : styles.dialog
      }
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <section
        className={styles.panel}
        onTransitionEnd={handlePanelTransitionEnd}
      >
        <header className={styles.header}>
          <h2 id="cart-drawer-heading" aria-label={headingLabel}>
            <span>Cart</span>
            {totalQuantity ? (
              <span aria-hidden="true" className={styles.headingCount}>
                ({totalQuantity})
              </span>
            ) : null}
          </h2>
          <button
            ref={closeButtonRef}
            aria-label="Close cart"
            className={styles.close}
            type="button"
            onClick={() => closeCart()}
          >
            ×
          </button>
        </header>

        <div className={styles.body}>
          {isLoading && !cart ? (
            <p className={styles.status} role="status">
              Loading cart...
            </p>
          ) : null}
          {isLoading && cart ? (
            <p className={styles.status} role="status">
              Refreshing cart...
            </p>
          ) : null}

          {error ? (
            <div className={styles.state} role="alert">
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
            <div className={styles.state}>
              <p>Your cart is empty.</p>
              <Link href="/store">Continue shopping</Link>
            </div>
          ) : null}

          {!error && hasLines ? (
            <ul className={styles.lines}>
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

        <footer className={styles.footer}>
          {!error && cart && hasLines ? (
            <div className={styles.totals}>
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
