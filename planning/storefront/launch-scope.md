# Storefront Route Rollout Scope

## Pilot vertical slice

The pilot proves the architecture and visual direction without waiting for the full catalog cleanup.

Public surfaces:

- `/`
- `/billiards`
- `/billiards/pool-tables`
- `/billiards/pool-tables/{product-slug}`
- `/billiards/chalk-chalk-holders/{product-slug}` or another approved simple accessory PDP
- `/search`
- `/cart`
- `/contact`

Journeys:

1. Browse a real Pool Tables PLP.
2. Open an install-required pool table PDP.
3. Open a configurable or quote-only pool table PDP.
4. Add a standard accessory to cart.
5. Start a quote or installation inquiry.
6. Continue to BigCommerce hosted checkout for an eligible product.

Exit criteria:

- Shawn approves the shared shell, home page direction, product card, PLP, standard PDP, and pool-table PDP.
- Real BigCommerce images and product data render through the canonical contract.
- Product-parent pages continue working if child variants are removed or changed.
- Cart and quote requests are validated server-side.

## V1 route families

All Jordan directory routes are registered in V1, but a route becomes public only when it passes the publishing gate.

- Billiards
- Ping Pong
- BBQ & Cooking
- Foosball
- Darts
- Table Games
- Shuffleboard
- Furniture
- Commercial
- On Sale
- New Arrivals
- Made in Canada
- Brands index and brand detail discovery
- Resources / Articles when approved content exists

Publishing gate for a PLP:

- Approved canonical path and redirect coverage.
- At least one publishable product; minimum count may be raised by SEO review.
- Unique title/H1 and categoryDescription.
- Correct parent, breadcrumbs, navigation placement, and canonical URL.
- Product cards have real images, CTA, price mode, and availability behavior.
- Indexability explicitly approved.

Publishing gate for a PDP:

- Stable BigCommerce parent product ID and slug.
- Primary category and canonical route.
- Product type and CTA.
- Primary image meeting the accepted quality floor.
- Product title, shortDescription, longDescription, and highlights grounded in approved source data.
- Price mode and fulfillment behavior.
- Options classified as variant, modifier, linked add-on, or quote selection.

## V1 content

- Product title fields.
- shortDescription.
- longDescription.
- productHighlights.
- Product and category image filename/alt-text workflow.
- Category C1 title/H1 and categoryDescription.
- Manual override support.
- QA sampling, with 100% review of install-required pool tables.

## V2 or individually approved

- FAQ content and FAQPage JSON-LD.
- C2 size/attribute landing pages.
- C3 brand-in-category landing pages.
- Customer accounts and wishlists.
- Reviews.
- Advanced search personalization.
- Large-scale editorial resource library.
- Advanced renderer coverage beyond the first approved pool-table builder.
