import Image from "next/image";
import Link from "next/link";
import { CartLineControls } from "../../components/cart/CartLineControls";
import { formatShopifyPrice } from "../../lib/shopify/format";
import { getCart } from "../../lib/shopify/cart";
import { getCartCookie } from "../../lib/shopify/cart-cookie";
import { getBuyerIp } from "../../lib/shopify/request";
import type { ShopifyCart, ShopifyCartLine, ShopifyImage } from "../../lib/shopify/types";

const isValidImageSize = (image: ShopifyImage) =>
  Boolean(image.width && image.width > 0 && image.height && image.height > 0);

const isDefaultVariant = (line: ShopifyCartLine) =>
  line.merchandise.title.toLowerCase() === "default title" ||
  (line.merchandise.selectedOptions.length === 1 &&
    line.merchandise.selectedOptions[0]?.name.toLowerCase() === "title" &&
    line.merchandise.selectedOptions[0]?.value.toLowerCase() === "default title");

const getVariantLabel = (line: ShopifyCartLine) =>
  isDefaultVariant(line)
    ? null
    : line.merchandise.selectedOptions
        .map((option) => `${option.name}: ${option.value}`)
        .join(", ") || line.merchandise.title;

const EmptyCart = () => (
  <section className="empty-cart" aria-labelledby="empty-cart-heading">
    <h1 id="empty-cart-heading">Your cart</h1>
    <p>Your cart is empty.</p>
    <Link className="commerce-link" href="/store">
      Back to store
    </Link>
  </section>
);

const CartLineImage = ({ line }: { line: ShopifyCartLine }) => {
  const image = line.merchandise.image;

  return (
    <div className="cart-line-image">
      {image ? (
        <Image
          src={image.url}
          alt={image.altText ?? line.merchandise.product.title}
          width={isValidImageSize(image) ? image.width! : 300}
          height={isValidImageSize(image) ? image.height! : 300}
          sizes="120px"
        />
      ) : (
        <div className="cart-line-image-placeholder">No image</div>
      )}
    </div>
  );
};

const CartContents = ({ cart }: { cart: ShopifyCart }) => (
  <main className="cart-shell">
    <header className="cart-header">
      <h1>Your cart</h1>
      <p>{cart.totalQuantity} item{cart.totalQuantity === 1 ? "" : "s"}</p>
    </header>

    <ul className="cart-lines">
      {cart.lines.nodes.filter((line) => line.quantity > 0).map((line) => {
        const variantLabel = getVariantLabel(line);

        return (
          <li className="cart-line" key={line.id}>
            <CartLineImage line={line} />
            <div className="cart-line-details">
              <Link href={`/store/${line.merchandise.product.handle}`}>
                {line.merchandise.product.title}
              </Link>
              {variantLabel ? <p className="cart-line-meta">{variantLabel}</p> : null}
              <CartLineControls
                lineId={line.id}
                productTitle={line.merchandise.product.title}
                quantity={line.quantity}
              />
            </div>
            <p className="cart-line-total">
              {formatShopifyPrice(line.cost.totalAmount)}
            </p>
          </li>
        );
      })}
    </ul>

    <section className="cart-summary" aria-label="Cart totals">
      <div>
        <span>Subtotal</span>
        <span>{formatShopifyPrice(cart.cost.subtotalAmount)}</span>
      </div>
      <div>
        <span>Total</span>
        <span>{formatShopifyPrice(cart.cost.totalAmount)}</span>
      </div>
      <a className="checkout-link" href={cart.checkoutUrl}>
        Continue to checkout
      </a>
      <Link className="cart-store-link" href="/store">
        Back to store
      </Link>
    </section>
  </main>
);

export default async function CartPage() {
  const cartId = await getCartCookie();

  if (!cartId) {
    return (
      <main className="cart-shell">
        <EmptyCart />
      </main>
    );
  }

  let cart = null;

  try {
    cart = await getCart(cartId, await getBuyerIp());
  } catch {
    cart = null;
  }

  if (!cart || cart.lines.nodes.length === 0) {
    return (
      <main className="cart-shell">
        <EmptyCart />
      </main>
    );
  }

  if (cart.totalQuantity < 1 || cart.lines.nodes.every((line) => line.quantity < 1)) {
    return (
      <main className="cart-shell">
        <EmptyCart />
      </main>
    );
  }

  return <CartContents cart={cart} />;
}
