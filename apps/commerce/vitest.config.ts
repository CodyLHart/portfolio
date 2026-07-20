import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        ".next/**",
        "e2e/**",
        "next-env.d.ts",
        "next.config.ts",
        "playwright.config.ts",
        "sanity.config.ts",
        "sanity.cli.ts",
        "src/app/**",
        "src/sanity/schemaTypes/**",
        "src/test/**",
        "vitest.config.ts",
      ],
      include: [
        "src/components/cart/CartLineControls.tsx",
        "src/components/home/carousel-gesture.ts",
        "src/components/product/ProductDetails.tsx",
        "src/lib/content.ts",
        "src/lib/homepage.ts",
        "src/lib/shopify/cart-cookie-value.ts",
        "src/lib/shopify/client.ts",
        "src/lib/shopify/retry-policy.ts",
        "src/lib/shopify/variants.ts",
      ],
      reporter: ["text", "html"],
    },
    environment: "jsdom",
    exclude: [
      "**/.next/**",
      "**/e2e/**",
      "**/node_modules/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
