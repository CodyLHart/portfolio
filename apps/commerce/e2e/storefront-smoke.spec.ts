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

test("external carousel arrow navigation loops without exposing the clone reset", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const carousel = page.locator("[data-carousel]").first();

  test.skip(
    (await carousel.count()) === 0,
    "No external carousel content is available in this environment.",
  );

  const viewport = carousel.locator("[data-carousel-viewport]");
  const nextButton = carousel.getByRole("button", { name: "Next item" });
  const realItems = carousel.locator('[data-carousel-item][data-carousel-clone="false"]');
  const realCount = await realItems.count();

  test.skip(realCount < 4, "Carousel needs at least four items to test looping.");

  const realKeys = await realItems.evaluateAll((items) =>
    items.map((item) => {
      const link = item.querySelector("a");

      return `${link?.getAttribute("href") ?? ""}|${link?.textContent?.trim() ?? ""}`;
    }),
  );
  const uniqueRealKeys = new Set(realKeys);

  test.skip(
    uniqueRealKeys.size !== realKeys.length,
    "Carousel item labels are not unique enough to verify logical order.",
  );

  const getVisibleKeys = async () =>
    viewport.evaluate((element) => {
      const viewportRect = element.getBoundingClientRect();
      const items = Array.from(
        element.querySelectorAll<HTMLElement>("[data-carousel-item]"),
      );

      return items
        .map((item) => {
          const rect = item.getBoundingClientRect();
          const visibleWidth =
            Math.min(rect.right, viewportRect.right) -
            Math.max(rect.left, viewportRect.left);
          const link = item.querySelector("a");

          return {
            left: rect.left,
            key: `${link?.getAttribute("href") ?? ""}|${link?.textContent?.trim() ?? ""}`,
            visibleWidth,
          };
        })
        .filter((item) => item.visibleWidth > 2)
        .sort((a, b) => a.left - b.left)
        .map((item) => item.key);
    });

  const waitForCarouselSettle = async () => {
    await viewport.evaluate(
      (element, epsilon) =>
        new Promise<void>((resolve) => {
          let lastScrollLeft = element.scrollLeft;
          let stableFrames = 0;

          const check = () => {
            const nextScrollLeft = element.scrollLeft;

            if (Math.abs(nextScrollLeft - lastScrollLeft) <= epsilon) {
              stableFrames += 1;
            } else {
              stableFrames = 0;
              lastScrollLeft = nextScrollLeft;
            }

            if (stableFrames >= 4) {
              resolve();
              return;
            }

            requestAnimationFrame(check);
          };

          requestAnimationFrame(check);
        }),
      0.5,
    );
  };

  const initialVisibleKeys = await getVisibleKeys();
  const visibleCount = Math.min(initialVisibleKeys.length, realCount);
  const firstInitialIndex = realKeys.indexOf(initialVisibleKeys[0]);

  test.skip(
    visibleCount < 3 || firstInitialIndex < 0,
    "Carousel viewport does not show enough identifiable items.",
  );

  for (let clickIndex = 1; clickIndex <= realCount + 2; clickIndex += 1) {
    await nextButton.click();
    await waitForCarouselSettle();

    const visibleKeys = await getVisibleKeys();
    const expectedFirstKey =
      realKeys[(firstInitialIndex + clickIndex) % realCount];
    const expectedVisibleKeys = Array.from({ length: visibleCount }, (_, index) =>
      realKeys[(firstInitialIndex + clickIndex + index) % realCount],
    );

    expect(visibleKeys[0]).toBe(expectedFirstKey);
    expect(visibleKeys.slice(0, visibleCount)).toEqual(expectedVisibleKeys);
  }
});
