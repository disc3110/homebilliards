# Home Billiards - Feedonomics / Google Merchant Center Specification

**Owner:** Jordan (SEO) + implementation team  
**Maintainer:** Diego Solis-Cuevas  
**Status:** Planning contract - Feedonomics/GMC launch details pending

> This document defines how product data should reach Feedonomics and Google Merchant Center (GMC). It complements [DOCUMENTATION.md](DOCUMENTATION.md) and [SEO_SPEC.md](SEO_SPEC.md). The core rule is simple: feed data, PDP-visible data, Product JSON-LD, Algolia records, and checkout/cart data must agree.

---

## 1. Scope

The product feed supports:

- Google Merchant Center free product listings.
- Google Shopping ads if campaigns are enabled.
- Future local inventory listings for the Vancouver showroom.

This spec does not replace the canonical product schema. It describes the feed projection of that schema.

---

## 2. Source Model

### Recommended MVP architecture

Use a **hybrid Feedonomics model**:

1. Feedonomics reads BigCommerce directly for checkout-sensitive commerce data: IDs, SKUs, names, prices, sale prices, availability, variants, images, brands, and product URLs when reliable.
2. Feedonomics also reads a NestJS enrichment/override export keyed by stable SKU/product/variant IDs.
3. Feedonomics merges the two sources and applies final feed transformations for GMC.

### Why hybrid

| Option | Pros | Risk |
| ------ | ---- | ---- |
| BigCommerce only | Closest to checkout price, inventory, carts, and orders | Misses BFF overrides, canonical URLs, feed-title overrides, structured specs, and custom labels |
| NestJS export only | One canonical feed projection | Requires the BFF/export pipeline to be production-grade for the whole catalog before feed launch |
| Hybrid | Keeps commerce truth close to BigCommerce while exposing canonical overrides | Requires stable join keys and feed QA |

### Systems of record

| Data | Source of record |
| ---- | ---------------- |
| Product ID, SKU, variant ID, price, sale price, checkout availability | BigCommerce |
| CTA, fulfillment messaging, quote-required state, canonical URL, product type | NestJS |
| Manual SEO/feed/content overrides | PostgreSQL via NestJS |
| Feed formatting, taxonomy mapping, promotion linkage, GMC delivery | Feedonomics |

Do not create one-off feed-only edits in Feedonomics for fields that should be maintained in BigCommerce or the BFF override layer.

---

## 3. Required Feed Attributes

Products sent to GMC must include these fields. Missing or mismatched values can disapprove products or break free listings.

| Feed attribute | Canonical/source field | Notes |
| -------------- | ---------------------- | ----- |
| `id` | `sku` or stable variant SKU | Must be stable. Changing it resets product feed history. |
| `title` | `feedTitle` | Clean product title, max 150 chars. Not the same as `searchTitle`. |
| `description` | `feedDescription` or factual `shortDescription`/trimmed `longDescription` | Product facts only. No shipping claims, promo copy, store name, or competitor mentions. |
| `link` | `canonicalUrl` | Must resolve on `homebilliards.ca`; redirects must be ready at launch. |
| `image_link` | primary `images[]` / `imageLink` | Crawlable, high-quality, no watermarks or promo overlays. |
| `availability` | `merchantAvailability` | GMC values such as `in_stock`, `out_of_stock`, `preorder`, `backorder`; must match PDP and checkout. |
| `price` | `price` + `currency` | CAD, tax-excluded for Canada, must match PDP and checkout. |
| `brand` | `brand` | Required for almost all Home Billiards products. Do not use "Generic" or "N/A". |
| `condition` | `condition` | Use `new` unless an item is truly used/refurbished. |
| `mpn` | `mpn` | Required when no manufacturer GTIN exists and manufacturer assigned an MPN. Never fabricate. |
| `item_group_id` | `itemGroupId` | Required for variant products. Website URL strategy and feed variant grouping are independent decisions. |

---

## 4. Recommended Feed Attributes

These are not always required for approval, but they should be designed into the schema during MVP.

| Feed attribute | Canonical/source field | Recommendation |
| -------------- | ---------------------- | -------------- |
| `gtin` | `gtin` | Highest-value identifier. Source from suppliers/manufacturers only. |
| `google_product_category` | `feed.googleProductCategory` | Rule-map in Feedonomics from the canonical category tree. |
| `product_type` | `feed.productType` / `categoryPath` | Use Home Billiards category path for reporting and bidding structure. |
| `additional_image_link` | gallery images | Use PDP gallery images for high-consideration products. |
| `identifier_exists` | `identifierExists` | Set to `no` only for genuinely identifier-less products. |
| `sale_price` | `salePrice` | Automatic from BigCommerce sale pricing. Pairs with `/sale`. |
| `product_highlight` | `productHighlights[]` | Short factual bullets; useful for shopping surfaces and AI extraction. |
| `product_detail` | `specifications[]` | Structured key-value specs such as slate thickness, fuel type, material, dimensions. |
| `shipping` | shipping settings/labels | Prefer account-level GMC settings; override oversized items only when policy requires it. |
| `return_policy_label` | feed override/config | Points to a GMC account-level return policy. |

---

## 5. Situational / Future Feed Attributes

| Feed attribute | Use when |
| -------------- | -------- |
| `product_length`, `product_width`, `product_height`, `product_weight` | Tables, grills, cabinets, shuffleboards, furniture, or any product where size/weight affects buyer decisions or shipping. |
| `video_link` | A good product video already exists, such as a Traeger demo or table finish showcase. |
| `custom_label_0` - `custom_label_4` | Ads reporting/bidding labels such as `made_in_canada`, `quote_required`, `clearance`, `high_margin`, or `large_item`. |
| `promotion_id` | Merchant promotions are active in Canada. |
| `cost_of_goods_sold` | Gross margin reporting is approved. |
| Apparel-oriented attributes | Usually skip. Use `color` or `material` only when they are real variant differentiators; otherwise prefer `product_detail`. |

---

## 6. Variant Rules

- Website variant URLs are pending Jordan's decision.
- Feed variant grouping is required independently of URL strategy.
- Variants that represent meaningful sellable differences should share one `item_group_id`.
- Size, finish, colour, material, and other distinguishing attributes should be represented in the feed row when applicable.
- Cloth and cosmetic options can still be modifiers on the website while being represented as feed variant/product detail data when the feed requires it.

---

## 7. Category And Attribute Map

The Shawn/Jordan URL/product schema map defines the working category groups and key product attributes.

| Group | Categories |
| ----- | ---------- |
| Billiards | Pool Tables; Pool Cues; Pool Cue Cases; Pool Table Felt; Pool Cue Racks, Holders & Storage; Pool Balls; Pool Table Covers; Billiard Accessories |
| Ping Pong | Ping Pong Tables; Ping Pong Paddles; Ping Pong Robots; Ping Pong Table Covers; Ping Pong Accessories |
| BBQ & Cooking | Traeger Smokers; Pizza Ovens; Sauces & Spices; Wood Pellets; Grill & BBQ Accessories |
| Foosball | Foosball Tables; Foosball Accessories |
| Darts | Dartboards; Darts; Dart Board Cabinets; Dart Flights; Dart Shafts; Dart Accessories |
| Air Hockey | Air Hockey Tables; Air Hockey Accessories |
| Other Games | Board Games; Cards; Dice; Poker Tables; Poker Chips; Poker Accessories; Shuffleboard Tables; Shuffleboard Accessories; Sports; Misc. Games |
| Furniture | Game Room Furniture |

These categories should drive:

- canonical category paths.
- PLP filters.
- Algolia facets.
- Feedonomics `product_type`.
- Feedonomics `google_product_category` mapping rules.
- internal linking and sitemap planning.

---

## 8. Local Inventory

Local inventory is a fast-follow, not an MVP blocker.

Prerequisites:

- Google Business Profile for the Vancouver showroom.
- Merchant Center linked to the Business Profile.
- Confirmed case-sensitive `store_code`.
- Reliable showroom stock/on-display data.

Local inventory feed fields:

| Attribute | Requirement | Notes |
| --------- | ----------- | ----- |
| `store_code` | Required | Business Profile Store ID. |
| `id` | Required | Must match the main feed product `id`. |
| `availability` | Required | Local values include `in_stock`, `limited_availability`, `on_display_to_order`, `out_of_stock`. |
| `price` | Situational | Needed if in-store price differs or if GMC feature requires it. |
| `quantity` | Optional | Use only if reliable. |
| `pickup_method` / `pickup_sla` | Optional | More relevant for small products than pool tables. |

---

## 9. QA Checklist

Before feed launch or major feed changes:

- Required feed fields are present for every included product.
- Product `id` values are stable and match local inventory IDs where applicable.
- `link` URLs resolve to the correct canonical PDP.
- Old-to-new URL redirects are ready for launch.
- `image_link` URLs are crawlable and not blocked.
- Price, sale price, and currency match PDP and checkout.
- Availability matches PDP, JSON-LD, and checkout behavior.
- Variants are grouped with `item_group_id`.
- GTIN/MPN values are real and never fabricated.
- Manual overrides from PostgreSQL/NestJS are visible to Feedonomics.
- Products excluded from feed have a documented reason.

---

## 10. Open Decisions

Open decisions live in [DECISIONS.md](DECISIONS.md):

- F1 - Feedonomics + GMC launch scope.
- F2 - Feedonomics data source.
- F3 - GTIN/MPN sourcing.
- F4 - Reviews at launch or schema-ready only.
- F5 - Local inventory feed timing.
- S1 - Shipping policy.
- S2 - Sale/promotion model.
- J3 - Product variant URL strategy.
- J4 - Redirect map.
