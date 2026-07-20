const retryableStatuses = new Set([429, 500, 502, 503, 504]);

export const maxRetryAttempts = 3;
export const maxShopifyAttempts = maxRetryAttempts + 1;
export const retryAfterCapMs = 2_000;
export const fallbackRetryDelaysMs = [400, 900, 1_800];

export const isRetryableShopifyStatus = (status: number) =>
  retryableStatuses.has(status);

export const getShopifyRetryDelayMs = (
  attempt: number,
  retryAfter: string | null,
  jitter = Math.floor(Math.random() * 120),
) => {
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
    fallbackRetryDelaysMs[
      Math.min(attempt - 1, fallbackRetryDelaysMs.length - 1)
    ] ?? fallbackRetryDelaysMs[fallbackRetryDelaysMs.length - 1];

  return baseDelay + jitter;
};
