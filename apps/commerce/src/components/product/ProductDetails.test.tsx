import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductDetails } from "./ProductDetails";

const openCart = vi.fn();

vi.mock("../cart/CartDrawerProvider", () => ({
  useCartDrawer: () => ({
    openCart,
  }),
}));

vi.mock("../../app/cart/actions", () => ({
  addSelectedVariantToCart: vi.fn(),
}));

const money = (amount: string) => ({
  amount,
  currencyCode: "USD",
});

const product = {
  title: "Test Shirt",
  vendor: "Cody Hart",
  productType: "Apparel",
  availableForSale: true,
  description: "Plain text description",
  descriptionHtml: "<p>Formatted description</p>",
  featuredImage: {
    url: "https://cdn.shopify.com/test-shirt-black.jpg",
    altText: "Black shirt",
    width: 1200,
    height: 1200,
  },
  images: {
    nodes: [
      {
        url: "https://cdn.shopify.com/test-shirt-blue.jpg",
        altText: "Blue shirt",
        width: 1200,
        height: 1200,
      },
    ],
  },
  options: [
    {
      id: "option-color",
      name: "Color",
      values: ["Black", "Blue", "Red"],
    },
    {
      id: "option-size",
      name: "Size",
      values: ["Small", "Medium"],
    },
  ],
  variants: {
    nodes: [
      {
        id: "variant-black-small",
        title: "Black / Small",
        availableForSale: true,
        selectedOptions: [
          { name: "Color", value: "Black" },
          { name: "Size", value: "Small" },
        ],
        price: money("20.00"),
        compareAtPrice: null,
        image: {
          url: "https://cdn.shopify.com/test-shirt-black.jpg",
          altText: "Black shirt",
          width: 1200,
          height: 1200,
        },
      },
      {
        id: "variant-blue-small",
        title: "Blue / Small",
        availableForSale: true,
        selectedOptions: [
          { name: "Color", value: "Blue" },
          { name: "Size", value: "Small" },
        ],
        price: money("24.00"),
        compareAtPrice: money("30.00"),
        image: {
          url: "https://cdn.shopify.com/test-shirt-blue.jpg",
          altText: "Blue shirt",
          width: 1200,
          height: 1200,
        },
      },
      {
        id: "variant-red-small-sold-out",
        title: "Red / Small",
        availableForSale: false,
        selectedOptions: [
          { name: "Color", value: "Red" },
          { name: "Size", value: "Small" },
        ],
        price: money("22.00"),
        compareAtPrice: null,
        image: null,
      },
    ],
  },
};

describe("ProductDetails", () => {
  beforeEach(() => {
    openCart.mockReset();
  });

  it("renders title, price, description, availability, and option groups", () => {
    render(<ProductDetails product={product} />);

    expect(screen.getByRole("heading", { level: 1, name: "Test Shirt" })).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
    expect(screen.getByText("Formatted description")).toBeInTheDocument();
    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Color" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Size" })).toBeInTheDocument();
  });

  it("updates variant price, compare-at price, image, and selected variant ID", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProductDetails product={product} />);

    await user.click(screen.getByRole("button", { name: "Blue" }));

    expect(screen.getByText("$30.00")).toBeInTheDocument();
    expect(screen.getByText("$24.00")).toBeInTheDocument();
    expect(screen.getAllByAltText("Blue shirt")[0]).toHaveAttribute(
      "src",
      "https://cdn.shopify.com/test-shirt-blue.jpg",
    );
    expect(
      container.querySelector<HTMLInputElement>('input[name="variantId"]')?.value,
    ).toBe("variant-blue-small");
  });

  it("disables unavailable selections and prevents unavailable add to cart", () => {
    const soldOutProduct = {
      ...product,
      variants: {
        nodes: [
          {
            ...product.variants.nodes[2],
          },
        ],
      },
    };

    render(<ProductDetails product={soldOutProduct} />);

    expect(screen.getByRole("button", { name: "Sold out" })).toBeDisabled();
    expect(screen.getAllByText("Sold out").length).toBeGreaterThan(0);
  });

  it("does not show meaningless default-title selectors", () => {
    const defaultProduct = {
      ...product,
      options: [
        {
          id: "option-title",
          name: "Title",
          values: ["Default Title"],
        },
      ],
      variants: {
        nodes: [
          {
            ...product.variants.nodes[0],
            selectedOptions: [{ name: "Title", value: "Default Title" }],
          },
        ],
      },
    };

    render(<ProductDetails product={defaultProduct} />);

    expect(screen.queryByRole("heading", { level: 2, name: "Options" })).not.toBeInTheDocument();
  });
});
