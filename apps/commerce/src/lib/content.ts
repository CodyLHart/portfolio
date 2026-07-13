const hasControlCharacters = (value: string) =>
  /[\u0000-\u001F\u007F]/.test(value);

export const getSafeCmsHref = (href: unknown) => {
  if (typeof href !== "string") {
    return null;
  }

  const value = href.trim();

  if (!value || hasControlCharacters(value)) {
    return null;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value.includes("://") ? null : value;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};

export const isExternalHref = (href: string) => href.startsWith("https://");

export const isValidInternalPath = (path: string | null | undefined) => {
  const href = getSafeCmsHref(path);

  return Boolean(href && !isExternalHref(href));
};

export const splitTextParagraphs = (text: string) =>
  text
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
