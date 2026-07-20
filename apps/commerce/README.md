# Cody Hart Store

Production-oriented headless commerce storefront built with Next.js App Router,
React, TypeScript, Shopify Storefront API, Sanity CMS, and CSS Modules.

## Local Development

```bash
npm --workspace @portfolio/commerce run dev
npm --workspace @portfolio/commerce run lint
npm --workspace @portfolio/commerce run test
npm --workspace @portfolio/commerce run build
```

Copy `.env.example` to `.env.local` and fill in project-specific values:

```bash
SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_STOREFRONT_API_VERSION=
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
NEXT_PUBLIC_SANITY_API_VERSION=
```

The Shopify Storefront token is server-only. The Sanity values are public
project identifiers used by the embedded Studio and published-content reads.

## Route Map

- `/` renders the CMS-managed homepage.
- `/store` renders the Shopify product index and collection navigation.
- `/store/[handle]` renders Shopify product detail pages.
- `/store/collections/[handle]` renders Shopify collection pages.
- `/cart` renders the full cart fallback page.
- `/api/cart` returns the current public cart state for the drawer.
- `/studio` renders the embedded Sanity Studio.

## Architecture Notes

- Storefront data fetching stays in Server Components and server-only helpers.
- Interactive islands are limited to product variant selection, cart drawer,
  cart line controls, mobile navigation, contextual back navigation, and the
  homepage carousel.
- Shopify remains the source of truth for product data, variants, prices,
  availability, cart state, and checkout URLs.
- Sanity manages editorial homepage sections, navigation, announcement content,
  footer content, and header logo settings.
- Cart persistence uses an HTTP-only Shopify cart ID cookie. The browser only
  receives the public cart shape needed for UI rendering.
- Published Sanity content uses fresh reads in development and approximately
  60-second revalidation in production.

## Styling

The storefront uses CSS Modules for component and route-owned styles. Remaining
global CSS is reserved for design tokens, base resets, legacy homepage section
classes, shared route states, cart-page styles, and global error/loading states.

## Testing

The initial test foundation uses Vitest for unit and focused component tests,
React Testing Library for DOM interaction tests, and Playwright for browser smoke
tests.

```bash
npm --workspace @portfolio/commerce run test
npm --workspace @portfolio/commerce run test:watch
npm --workspace @portfolio/commerce run test:coverage
npm --workspace @portfolio/commerce run test:e2e
```

Install Playwright browsers before the first E2E run in a fresh environment:

```bash
npm --workspace @portfolio/commerce exec playwright install chromium
```

Unit coverage currently focuses on:

- Shopify variant matching helpers
- CMS URL validation
- cart cookie value parsing and validation
- Shopify retry-policy and request retry behavior
- CMS/Shopify homepage section composition
- carousel drag-versus-click gesture helpers
- ProductDetails option/variant behavior
- cart line control wiring

Playwright smoke tests expect the normal commerce environment variables listed
above. Product-navigation smoke coverage uses the current Shopify development
catalog and skips that specific test when no seeded product link exists. The E2E
suite should not mutate catalog data; cart mutation coverage can be expanded once
a deterministic test product is documented.

## Deployment

Deploy as a standard Next.js app on Vercel with the environment variables above.
No Sanity write token is required for the current public-dataset Studio setup.
