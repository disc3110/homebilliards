# Storefront Step 2 — Canonical Contracts and Fixtures

Status: `IMPLEMENTED_FOR_REVIEW`

Owner of final behavior approvals: Jorge

Implementation scope: shared contracts and preview data only

## Outcome

The storefront now has a vendor-neutral contract for navigation, product cards, product details, option behavior, publishing gates, and catalog adapter boundaries. BigCommerce remains the commerce source, but no BigCommerce response shape is allowed past the backend adapter.

The code lives in `packages/contracts/src/storefront/`. Preview data lives in `packages/contracts/src/fixtures/storefront.ts`.

## Contract flow

```text
BigCommerce response
        |
        v
Backend adapter and business rules
        |
        v
Canonical contract (validated with Zod)
        |
        +--> Storefront product card / PDP
        +--> Search and feed projections later
```

The backend must return price, availability, and CTA as separate explicit states. The frontend displays those values and does not derive one from another.

The V1 content contract includes `name`, `searchTitle`, `feedTitle`, `shortDescription`, `longDescriptionHtml`, `highlights`, SKU, image filename and alt text, specifications, and C1/C2/C3 category title and description fields. FAQ remains V2 as previously approved.

## Product behavior contracts

### Price mode

| Value            | Meaning                                                                             |
| ---------------- | ----------------------------------------------------------------------------------- |
| `DISPLAY_PRICE`  | A verified numeric price can be shown.                                              |
| `REQUEST_QUOTE`  | Do not expose a numeric price; start a quote request.                               |
| `CALL_FOR_PRICE` | Do not expose a numeric price; provide the approved phone action.                   |
| `IN_STORE_ONLY`  | Purchasing is limited to the showroom; a verified price may be present if approved. |
| `UNAVAILABLE`    | No purchasable price or quote action is available.                                  |

### Availability

The canonical availability values are `IN_STOCK`, `LOW_STOCK`, `SUPPLIER_AVAILABLE`, `SPECIAL_ORDER`, `CUSTOM_ORDER`, `QUOTE_REQUIRED`, `OUT_OF_STOCK`, `DISCONTINUED`, and `UNKNOWN`. Each response also carries the customer-facing label, supporting detail, and a `purchasable` boolean.

### CTA

CTA values are `ADD_TO_CART`, `NOTIFY_ME`, `CHECK_DELIVERY`, `CHECK_INSTALLATION`, `REQUEST_QUOTE`, `CALL_STORE`, `VISIT_SHOWROOM`, `REQUEST_SERVICE_QUOTE`, and `UNAVAILABLE`. The backend also supplies the label, action mechanism, target, and disabled state.

### Option classification

| Type              | Use                                                                               |
| ----------------- | --------------------------------------------------------------------------------- |
| `VARIANT`         | Selects a BigCommerce variant and may change SKU, price, or inventory.            |
| `MODIFIER`        | Changes the configured product without selecting a distinct inventory variant.    |
| `ADD_ON`          | Adds an optional linked item or service.                                          |
| `QUOTE_SELECTION` | Captures a customer choice for staff review; it is not sent to cart as a variant. |
| `INFORMATIONAL`   | Displays planning information and is never a required selection.                  |

Selected option values stay in structured option and specification fields. They never change the permanent `name`, `searchTitle`, or `feedTitle`.

## Publishing gate

Stages are `DRAFT`, `IN_REVIEW`, `READY`, `PUBLISHED`, `PAUSED`, and `RETIRED`.

Every product is checked for catalog identity, routing, content, media, commerce, options, SEO, and business review. `READY` and `PUBLISHED` are valid only when every gate is approved or not required and there are no blockers.

Install-required pool tables still require 100% manual review. Passing the schema is structural validation, not permission to publish.

## Preview fixtures

| Archetype            | Preview candidate                  | What it exercises                                         |
| -------------------- | ---------------------------------- | --------------------------------------------------------- |
| Simple accessory     | Traeger Cherry Hardwood Pellets    | Direct Add to Cart                                        |
| Specification SKU    | Harrows Voodoo Brass Dart          | Technical specifications and a variant                    |
| Furniture / delivery | Whistler Indoor Table Tennis Table | Visible price plus delivery review                        |
| Install required     | Olhausen Canadiana Pool Table      | Guided installation path                                  |
| Quote only           | Olhausen Custom Augusta Pool Table | Hidden price and Request Quote                            |
| Configurable parent  | Legacy Austin Pool Table           | Variant, modifier, add-on, quote, and information options |

All six fixtures use `source: FIXTURE`, remain in `DRAFT`, contain explicit blockers, and use representative values. They must not be published or treated as verified BigCommerce data.

The navigation fixture contains Jordan's full directory for frontend preview work. Resources and Articles remain hidden while decision Q-007 is open.

## Adapter boundary

`StorefrontCatalogAdapter` defines four backend operations:

1. Read canonical navigation.
2. List canonical product cards for a category.
3. Resolve the shared category leaf by `categoryPath + slug`.
4. Read a canonical product detail by its path.

The category leaf registry rejects duplicate `categoryPath + slug` keys, enforcing the approved shared resolver for products, C2 pages, and C3 pages.

## Review gate for Jorge

The useful review is the behavior represented by the six fixture rows above:

- Is the price treatment correct for each buying journey?
- Is the primary CTA correct?
- Does each Austin option belong to the correct option class?
- Are the availability labels understandable to a customer?
- Are the eight publishing checks sufficient for Jorge's control process?

Exact prices, inventory, copy, SKUs, and option values are not being proposed for production in this step.

## Validation

Run:

```bash
npm run validate:storefront-contracts
```

This runs lint, TypeScript checking, contract compilation, and runtime tests. It does not connect to or write to BigCommerce.
