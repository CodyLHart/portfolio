export type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

export type ShopifyImage = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type ShopifyProductSummary = {
  id: string;
  title: string;
  handle: string;
  featuredImage: ShopifyImage | null;
  priceRange: {
    minVariantPrice: ShopifyMoney;
  };
};

export type ProductsQueryResponse = {
  products: {
    nodes: ShopifyProductSummary[];
  };
};

export type ShopifySelectedOption = {
  name: string;
  value: string;
};

export type ShopifyProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type ShopifyProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: ShopifySelectedOption[];
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  image: ShopifyImage | null;
};

export type ShopifyProduct = ShopifyProductSummary & {
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  vendor: string;
  productType: string;
  tags: string[];
  seo: {
    title: string | null;
    description: string | null;
  };
  images: {
    nodes: ShopifyImage[];
  };
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  options: ShopifyProductOption[];
  variants: {
    nodes: ShopifyProductVariant[];
  };
};

export type ProductByHandleQueryResponse = {
  product: ShopifyProduct | null;
};

export type ShopifyCartLine = {
  id: string;
  quantity: number;
  cost: {
    totalAmount: ShopifyMoney;
  };
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    selectedOptions: ShopifySelectedOption[];
    image: ShopifyImage | null;
    price: ShopifyMoney;
    product: {
      title: string;
      handle: string;
    };
  };
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
  };
  lines: {
    nodes: ShopifyCartLine[];
  };
};

export type ShopifyCartUserError = {
  field: string[] | null;
  message: string;
  code?: string | null;
};

export type CartQueryResponse = {
  cart: ShopifyCart | null;
};

export type CartCreateResponse = {
  cartCreate: {
    cart: ShopifyCart | null;
    userErrors: ShopifyCartUserError[];
  };
};

export type CartLinesAddResponse = {
  cartLinesAdd: {
    cart: ShopifyCart | null;
    userErrors: ShopifyCartUserError[];
  };
};

export type CartLinesUpdateResponse = {
  cartLinesUpdate: {
    cart: ShopifyCart | null;
    userErrors: ShopifyCartUserError[];
  };
};

export type CartLinesRemoveResponse = {
  cartLinesRemove: {
    cart: ShopifyCart | null;
    userErrors: ShopifyCartUserError[];
  };
};
