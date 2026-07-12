import "server-only";

import { headers } from "next/headers";

const isConservativeIpAddress = (value: string) =>
  value.length <= 45 && /^[0-9a-fA-F:.]+$/.test(value);

export const getBuyerIp = async () => {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const realIp = headerStore.get("x-real-ip");
  const candidate = (forwardedFor?.split(",")[0] ?? realIp ?? "").trim();

  return candidate && isConservativeIpAddress(candidate) ? candidate : undefined;
};
