import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CartLineControls } from "./CartLineControls";

vi.mock("../../app/cart/actions", () => ({
  changeCartLineQuantity: vi.fn(),
  removeCartLineFromCart: vi.fn(),
}));

describe("CartLineControls", () => {
  it("wires increment and decrement quantities for quantities above one", () => {
    const { container } = render(
      <CartLineControls
        lineId="gid://shopify/CartLine/1"
        productTitle="Test Shirt"
        quantity={3}
      />,
    );
    const forms = container.querySelectorAll("form");

    expect(screen.getByRole("group", { name: "Test Shirt quantity" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Decrease quantity for Test Shirt" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Increase quantity for Test Shirt" }),
    ).toBeInTheDocument();
    expect(forms[0]?.querySelector<HTMLInputElement>('input[name="quantity"]')?.value).toBe("2");
    expect(forms[1]?.querySelector<HTMLInputElement>('input[name="quantity"]')?.value).toBe("4");
  });

  it("uses remove behavior when decrementing from one", () => {
    const { container } = render(
      <CartLineControls
        lineId="gid://shopify/CartLine/1"
        productTitle="Test Shirt"
        quantity={1}
      />,
    );
    const decrementForm = container.querySelector("form");

    expect(
      screen.getByRole("button", { name: "Remove Test Shirt from cart" }),
    ).toBeInTheDocument();
    expect(
      decrementForm?.querySelector<HTMLInputElement>('input[name="quantity"]'),
    ).toBeNull();
  });

  it("disables increment at the maximum supported quantity", () => {
    render(
      <CartLineControls
        lineId="gid://shopify/CartLine/1"
        productTitle="Test Shirt"
        quantity={99}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Increase quantity for Test Shirt" }),
    ).toBeDisabled();
  });
});
