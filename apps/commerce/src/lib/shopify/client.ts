import "server-only";

type ShopifyGraphQlResponse<TData> = {
  data?: TData;
  errors?: Array<{
    message?: string;
  }>;
};

type ShopifyRetryMode = "none" | "read";

type ShopifyFetchOptions = {
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  signal?: AbortSignal;
};

const retryableStatuses = new Set([429, 500, 502, 503, 504]);
const maxRetryAttempts = 3;
const maxAttempts = maxRetryAttempts + 1;
const retryAfterCapMs = 2_000;
const fallbackRetryDelaysMs = [400, 900, 1_800];

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

const sleep = (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const getRetryDelay = (attempt: number, retryAfter: string | null) => {
  if (retryAfter) {
    const retryAfterSeconds = Number.parseFloat(retryAfter);

    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
      return Math.min(retryAfterSeconds * 1_000, retryAfterCapMs);
    }

    const retryAfterDate = Date.parse(retryAfter);

    if (!Number.isNaN(retryAfterDate)) {
      return Math.min(
        Math.max(retryAfterDate - Date.now(), 0),
        retryAfterCapMs,
      );
    }
  }

  const baseDelay =
    fallbackRetryDelaysMs[Math.min(attempt - 1, fallbackRetryDelaysMs.length - 1)] ??
    fallbackRetryDelaysMs[fallbackRetryDelaysMs.length - 1];
  const jitter = Math.floor(Math.random() * 120);

  return baseDelay + jitter;
};

const isAbortError = (error: unknown) =>
  error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";

const warnRetry = (message: string) => {
  console.warn(message);
};

export const shopifyStorefrontRequest = async <TData>({
  query,
  variables,
  buyerIp,
  retryMode = "none",
  fetchOptions,
}: {
  query: string;
  variables?: Record<string, unknown>;
  buyerIp?: string;
  retryMode?: ShopifyRetryMode;
  fetchOptions?: ShopifyFetchOptions;
}) => {
  const { domain, token, version } = getShopifyConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Shopify-Storefront-Private-Token": token,
  };

  if (buyerIp) {
    headers["Shopify-Storefront-Buyer-IP"] = buyerIp;
  }

  const body = JSON.stringify({
    query,
    variables,
  });
  const url = `https://${domain}/api/${version}/graphql.json`;
  const shouldRetry = retryMode === "read";
  let finalStatus: number | null = null;
  let finalNetworkError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(url, {
        cache: fetchOptions?.cache,
        method: "POST",
        headers,
        body,
        next: fetchOptions?.next,
        signal: fetchOptions?.signal,
      });
    } catch (error) {
      if (!shouldRetry || isAbortError(error)) {
        throw error;
      }

      finalNetworkError = error;
      if (attempt === maxAttempts) {
        break;
      }

      warnRetry(
        `Shopify request failed at the network layer; retrying attempt ${
          attempt + 1
        } of ${maxAttempts}.`,
      );
      await sleep(getRetryDelay(attempt, null));
      continue;
    }

    if (!response.ok) {
      finalStatus = response.status;

      if (
        shouldRetry &&
        retryableStatuses.has(response.status) &&
        attempt < maxAttempts
      ) {
        warnRetry(
          `Shopify request returned ${response.status}; retrying attempt ${
            attempt + 1
          } of ${maxAttempts}.`,
        );
        await sleep(getRetryDelay(attempt, response.headers.get("Retry-After")));
        continue;
      }

      throw new Error(
        `Shopify request failed with status ${response.status} after ${attempt} ${
          attempt === 1 ? "attempt" : "attempts"
        }.`,
      );
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
  }

  if (finalStatus) {
    throw new Error(
      `Shopify request failed with status ${finalStatus} after ${maxAttempts} attempts.`,
    );
  }

  throw new Error(
    finalNetworkError
      ? `Shopify request failed at the network layer after ${maxAttempts} attempts.`
      : "Shopify request failed.",
  );
};
