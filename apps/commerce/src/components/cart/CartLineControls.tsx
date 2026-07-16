"use client";

import { useActionState, useEffect } from "react";
import {
  changeCartLineQuantity,
  removeCartLineFromCart,
  type CartLineActionState,
} from "../../app/cart/actions";

const initialActionState: CartLineActionState = {
  error: null,
  success: false,
};

function QuantityButton({
  children,
  disabled,
  label,
}: {
  children: string;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="cart-quantity-button"
      disabled={disabled}
      type="submit"
    >
      {children}
    </button>
  );
}

function ActionError({ state }: { state: CartLineActionState }) {
  return state.error ? (
    <p className="cart-line-action-error" role="alert">
      {state.error}
    </p>
  ) : null;
}

export function CartLineControls({
  lineId,
  onSuccess,
  productTitle,
  quantity,
}: {
  lineId: string;
  onSuccess?: () => Promise<void> | void;
  productTitle: string;
  quantity: number;
}) {
  const [decrementState, decrementAction, isDecrementPending] = useActionState(
    quantity === 1 ? removeCartLineFromCart : changeCartLineQuantity,
    initialActionState,
  );
  const [incrementState, incrementAction, isIncrementPending] = useActionState(
    changeCartLineQuantity,
    initialActionState,
  );
  const nextDecrementQuantity = Math.max(1, quantity - 1);
  const nextIncrementQuantity = Math.min(99, quantity + 1);
  const isPending = isDecrementPending || isIncrementPending;

  useEffect(() => {
    if (decrementState.success || incrementState.success) {
      void onSuccess?.();
    }
  }, [decrementState, incrementState, onSuccess]);

  return (
    <div className={`cart-line-controls${isPending ? " is-pending" : ""}`}>
      <div
        className="cart-quantity-controls"
        role="group"
        aria-label={`${productTitle} quantity`}
      >
        <form action={decrementAction}>
          <input name="lineId" type="hidden" value={lineId} />
          {quantity > 1 ? (
            <input
              name="quantity"
              type="hidden"
              value={String(nextDecrementQuantity)}
            />
          ) : null}
          <QuantityButton
            disabled={isPending}
            label={
              quantity === 1
                ? `Remove ${productTitle} from cart`
                : `Decrease quantity for ${productTitle}`
            }
          >
            −
          </QuantityButton>
        </form>

        <span aria-live="polite" className="cart-quantity-value">
          {quantity}
        </span>

        <form action={incrementAction}>
          <input name="lineId" type="hidden" value={lineId} />
          <input
            name="quantity"
            type="hidden"
            value={String(nextIncrementQuantity)}
          />
          <QuantityButton
            disabled={isPending || quantity >= 99}
            label={`Increase quantity for ${productTitle}`}
          >
            +
          </QuantityButton>
        </form>
      </div>

      <ActionError state={decrementState} />
      <ActionError state={incrementState} />
    </div>
  );
}
