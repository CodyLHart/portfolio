import { expect, test } from "@playwright/test";

const isIgnorableConsoleError = (message: string) =>
  message.includes("/_next/webpack-hmr") &&
  message.includes("WebSocket connection");

test("homepage loads without client console errors", async ({ page }) => {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error" && !isIgnorableConsoleError(message.text())) {
      errors.push(message.text());
    }
  });

  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  expect(errors).toEqual([]);
});

test("store can navigate to a product detail page when seeded products exist", async ({
  page,
}) => {
  await page.goto("/store");

  const productLink = page
    .locator('main a[href^="/store/"]:not([href^="/store/collections/"])')
    .first();
  const href = await productLink.getAttribute("href");

  test.skip(!href, "No seeded Shopify products are available in this environment.");

  await productLink.click();

  await expect(page).toHaveURL(/\/store\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /add to cart|sold out/i })).toBeVisible();
});

test("mobile header exposes hamburger and cart controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const openMenuButton = page.getByRole("button", { name: /open menu/i });
  const menuButton = page.locator("button[aria-controls]").first();

  await expect(openMenuButton).toBeVisible();
  await expect(page.getByRole("button", { name: /^cart/i })).toBeVisible();

  await expect
    .poll(async () => {
      if ((await menuButton.getAttribute("aria-expanded")) === "true") {
        return "true";
      }

      await menuButton.click();

      return menuButton.getAttribute("aria-expanded");
    })
    .toBe("true");
  await expect(page.getByRole("navigation", { name: /mobile navigation/i })).toBeVisible();
});
