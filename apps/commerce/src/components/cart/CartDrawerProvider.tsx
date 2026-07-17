"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { CartDrawer } from "./CartDrawer";
import type { PublicCart, PublicCartResponse } from "./cart-drawer-types";

type CartLoadStatus = "idle" | "loading" | "ready" | "error";

type CartDrawerContextValue = {
  cart: PublicCart | null;
  closeCart: (options?: { restoreFocus?: boolean }) => void;
  error: string | null;
  isLoading: boolean;
  isOpen: boolean;
  openCart: (
    returnFocusElement?: HTMLElement | null,
    options?: { refresh?: boolean },
  ) => void;
  refreshCart: (options?: { force?: boolean; ifNeeded?: boolean }) => Promise<void>;
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
  const requestIdRef = useRef(0);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const statusRef = useRef<CartLoadStatus>("idle");
  const pathname = usePathname();
  const [cart, setCart] = useState<PublicCart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<CartLoadStatus>("idle");

  const updateStatus = useCallback((nextStatus: CartLoadStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const refreshCart = useCallback(async (options?: {
    force?: boolean;
    ifNeeded?: boolean;
  }) => {
    if (statusRef.current === "loading" && !options?.force) {
      return;
    }

    if (options?.ifNeeded && statusRef.current === "ready" && !options.force) {
      return;
    }

    abortControllerRef.current?.abort();

    const abortController = new AbortController();
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;
    abortControllerRef.current = abortController;
    updateStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/cart", {
        cache: "no-store",
        credentials: "same-origin",
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Cart request failed.");
      }

      const payload = (await response.json()) as PublicCartResponse;

      if (!abortController.signal.aborted && requestId === requestIdRef.current) {
        setCart(payload.cart);
        updateStatus("ready");
      }
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        return;
      }

      if (requestId === requestIdRef.current) {
        setError("The cart could not be loaded.");
        updateStatus("error");
      }
    } finally {
      if (
        !abortController.signal.aborted &&
        requestId === requestIdRef.current &&
        statusRef.current === "loading"
      ) {
        updateStatus("ready");
      }
    }
  }, [updateStatus]);

  useEffect(() => {
    if (pathname === "/studio" || pathname.startsWith("/studio/")) {
      return;
    }

    void refreshCart({ ifNeeded: true });
  }, [pathname, refreshCart]);

  const openCart = useCallback(
    (
      returnFocusElement?: HTMLElement | null,
      options?: { refresh?: boolean },
    ) => {
      returnFocusRef.current =
        returnFocusElement ?? (document.activeElement as HTMLElement);
      setIsOpen(true);
      void refreshCart(
        options?.refresh ? { force: true } : { ifNeeded: true },
      );
    },
    [refreshCart],
  );

  const closeCart = useCallback((options?: { restoreFocus?: boolean }) => {
    setIsOpen(false);

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
      isLoading: status === "loading",
      isOpen,
      openCart,
      refreshCart,
    }),
    [cart, closeCart, error, isOpen, openCart, refreshCart, status],
  );

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartDrawerContext.Provider>
  );
}
