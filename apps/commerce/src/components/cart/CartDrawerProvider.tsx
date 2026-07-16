"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { CartDrawer } from "./CartDrawer";
import type { PublicCart, PublicCartResponse } from "./cart-drawer-types";

type CartDrawerContextValue = {
  cart: PublicCart | null;
  closeCart: (options?: { restoreFocus?: boolean }) => void;
  error: string | null;
  isLoading: boolean;
  isOpen: boolean;
  openCart: (returnFocusElement?: HTMLElement | null) => void;
  refreshCart: () => Promise<void>;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);

  if (!context) {
    throw new Error("useCartDrawer must be used within CartDrawerProvider.");
  }

  return context;
}

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [cart, setCart] = useState<PublicCart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const refreshCart = useCallback(async () => {
    abortControllerRef.current?.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cart", {
        cache: "no-store",
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Cart request failed.");
      }

      const payload = (await response.json()) as PublicCartResponse;

      if (!abortController.signal.aborted) {
        setCart(payload.cart);
      }
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        return;
      }

      setError("The cart could not be loaded.");
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const openCart = useCallback(
    (returnFocusElement?: HTMLElement | null) => {
      returnFocusRef.current =
        returnFocusElement ?? (document.activeElement as HTMLElement);
      setIsOpen(true);
      void refreshCart();
    },
    [refreshCart],
  );

  const closeCart = useCallback((options?: { restoreFocus?: boolean }) => {
    abortControllerRef.current?.abort();
    setIsOpen(false);
    setIsLoading(false);

    if (options?.restoreFocus === false) {
      return;
    }

    window.requestAnimationFrame(() => {
      returnFocusRef.current?.focus();
    });
  }, []);

  const value = useMemo<CartDrawerContextValue>(
    () => ({
      cart,
      closeCart,
      error,
      isLoading,
      isOpen,
      openCart,
      refreshCart,
    }),
    [cart, closeCart, error, isLoading, isOpen, openCart, refreshCart],
  );

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartDrawerContext.Provider>
  );
}
