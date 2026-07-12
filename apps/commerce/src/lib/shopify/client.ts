import "server-only";

type ShopifyGraphQlResponse<TData> = {
  data?: TData;
  errors?: Array<{
    message?: string;
  }>;
};

const requiredEnv = {
  SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  SHOPIFY_STOREFRONT_API_VERSION: process.env.SHOPIFY_STOREFRONT_API_VERSION,
};

const getShopifyConfig = () => {
  const missingVariables = Object.entries(requiredEnv)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing Shopify configuration: ${missingVariables.join(", ")}`,
    );
  }

  const domain = requiredEnv.SHOPIFY_STORE_DOMAIN!
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/g, "");

  return {
    domain,
    token: requiredEnv.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
    version: requiredEnv.SHOPIFY_STOREFRONT_API_VERSION!,
  };
};

export const shopifyStorefrontRequest = async <TData>({
  query,
  variables,
  buyerIp,
}: {
  query: string;
  variables?: Record<string, unknown>;
  buyerIp?: string;
}) => {
  const { domain, token, version } = getShopifyConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Shopify-Storefront-Private-Token": token,
  };

  if (buyerIp) {
    headers["Shopify-Storefront-Buyer-IP"] = buyerIp;
  }

  const response = await fetch(
    `https://${domain}/api/${version}/graphql.json`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Shopify request failed with status ${response.status}.`);
  }

  const result = (await response.json()) as ShopifyGraphQlResponse<TData>;

  if (result.errors?.length) {
    const messages = result.errors
      .map((error) => error.message)
      .filter(Boolean)
      .join("; ");

    throw new Error(
      messages
        ? `Shopify GraphQL error: ${messages}`
        : "Shopify GraphQL returned an error.",
    );
  }

  if (!result.data) {
    throw new Error("Shopify response did not include data.");
  }

  return result.data;
};
