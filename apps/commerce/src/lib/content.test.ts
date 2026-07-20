import { describe, expect, it } from "vitest";
import { getSafeCmsHref, isExternalHref, isValidInternalPath } from "./content";

describe("getSafeCmsHref", () => {
  it.each([
    ["/", "/"],
    ["/store", "/store"],
    ["/store/collections/frontpage?sort=best#featured", "/store/collections/frontpage?sort=best#featured"],
    ["https://example.com", "https://example.com/"],
    ["https://example.com/path?q=1#top", "https://example.com/path?q=1#top"],
  ])("accepts %s", (input, expected) => {
    expect(getSafeCmsHref(input)).toBe(expected);
  });

  it.each([
    "",
    "   ",
    "http://example.com",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<h1>x</h1>",
    "vbscript:msgbox(1)",
    "//example.com/path",
    "ftp://example.com/file",
    "/store\\collections",
    "/store://bad",
    "https://exa mple.com",
    null,
    undefined,
  ])("rejects unsafe value %s", (input) => {
    expect(getSafeCmsHref(input)).toBeNull();
  });

  it("keeps external classification separate from validation", () => {
    expect(isExternalHref("https://example.com/")).toBe(true);
    expect(isExternalHref("/store")).toBe(false);
    expect(isValidInternalPath("/store?view=all#top")).toBe(true);
    expect(isValidInternalPath("https://example.com/")).toBe(false);
  });
});
