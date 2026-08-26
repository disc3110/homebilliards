# Storefront URL and Content Decision Log

Status values: `LOCKED`, `PROPOSED`, `OPEN`, `DEFERRED`

## Locked directions

| ID | Status | Decision | Source |
| --- | --- | --- | --- |
| D-001 | LOCKED | Jordan's directory defines the intended public taxonomy and navigation hierarchy. | Jorge approval, 2026-08-26 |
| D-002 | LOCKED | The Content Template Specification controls generated product and category content. | Jorge approval, 2026-08-26 |
| D-003 | LOCKED | BigCommerce remains the source for products, images, prices, inventory, options, cart, checkout, and orders. | Project direction |
| D-004 | LOCKED | The demo is the visual and interaction reference, not the production application. | Project direction |
| D-005 | LOCKED | Existing SKUs are preserved. The new SKU convention applies only to new products. | Content Template Specification, Section 7 |
| D-006 | LOCKED | Product variants do not appear in product title fields and are not stated as permanent facts in descriptions. | Content Template Specification, Section 6 |
| D-007 | LOCKED | FAQ content and FAQPage schema are V2, not a V1 launch requirement. | Content Template Specification, Sections 5 and 11 |
| D-008 | LOCKED | C2 size/attribute pages and C3 brand-in-category pages require individual SEO approval; filters never create indexable pages automatically. | Content Template Specification, Section 10 |

## Proposed technical conventions

| ID | Status | Proposal | Reason |
| --- | --- | --- | --- |
| D-009 | PROPOSED | Canonical paths use lowercase kebab-case and no trailing slash, except `/`. | Stable Next.js convention and simpler redirect validation |
| D-010 | LOCKED | Product URLs live below the most specific approved PLP: `{category-path}/{product-slug}`. | Approved by Jorge, 2026-08-26 |
| D-011 | PROPOSED | Product identity uses the BigCommerce product ID; SKU remains a commercial attribute. | Many current parent products do not have a SKU |
| D-012 | LOCKED | Display label `On Sale` keeps canonical path `/sale` to preserve the existing short URL. | Approved by Jorge, 2026-08-26 |
| D-013 | LOCKED | Display label `Dart-boards` is normalized to `Dartboards` and path `/darts/dartboards`. | Approved by Jorge, 2026-08-26 |
| D-014 | LOCKED | `BBQ & Cooking` uses `/bbq-cooking` as its canonical hub. | Approved by Jorge, 2026-08-26 |
| D-015 | LOCKED | `Table Games` uses `/table-games`; current `/games/` routes redirect to it. | Approved by Jorge, 2026-08-26 |
| D-016 | PROPOSED | `Shuffleboard` becomes a top-level hub at `/shuffleboard`. | Jordan separates it from Table Games |
| D-017 | LOCKED | The global brand index is `/brands`; only brands with published products appear, and brand-in-category routes use `{category-path}/{brand-slug}` only after SEO approval. | Approved by Jorge, 2026-08-26 |
| D-018 | PROPOSED | Resources uses `/resources`, with Articles at `/resources/articles`. | Direct translation of Jordan's footer directory |
| D-019 | LOCKED | One leaf resolver handles product, approved C2, and approved C3 slugs below a category, with a mandatory category-plus-slug collision check. | Option A approved by Jorge, 2026-08-26 |

## Approval questions for Gate 1

| ID | Owner | Question | Recommended answer | Status |
| --- | --- | --- | --- | --- |
| Q-001 | Jorge / Jordan | Approve `/bbq-cooking` instead of retaining `/bbq`? | Approved `/bbq-cooking`; redirect both `/bbq/` and `/grill/*`. | APPROVED 2026-08-26 |
| Q-002 | Jorge / Jordan | Approve `/table-games` instead of retaining `/games`? | Approved `/table-games`; redirect current `/games/*`. | APPROVED 2026-08-26 |
| Q-003 | Jorge / Jordan | Should the display label remain `Dart-boards`, or normalize to `Dartboards`? | Approved `Dartboards` and `/darts/dartboards`. | APPROVED 2026-08-26 |
| Q-004 | Jorge / Jordan | Approve `/sale` for the `On Sale` collection? | Approved `/sale` with display label `On Sale`. | APPROVED 2026-08-26 |
| Q-005 | Jorge / Jordan | Approve the nested PDP pattern `{category-path}/{product-slug}`? | Approved; no generic `/products/` canonical route. | APPROVED 2026-08-26 |
| Q-006 | Jorge / Jordan | Should `/brands` be indexable at V1 launch? | Approved `/brands`; show only brands with published products and approve C3 pages individually. | APPROVED 2026-08-26 |
| Q-007 | Jorge / Jordan | Is Resources / Articles required with real content at V1 launch? | Ship the route only when at least one approved article exists; otherwise omit it from the public footer until ready. | OPEN |
| Q-008 | Shawn / Jorge | What should happen to current Services category URLs, which are absent from Jordan's directory? | Redirect relevant service URLs to a future service/contact route after Shawn confirms the service structure. | OPEN |
| Q-009 | Jorge / Jordan | How should empty Jordan categories behave at launch? | Keep them out of nav and sitemap until products exist; return 404 rather than an indexable empty PLP. | OPEN |
| Q-010 | Shawn / Jorge | Which real BigCommerce product is the production Austin builder target? | Confirm the live parent product or create a catalog-cleanup task before builder integration. | OPEN |
| Q-011 | Jorge / Jordan | Approve one category-leaf slug resolver for PDP, C2, and C3 pages? | Option A approved with a unique category-plus-slug registry and collision validation. | APPROVED 2026-08-26 |

## Blocking order

- Q-001 through Q-006 and Q-011 were approved by Jorge on 2026-08-26.
- Q-006 through Q-009 may remain open during visual-system work but must close before the affected routes are published.
- Q-010 must close before live Austin builder integration; it does not block the shared frontend shell.

## Gate 1 approval record

- Approval status: `PENDING`
- Approved by:
- Approval date:
- Notes:
