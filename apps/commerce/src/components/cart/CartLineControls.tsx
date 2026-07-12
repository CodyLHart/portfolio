"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
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
  const { pending } = useFormStatus();

  return (
    <button
      aria-label={label}
      className="cart-quantity-button"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "..." : children}
    </button>
  );
}

function RemoveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="cart-remove-button" disabled={pending} type="submit">
      {pending ? "Removing..." : label}
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
  productTitle,
  quantity,
}: {
  lineId: string;
  productTitle: string;
  quantity: number;
}) {
  const [decrementState, decrementAction] = useActionState(
    quantity === 1 ? removeCartLineFromCart : changeCartLineQuantity,
    initialActionState,
  );
  const [incrementState, incrementAction] = useActionState(
    changeCartLineQuantity,
    initialActionState,
  );
  const [removeState, removeAction] = useActionState(
    removeCartLineFromCart,
    initialActionState,
  );
  const nextDecrementQuantity = Math.max(1, quantity - 1);
  const nextIncrementQuantity = Math.min(99, quantity + 1);

  return (
    <div className="cart-line-controls">
      <div className="cart-quantity-controls" aria-label={`${productTitle} quantity`}>
        <form action={decrementAction}>
          <input name="lineId" type="hidden" value={lineId} />
          {quantity > 1 ? (
            <input
              name="quantity"
              type="hidden"
              value={String(nextDecrementQuantity)}
            />
          ) : null}
          <QuantityButton label={`Decrease quantity for ${productTitle}`}>
            -
          </QuantityButton>
        </form>

        <span className="cart-quantity-value">Quantity {quantity}</span>

        <form action={incrementAction}>
          <input name="lineId" type="hidden" value={lineId} />
          <input
            name="quantity"
            type="hidden"
            value={String(nextIncrementQuantity)}
          />
          <QuantityButton
            disabled={quantity >= 99}
            label={`Increase quantity for ${productTitle}`}
          >
            +
          </QuantityButton>
        </form>
      </div>

      <form action={removeAction}>
        <input name="lineId" type="hidden" value={lineId} />
        <RemoveButton label={`Remove ${productTitle}`} />
      </form>

      <ActionError state={decrementState} />
      <ActionError state={incrementState} />
      <ActionError state={removeState} />
    </div>
  );
}
