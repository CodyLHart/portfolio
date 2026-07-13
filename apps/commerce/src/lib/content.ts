export const isValidInternalPath = (path: string | null | undefined) =>
  Boolean(
    path &&
      path.startsWith("/") &&
      !path.startsWith("//") &&
      !path.includes("://"),
  );

export const splitTextParagraphs = (text: string) =>
  text
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
