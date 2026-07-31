# Home Billiards Website — Project Documentation

**Version:** 1.1 · July 2026
**Maintainer:** Diego Solis-Cuevas  
**Status:** Active — reflects all decisions made to date

> This is the single reference for building the new Home Billiards website. It consolidates the Foundation documents (Parts 1–6), the demo handoff, and all resolved decisions. Anything marked **[Pending: owner]** is not yet decided — see [DECISIONS.md](DECISIONS.md) for details.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Product Model](#4-product-model)
5. [Data Contract](#5-data-contract)
6. [API Reference](#6-api-reference)
7. [Site Structure](#7-site-structure)
8. [Page Specifications](#8-page-specifications)
9. [Quote Workflow](#9-quote-workflow)
10. [Search](#10-search)
11. [SEO](#11-seo)
12. [Analytics](#12-analytics)
13. [Design](#13-design)
14. [Security](#14-security)
15. [Performance](#15-performance)
16. [Deployment](#16-deployment)
17. [Quality Assurance](#17-quality-assurance)
18. [Roadmap](#18-roadmap)
19. [Glossary](#19-glossary)
20. [Related Documents](#20-related-documents)

---

## 1. Overview

### The business

Home Billiards has served customers throughout British Columbia since 1987, specializing in premium game room products: pool tables, cue sports, ping pong, foosball, shuffleboard, air hockey, darts, outdoor grills (Traeger), and accessories.

The catalog contains roughly **10,000 products** from multiple manufacturers. Pool tables are a single category but generate most of the business value — and they require a fundamentally different purchase experience (delivery planning, installation, consultation) than a standard ecommerce product.

### The project

Replace the current BigCommerce storefront at **homebilliards.ca** with a modern, custom-built website that:

- Presents each product according to its **purchase behavior** — a $20 piece of chalk checks out instantly; a $15,000 pool table starts a guided installation conversation.
- Consumes product data through a **canonical schema**, so the frontend never depends on any vendor's or platform's data shape.
- Feels **modern, premium, warm, and clean** — the approved visual direction lives in the static demo (`DEMO/HBSWebv2/`).

### Core principles

1. **One product type, one behavior.** Every product belongs to exactly one Product Type, which determines its CTA, journey, and page behavior.
2. **Business rules live in the backend.** The frontend renders state; it never derives business logic.
3. **Canonical data only.** The frontend consumes one standardized product shape regardless of where the data comes from.
4. **Progressive complexity.** Simple products stay simple to buy. Complexity appears only when the product requires it.

### Phase 0 decisions

| Decision | Confirmed direction |
| -------- | ------------------- |
| Repository | One monorepo containing the storefront, admin panel, backend, and shared packages |
| Storefront hosting | Vercel |
| Admin hosting | Separate Vercel project from the same monorepo |
| Backend and database hosting | Railway |
| Demo status | Visual and UX reference only; it is not the production codebase |
| Git workflow | `feature/*` -> `dev` -> `main`; no routine development directly on `main` |

### Key contacts & facts

|                    |                                             |
| ------------------ | ------------------------------------------- |
| Domain             | `homebilliards.ca`                          |
| Phone              | (604) 321-5553                              |
| Email              | info@homebilliards.ca                       |
| Showroom           | 1644 SE Marine Drive, Vancouver, BC V5P 2R6 |
| Hours              | Mon–Fri 9:00–17:00 · Sat 10:00–16:00        |
| Business decisions | Shawn (company manager)                     |
| SEO                | Jordan                                      |

---

## 2. Tech Stack

| Layer           | Technology                               | Notes                                                          |
| --------------- | ---------------------------------------- | -------------------------------------------------------------- |
| Storefront      | **Next.js** (TypeScript)                 | Deployed on Vercel                                             |
| Admin panel     | **Next.js** (TypeScript)                 | Separate internal app deployed on Vercel                       |
| Backend (BFF)   | **NestJS** (TypeScript)                  | Deployed on Railway; the only API used by storefront and admin |
| Product catalog | **BigCommerce**                          | Existing store, already loaded with products                   |
| Database        | **PostgreSQL** (Railway)                 | Quotes + manual metadata overrides — _not_ the product catalog |
| Search          | **Algolia**                              | Indexed from BigCommerce via the NestJS app                    |
| Product feeds   | **Feedonomics → Google Merchant Center** | Shopping/free-listing feeds; transforms canonical + commerce data |
| Payments        | **Stripe** / BigCommerce hosted checkout | Existing Stripe account                                        |
| Media           | **Cloudinary**                           | Existing account                                               |
| Analytics       | **GA4 + PostHog**                        | All events through one internal `track()` helper               |
| CI/CD           | GitHub → Vercel / Railway                | Fully automated; no manual production deploys                  |

**Note on Rosetta:** Rosetta is an internal catalog-normalization tool being developed separately. It will eventually feed product data and generated descriptions into the system, but **it is out of scope for the website**. The website integrates with BigCommerce and never needs to know Rosetta exists.

---

## 3. System Architecture

### Monorepo structure

The production system lives in this repository. The demo remains in place as reference material and is not imported as a production application.

```text
/
├── apps/
│   ├── storefront/    # Customer-facing Next.js application
│   ├── admin/         # Internal Next.js administration application
│   └── backend/       # NestJS BFF and workers
├── packages/
│   ├── contracts/     # Canonical schemas, DTOs, and shared API types
│   └── config/        # Shared TypeScript, lint, and test configuration
├── DEMO/              # Read-only visual and UX reference
└── *.md               # Living planning and implementation specifications
```

The baseline workspace manager is npm workspaces with one production lockfile at the repository root. The demo keeps its existing lockfile but is excluded from the production workspace. Additional shared packages are created only after two applications have a real shared need; the storefront and admin do not share a generic UI package by default because their interaction and visual requirements differ.

```
BigCommerce ──────────┐            ┌────── Algolia
(catalog + orders)    │            │       (search)
                      ▼            ▼
              ┌─────────────────────────┐
              │   NestJS BFF (Railway)  │──── PostgreSQL
              │  · canonical mapping    │     (quotes, overrides)
              │  · business rules       │
              │  · CTA computation      │
              │  · feed/search exports  │
              └──────┬────────┬─────────┘
                     │        └────── Feedonomics ───► Google Merchant Center
                     │
                     │ REST (canonical schema only)
             ┌───────┴───────────────────┐
             ▼                           ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│ Next.js Storefront      │   │ Next.js Admin          │
│ (Vercel)                │   │ (Vercel, authenticated)│
└────────────┬────────────┘   └─────────────────────────┘
             └──────────────► Stripe / hosted checkout
```

### Responsibilities

**NestJS backend (BFF — Backend for Frontend):**

- Fetches products from BigCommerce and maps them into the canonical schema. The frontend never sees BigCommerce's raw shape.
- Computes all business rules: CTA, fulfillment messaging, quote-required state.
- Stores and processes quote submissions.
- Keeps the Algolia index in sync.
- Produces canonical feed/export data for Feedonomics when values are not safe to read directly from BigCommerce.
- Validates every request and input; rate-limits public forms.

**Next.js storefront:**

- Renders the state returned by the backend.
- Manages UI state, form validation, responsive layout, accessibility.
- Never talks directly to BigCommerce, Stripe internals, or Cloudinary admin APIs.

**Next.js admin panel:**

- Provides authenticated internal workflows through the NestJS backend; it never writes directly to PostgreSQL or BigCommerce.
- Manages the MVP operations approved in decision T1, expected to include quote handling and controlled SEO/feed/content overrides.
- Uses a work-focused internal interface rather than copying the storefront design.

### Source-of-truth model

| System | Owns | Does not own |
| ------ | ---- | ------------ |
| BigCommerce | Product IDs, SKUs, product names, brands, category assignments, prices, sale prices, inventory, variants, modifiers, purchasability, carts, checkout, orders, and catalog images | Website-specific CTA logic, quote workflow rules, canonical projection logic, Algolia ranking logic |
| NestJS BFF | Canonical product shape, product type classification, CTA computation, fulfillment messaging, quote-required state, canonical URL resolution, structured-data projection, Algolia payloads, and feed enrichment exports | Raw catalog truth, final checkout pricing, card payment handling |
| PostgreSQL | Quote/contact/service submissions, manual SEO/feed/content overrides, category copy and FAQ overrides, redirect map records if not managed elsewhere, and audit trails | Live product catalog, live price, live inventory, checkout totals |
| Feedonomics | Product-feed transformations, Google product category mapping, feed-title construction, URL remapping at cutover, feed formatting, and Google Merchant Center delivery | Original product truth, checkout truth, website business rules |

**Divergence rule:** page-visible data, JSON-LD structured data, Algolia records, Feedonomics/GMC feed rows, and checkout/cart data must be generated from the same BigCommerce + BFF override sources. Price and availability must match the PDP and checkout. Manual edits belong in BigCommerce or the BFF override layer, not as one-off edits inside downstream tools.

### Architecture rules

| Rule                             | Meaning                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Canonical schema is the contract | Shared TypeScript types define what a Product looks like; both apps depend on those types                                |
| BigCommerce is replaceable       | All BigCommerce-specific code stays behind the mapping layer; swapping the data source later must not touch the frontend |
| Backend precomputes `cta`        | The frontend renders `cta` as a button; it never maps productType/stock to an action itself                              |
| Downstream projections agree     | Storefront, structured data, Algolia, Feedonomics, GMC, and checkout must not disagree on price, availability, URL, or identity |
| Graceful degradation             | Every external dependency has a defined failure behavior (see [Performance](#15-performance))                            |

---

## 4. Product Model

### Product Types

Products are classified by **how customers buy them**, not by inventory category.

| Type              | Examples                                              | Primary CTA                  |
| ----------------- | ----------------------------------------------------- | ---------------------------- |
| Standard SKU      | Chalk, cases, balls                                   | Add to Cart                  |
| Specification SKU | Cues, shafts, darts                                   | Add to Cart                  |
| Furniture Product | Ping pong, foosball, shuffleboard, air hockey, grills | Add to Cart / Check Delivery |
| Install Required  | Pool tables                                           | Check Installation           |
| Service           | Installation, Move, Recover, DMI                      | Request Service Quote        |

- **Standard SKU** — fixed price, standard shipping, instant checkout.
- **Specification SKU** — technical specs drive the decision; filtering and comparison matter.
- **Furniture Product** — large items that may need delivery planning; installation optional.
- **Install Required** — highest-value products; delivery planning, installation scheduling, and often consultation before purchase. All pool tables use "Check Installation" in the MVP.
- **Service** — no physical inventory; starts a workflow that staff reviews and schedules. All services share one quote workflow, distinguished by a `serviceType` field.

### Commerce category map

Shawn and Jordan's July 2026 product/URL planning map defines the working category groups and the most important product attributes for each group. These category names drive URL planning, navigation, filters, product specs, Algolia facets, and Feedonomics `product_type` paths.

| Group | Product categories | Important attributes |
| ----- | ------------------ | -------------------- |
| Billiards | Pool Tables; Pool Cues; Pool Cue Cases; Pool Table Felt; Pool Cue Racks, Holders & Storage; Pool Balls; Pool Table Covers; Billiard Accessories | Price, brand, material type, style, size, features, usage, availability, cue size, cue weight, wood type, number of pieces, colour, shell type, material/texture, storage capacity, finish/material, accessory type |
| Ping Pong | Ping Pong Tables; Ping Pong Paddles; Ping Pong Robots; Ping Pong Table Covers; Ping Pong Accessories | Price, brand, colour, features, grip type |
| BBQ & Cooking | Traeger Smokers; Pizza Ovens; Sauces & Spices; Wood Pellets; Grill & BBQ Accessories | Price, brand, series, size, features, portability, fuel type, dietary options, accessory type |
| Foosball | Foosball Tables; Foosball Accessories | Price, brand, material/finish, style, usage, colour, features |
| Darts | Dartboards; Darts; Dart Board Cabinets; Dart Flights; Dart Shafts; Dart Accessories | Price, brand, features, tip type, weight, material, colour, cabinet material/finish, accessory type |
| Air Hockey | Air Hockey Tables; Air Hockey Accessories | Price, brand, material/finish, style, usage, colour, features |
| Other Games | Board Games; Cards; Dice; Poker Tables; Poker Chips; Poker Accessories; Shuffleboard Tables; Shuffleboard Accessories; Sports; Misc. Games | Price, brand, material/finish, size, colour, features, shuffleboard style, shuffleboard usage |
| Furniture | Game Room Furniture | Price, brand, setting, material/finish, colour |

**Rule:** the exact storefront navigation can group these categories for usability, but the canonical category tree must retain enough structure to power filters, category pages, internal linking, search facets, and feed taxonomy mapping.

### Fulfillment States

| State              | Customer meaning                              |
| ------------------ | --------------------------------------------- |
| In Stock           | Available in the warehouse                    |
| Supplier Available | Available from a supplier; lead time required |
| Special Order      | Ordered after purchase                        |
| Custom Order       | Built or configured after order               |
| Quote Required     | Staff confirmation needed before purchase     |

**Rule:** never display "Available" without enough context for the customer to understand how the product will be fulfilled.

### CTA Matrix

Computed by the backend, rendered by the frontend:

| Product state          | Primary CTA           |
| ---------------------- | --------------------- |
| Standard, in stock     | Add to Cart           |
| Standard, out of stock | Notify Me             |
| Furniture Product      | Check Delivery        |
| Install Required       | Check Installation    |
| Supplier Product       | Request Quote         |
| Service                | Request Service Quote |

---

## 5. Data Contract

### Canonical Product Schema

Every product exposed by the API follows this shape, regardless of source:

```json
{
  "id": "uuid",
  "sku": "HB-001",
  "bigCommerceProductId": 123,
  "bigCommerceVariantId": 456,
  "slug": "legacy-oak-8ft",
  "canonicalUrl": "https://homebilliards.ca/pool-tables/legacy-oak-8ft",
  "productType": "install_required",
  "category": "pool-tables",
  "categoryPath": ["Billiards", "Pool Tables"],
  "brand": "Legacy",
  "name": "Legacy Oak Pool Table",
  "feedTitle": "Legacy Oak 8ft Pool Table",
  "shortDescription": "…",
  "longDescription": "…",
  "productHighlights": [],
  "price": 4999,
  "salePrice": null,
  "currency": "CAD",
  "stockStatus": "IN_STOCK",
  "merchantAvailability": "in_stock",
  "fulfillmentType": "LOCAL_STOCK",
  "leadTime": null,
  "installationRequired": true,
  "quoteRequired": false,
  "cta": "CHECK_INSTALLATION",
  "identifiers": { "gtin": null, "mpn": "LEG-OAK-8", "identifierExists": true },
  "images": [{ "url": "…", "role": "hero", "alt": "…" }],
  "variants": [],
  "specifications": [],
  "seo": { "metaTitle": "…", "metaDescription": "…", "searchTitle": "…" },
  "feed": { "googleProductCategory": null, "productType": "Billiards > Pool Tables" },
  "reviews": { "reviewCount": 0, "ratingValue": null }
}
```

### Field groups

| Group | Fields | MVP status | Likely source |
| ----- | ------ | ---------- | ------------- |
| Identity | `id`, `sku`, `slug`, `canonicalUrl`, `bigCommerceProductId`, `bigCommerceVariantId` | Required | BigCommerce + NestJS mapping |
| Titles and descriptions | `name`, `feedTitle`, `searchTitle`, `shortDescription`, `longDescription`, `feedDescription`, `productHighlights` | Required: `name`, `feedTitle`, `searchTitle`, `shortDescription`, `longDescription`; optional: highlights/feed description | BigCommerce + PostgreSQL overrides |
| Pricing | `price`, `salePrice`, `compareAtPrice`, `currency`, `taxIncluded`, variant `priceAdjustment` | Required: `price`, `currency`; optional: sale/compare fields | BigCommerce |
| Availability | `stockStatus`, `merchantAvailability`, `inventoryTracked`, `quantity`, `preorder`, `backorder` | Required: `stockStatus`, `merchantAvailability`; optional: quantity/order flags | BigCommerce + NestJS mapping |
| Brand and identifiers | `brand`, `gtin`, `mpn`, `identifierExists`, `condition`, `countryOfOrigin` | Required: `brand`, `condition`; optional MVP: GTIN/MPN/country | BigCommerce custom fields/metafields + supplier data |
| Variants | `variants[]`, `itemGroupId`, `variantOptions`, `modifierOptions`, `selectedOptionLabels` | Required where products have variants/options | BigCommerce + NestJS |
| Media | `images[]`, `imageLink`, `additionalImageLinks`, `videoUrl` | Required: primary image + alt text; reserved: video | BigCommerce/Cloudinary + overrides |
| Structured specifications | `specifications[] { section, name, value }`, `roomSizeRequired`, `includedItems`, dimensions, weight, warranty | Required where applicable to PDP; optional MVP for full backfill | BigCommerce custom fields/metafields + overrides |
| Merchandising | `badges`, `madeInCanada`, `customLabels`, `newArrival`, `sale`, category-specific filter fields | Optional MVP except categories already in nav | BigCommerce + PostgreSQL overrides |
| SEO | `metaTitle`, `metaDescription`, `searchTitle`, `canonical`, `breadcrumbs`, Open Graph fields, JSON-LD projection | Required | NestJS + overrides |
| Feed data | `feedTitle`, `feedDescription`, `googleProductCategory`, `productType`, `shippingLabel`, `returnPolicyLabel`, `promotionId`, `feedExcluded` | Required only for products sent to GMC; designed in MVP | BigCommerce + NestJS export + Feedonomics rules |
| Reviews | `reviewCount`, `ratingValue`, `reviews[]`, `reviewProvider` | Reserved for later unless review system is approved for launch | Review provider or PostgreSQL |
| Fulfillment | `fulfillmentType`, `leadTime`, `installationRequired`, `quoteRequired`, `cta`, `shippingPromise` | Required except `shippingPromise` | NestJS business rules |

### Variants

Products expose zero or more variants (cloth color, size, finish, cue weight). Variants inherit the parent and expose only differing fields (`id`, `name`, `sku`, `priceAdjustment`, `isAvailable`, `selectedOptions`, and feed attributes when the variant is sent to GMC).

Variant URLs: **[Pending: Jordan — J3]**. Dev recommendation is one URL per product with variants as client-side state.

Feed variant grouping is independent from website variant URLs. A product may use one PDP URL on the website while Feedonomics submits separate variant rows grouped by `itemGroupId`.

### Publishing rules

A product must not be published without: ID, SKU, product type, category, name, feed title, price, currency, stock status, merchant availability, fulfillment type, primary image with alt text, canonical URL, and slug. Incomplete products stay unpublished.

Products sent to Google Merchant Center must also have every required feed field from [FEED_SPEC.md](FEED_SPEC.md). Feed values must match the visible PDP, JSON-LD, and checkout/cart behavior.

### Content fields

| Field | Length | Used in |
| ----- | ------ | ------- |
| `name` | Clean display name | H1, product cards, customer-facing product identity |
| `feedTitle` | Up to 150 chars | Feedonomics/GMC product title; clean product name, not SEO title |
| `shortDescription` | 1–2 sentences (~160 chars) | Product cards, meta description, search snippets, Open Graph |
| `longDescription` | 3–6 paragraphs, HTML-safe | PDP body only |
| `feedDescription` | Up to GMC limits | Product facts only for feeds; no shipping promises, promo copy, store name, or competitor mentions |
| `searchTitle` | 60–70 chars, keyword-optimized | `<title>` tag, Algolia index |
| `productHighlights` | 2-10 short factual bullets | PDP bullets, Feedonomics `product_highlight`, AI-answer extraction |

Rules: `shortDescription` is unique per product and never a truncation of `longDescription`. `searchTitle` is generated by template with manual override capability (overrides always win and survive re-syncs). `feedTitle` is separate from `searchTitle` and should not contain promo copy, keyword stuffing, or shipping claims.

Content production: existing BigCommerce product content is kept and updated. New descriptions are AI-assisted with human review; Jordan has override authority on `searchTitle` and `shortDescription`.

---

## 6. API Reference

All endpoints are served by the NestJS BFF, versioned under `/v1/`.

| Endpoint               | Method | Purpose                                           |
| ---------------------- | ------ | ------------------------------------------------- |
| `/v1/products`         | GET    | Product list (paginated, filterable)              |
| `/v1/products/{slug}`  | GET    | Product detail                                    |
| `/v1/categories`       | GET    | Category tree                                     |
| `/v1/search`           | GET    | Search with filters (proxies/complements Algolia) |
| `/v1/filters`          | GET    | Available filters for a category                  |
| `/v1/quotes`           | POST   | Submit a quote request                            |
| `/v1/checkout/session` | POST   | Create a checkout session                         |

### Design rules

- RESTful resources, semantic versioning in the path.
- Explicit DTOs for every request and response.
- Strong input validation with detailed error messages.
- One standardized error format: HTTP status + error code + message.

A full OpenAPI specification is the next documentation deliverable (see [DECISIONS.md](DECISIONS.md) roadmap #7).

---

## 7. Site Structure

### Sitemap (MVP — final)

```
/                                    Homepage
/pool-tables                         PLP
/pool-tables/[slug]                  PDP (incl. Austin builder as a PDP mode)
/ping-pong                           PLP
/ping-pong/[slug]                    PDP
/cues                                PLP
/cues/[slug]                         PDP
/darts                               PLP
/darts/[slug]                        PDP
/bbq                                 PLP (Traeger)
/bbq/[slug]                          PDP
/foosball                            PLP
/foosball/[slug]                     PDP
/air-hockey                          PLP
/air-hockey/[slug]                   PDP
/games                               PLP — board games, cards, dice, poker, shuffleboard, sports, misc. games
/games/[slug]                        PDP
/furniture                           PLP — game room furniture
/furniture/[slug]                    PDP
/services                            Services landing
/services/installation               Service page + quote form
/services/table-moving               Service page + quote form
/services/recovering                 Service page + quote form
/services/design-help                Service page + quote form
/commercial                          Simple landing + quote form
/search                              Search results
/cart                                Cart
/checkout                            → Stripe / BigCommerce hosted checkout
/contact                             Contact / showroom
/new-arrivals                        PLP (filtered view)
/sale                                PLP (filtered view)
/made-in-canada                      PLP (filtered view)
/404, /500                           Error pages
```

No blog/resources section in the MVP.

### Header / navigation

- Logo left; search and Contact Us centered above the nav.
- Nav: Billiards, Ping Pong, BBQ, Foosball, Darts, Air Hockey, Games, Furniture, Commercial, New Arrivals, Sale, Made in Canada.
- Header is shared across all pages — a change to it applies everywhere.

---

## 8. Page Specifications

Every page must let the customer answer three things fast: **What is this product? Can I buy it? What do I do next?**

### Homepage

Data-driven — merchandising content is configurable without code changes.

Sections in order: hero banner → shop departments (category cards) → featured product/builder promo → services → footer. ("Why Home Billiards" trust content and testimonials are future additions.)

| Component         | Required data                   |
| ----------------- | ------------------------------- |
| Hero              | Headline, CTA, background media |
| Category cards    | Name, image, slug               |
| Featured products | Product card data               |
| Services          | Title, description, CTA         |

### Product Listing Pages (PLP)

Required features: pagination, sorting, filters (with price slider), breadcrumbs, horizontal category strip, product cards.

**Product card** shows: primary image, name, brand, price, fulfillment badge, primary CTA. Never vendor-specific information.

**Category strip** (consistent across all categories): horizontal strip near the top, image tile with label below, black underline on the active item, "View X items" link beside the title, sort select on the right.

### Product Detail Pages (PDP)

Required sections: image gallery, product info, price, variants, specifications, fulfillment info, primary CTA, related products.

**Pool table PDPs additionally include:** cloth selection, room size guidance, installation information, delivery information, quote guidance, and a postal-code "check installation availability in your area" input that feeds the quote form.

**The Austin builder** (from the demo) is the reference implementation for configurable pool tables: mode selection (in-stock skips size/finish and starts at cloth; build-your-table shows all steps), finish swatches, cloth pills, no auto-advance on selection.

**Service PDPs** explain the service and collect customer information — no inventory display.

### Error & empty states

| Situation           | Behavior                                          |
| ------------------- | ------------------------------------------------- |
| No search results   | Suggest related products or categories            |
| Product unavailable | Show next best action (Notify Me / Request Quote) |
| Missing image       | Placeholder image                                 |
| API failure         | Friendly error with retry                         |

### Accessibility

Fully responsive, keyboard navigable, meaningful alt text, readable typography at all sizes, WCAG best practices. (Build order is desktop-first; mobile pass before launch.)

---

## 9. Quote Workflow

Used by pool tables (Check Installation), supplier products (Request Quote), and all services (Request Service Quote). One shared form and endpoint; `serviceType` / `productRef` distinguish the source.

### Form fields

Customer name · email · phone · postal code · product/service reference · selected options · notes.

### Flow

```
PDP / service page
      │  POST /v1/quotes
      ▼
NestJS: validate → store in PostgreSQL → email staff notification
      │
      ├── auto-reply to customer (from info@homebilliards.ca)
      ▼
Confirmation shown: "We'll get back to you within 3 business days"
```

- Staff notification recipients: **[Pending: Shawn — S3]**
- SLA wording to confirm: **[Pending: Shawn — S3]**
- Public form is rate-limited and validated server-side.

---

## 10. Search

**Engine: Algolia**, indexed from BigCommerce data by the NestJS app.

### Required capabilities

Autocomplete · synonym support ("billiard table" → "pool table") · misspelling tolerance · SKU search · brand search · category suggestions · no-results recovery (suggest related products/categories).

Relevance beats exact text match.

### Index fields

`searchTitle`, `name`, `brand`, `category`, `sku`, synonyms, keywords, price, `stockStatus`, primary image URL.

Category facets come from the approved commerce category map plus product-specific attributes returned by the backend.

---

## 11. SEO

> Full field-by-field mapping, description rules, and per-page checklists live in [SEO_SPEC.md](SEO_SPEC.md). This section is the summary.

### What is exposed where

| Surface   | Title                                     | Description                                                        | Other                                                    |
| --------- | ----------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------- |
| PDP       | `searchTitle` in `<title>` · `name` as H1 | `shortDescription` as meta description · `longDescription` in body | canonical URL, OG tags, Product + BreadcrumbList JSON-LD |
| PLP       | Category name + site name                 | Hand-written category copy **[Pending: Jordan — J6]**              | canonical + pagination handling                          |
| Homepage  | Static copy                               | Static copy                                                        | WebSite + SearchAction JSON-LD                           |
| Contact   | Static copy                               | Static copy                                                        | LocalBusiness JSON-LD (address, phone, hours)            |
| All pages | —                                         | —                                                                  | Organization JSON-LD, unique titles, structured headings |

### Structured data (JSON-LD)

| Schema                     | Page     | Key fields                                                |
| -------------------------- | -------- | --------------------------------------------------------- |
| `Product`                  | PDP      | name, brand, sku, price, availability, image, description |
| `AggregateRating` / `Review` | PDP    | rendered only when at least one real, visible product review exists |
| `BreadcrumbList`           | PDP      | category hierarchy + slug                                 |
| `Organization`             | all      | business name, address, phone, URL                        |
| `WebSite` + `SearchAction` | homepage | enables Google sitelinks searchbox                        |
| `LocalBusiness`            | contact  | address, phone, hours (Mon–Fri 9–5, Sat 10–4)             |

### Image alt text

Descriptive, never just the filename.

### Open items (owner: Jordan)

- Pagination indexing strategy (J1)
- Filter-URL indexing rules (J2)
- Variant URL strategy (J3)
- **301 redirect map from the current live site — required before launch** (J4)
- `searchTitle` template approval (J5)
- GA4 / Search Console properties (J7)

### Product feeds

Feedonomics is the transform layer for Google Merchant Center feeds. The backend and BigCommerce provide source fields; Feedonomics formats, maps, and exports them. Required feed fields, variant grouping, Google taxonomy mapping, local inventory timing, and QA rules live in [FEED_SPEC.md](FEED_SPEC.md).

Feed-critical launch rule: `price`, `salePrice`, availability, product URLs, product images, and identifiers must not diverge between BigCommerce, the PDP, Product JSON-LD, Feedonomics, Google Merchant Center, and checkout.

---

## 12. Analytics

**Tools:** GA4 + PostHog (free tier). Every event goes through one internal `track()` helper so tools can be added or swapped without touching call sites.

Events represent **business actions**, not UI interactions.

| Group    | Events                                                                            |
| -------- | --------------------------------------------------------------------------------- |
| Product  | Product Viewed · Variant Selected · Add to Cart · Quote Started · Quote Submitted |
| Search   | Search Performed · Search Result Click · No Results                               |
| Checkout | Checkout Started · Checkout Completed · Checkout Failed                           |
| Service  | Service Viewed · Service Quote Submitted                                          |

Property mapping per event is defined in the Analytics Implementation Spec (roadmap #11, blocked by J7).

---

## 13. Design

The approved visual direction lives in the static demo: **`DEMO/HBSWebv2/`** (see `WEBSITE_HANDOFF.md` there for full detail). The demo's `index.html`, category pages, and Austin builder are the visual reference for the real build.

The production storefront must reproduce the approved visual direction and interaction intent as closely as practical while rebuilding it with production Next.js components, canonical backend data, accessibility, responsive behavior, analytics, and tests. Demo code is not promoted or deployed directly. Assets may be reused only after confirming ownership, quality, and production suitability.

### Direction

Modern, premium, warm, clean.

- Minimal product-page layout inspired by modern furniture ecommerce.
- Wide product imagery, restrained typography, lean UI text.
- Configuration panels feel like light floating glass, not hard boxed sidebars.
- Product cards use clean light-grey/off-white image wells — no heavy beige blocks.
- Buttons: large, confident, pill-like. Black primary, pale outlined secondary.

### Reference components in the demo

Header + dropdown navs · product card (Traeger-cleanup style is the preferred version) · category strip · filter set with price slider · Austin builder (finish swatches, cloth pills, step flow) · services cards · contact page hero treatment.

A formal Design System doc (tokens extracted from the demo CSS) and a Component Inventory are the next documentation deliverables (roadmap #4–5).

### Brand assets

Logo source files and brand package come from Shawn **[Pending: S4]**.

---

## 14. Security

- Customers never see: internal IDs, supplier information, admin endpoints, internal pricing, inventory adjustments.
- The backend validates every request, input, and quote submission.
- Rate limiting on all public forms.
- HTTPS everywhere; secrets live in environment configs, never in code.
- The admin app requires authentication and server-enforced authorization before it can expose non-public data or write operations. Roles and MVP permissions are pending in decision T1.
- PCI compliance via Stripe/BigCommerce hosted checkout — card data never touches our servers.

---

## 15. Performance

### Targets

- API responses < 300 ms for 95% of requests under normal load.
- 99.9% backend uptime.
- Usable on slow mobile connections.

### Techniques

Optimized images (Cloudinary transforms) · lazy loading · CDN delivery · server-side rendering / static generation per page type · perceived-performance first.

### Failure behavior

| Dependency down | Site behavior                                                   |
| --------------- | --------------------------------------------------------------- |
| BigCommerce     | Browse from cache where possible; disable ordering; notify user |
| Algolia         | Fall back to category browsing                                  |
| Feedonomics/GMC | Storefront remains live; feed updates pause until export is healthy |
| Cloudinary      | Placeholder images                                              |
| Stripe          | Disable checkout; explain payment issue                         |
| PostgreSQL      | Friendly error on quote forms; retry mechanism                  |

---

## 16. Deployment

```
GitHub monorepo
├── apps/storefront  → CI → Vercel project: storefront
├── apps/admin       → CI → Vercel project: admin
└── apps/backend     → CI → Railway service + PostgreSQL
```

- Each deployment project uses its application folder as its root and ignores changes that do not affect that application.
- Fully automated deploys from GitHub; manual production deploys avoided.
- Feature branches open pull requests into `dev`. `dev` is the integration branch and target for the shared non-production environment.
- Releases use a reviewed pull request from `dev` into `main`. `main` is the stable production branch.
- Emergency branches start from `main`, merge back into `main`, and are then reconciled into `dev`.
- Environments: local -> feature preview where supported -> shared development/staging from `dev` -> production from `main`.
- Production secrets and development secrets are isolated. Secrets live in Vercel, Railway, or GitHub environment settings and are never committed.
- Launch requires: DNS cutover for homebilliards.ca, 301 redirect map live (J4), Search Console + GA4 verified, Feedonomics/GMC feed QA if product listings are active at launch, QA checklists passed.

---

## 17. Quality Assurance

Run per feature before deploy:

**PDP** — images load · price displayed · variants work · CTA correct · breadcrumbs correct · related products shown · SEO metadata generated.

**PLP** — filters work · pagination correct · sorting works · product count correct.

**Search** — synonyms work · misspellings return results · SKU search works · brand search works.

**Quote forms** — validation works · success confirmation shown · database record created · staff notification sent.

**Feeds** — required attributes present · product URLs resolve · image URLs crawlable · price and availability match PDP/checkout · variants grouped correctly · overridden SEO/feed fields visible to Feedonomics.

---

## 18. Roadmap

| Phase                 | Scope                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| **0 — Preparation (complete)** | Monorepo, Vercel/Railway targets, demo reference status, Git workflow, and open-decision register confirmed |
| **1 — MVP foundation (current)** | Application scaffolds, canonical contracts, environment validation, CI, and initial BigCommerce integration |
| **1.1 — MVP experience** | Full sitemap, quote flow, Algolia search, BigCommerce catalog, Feedonomics-ready product data, GA4/PostHog |
| **1.5**               | Content enrichment across the catalog, GTIN/MPN sourcing, product highlights/spec backfill, mobile optimization pass |
| **2**                 | Customer accounts, wishlists, product reviews, category/product FAQs                                     |
| **2.5**               | Local inventory feed after Google Business Profile + reliable showroom stock data                        |
| **3**                 | Advanced configurators, appointment scheduling, videos, Merchant promotions                              |
| **4**                 | AI-powered search, personalized recommendations, customer dashboards, advanced merchandising            |

Explicitly excluded: financing (decided against), blog/resources (not in MVP), product comparison (phase 2+).

---

## 19. Glossary

| Term                  | Meaning                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| **BFF**               | Backend for Frontend — the NestJS app; the only API consumed by the storefront and admin                   |
| **Canonical schema**  | The single standardized product shape the frontend receives, regardless of data source                     |
| **CTA**               | Call to Action — the primary button on a product (Add to Cart, Check Installation, …)                      |
| **DMI**               | Dismantle, Move and Install — a service offering                                                           |
| **Fulfillment state** | How a product reaches the customer (In Stock, Special Order, Quote Required, …)                            |
| **Feedonomics**       | Product feed transformation layer used to send commerce data to Google Merchant Center                     |
| **GMC**               | Google Merchant Center — receives product feeds for Shopping ads and free product listings                  |
| **GTIN / MPN**        | Manufacturer identifiers used by product feeds; never fabricate missing identifiers                         |
| **Item group ID**     | Feed field used to group product variants under one product family                                         |
| **PLP**               | Product Listing Page — a category page with a product grid                                                 |
| **PDP**               | Product Detail Page — a single product's page                                                              |
| **Product Type**      | Behavioral classification that determines a product's journey (Standard SKU, Install Required, Service, …) |
| **Recovering**        | Replacing the cloth on a pool table                                                                        |
| **Rosetta**           | Internal catalog-normalization tool, developed separately; out of website scope                            |
| **Variant**           | A purchasable variation of a product (cloth color, finish, size, weight)                                   |

---

## 20. Related Documents

**Living documents** (kept up to date):

| Document                           | Purpose                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| **DOCUMENTATION.md** (this file)   | The single reference for everything decided                                          |
| [DECISIONS.md](DECISIONS.md)       | Only open questions — meeting doc for Shawn & Jordan                                 |
| [SEO_SPEC.md](SEO_SPEC.md)         | Field-by-field SEO mapping, description rules, per-page checklists                   |
| [FEED_SPEC.md](FEED_SPEC.md)       | Feedonomics/GMC feed mapping, source rules, variant grouping, and feed QA            |
| `DEMO/HBSWebv2/WEBSITE_HANDOFF.md` | Demo detail: page-by-page state, asset folders, cloth color tables, builder behavior |

**Archive** (`archive/` — history, do not use for current work):

| Document                               | Purpose                                         |
| -------------------------------------- | ----------------------------------------------- |
| `archive/DECISIONS-RESOLVED.md`        | Record of all decisions made and their notes    |
| `archive/HOME_BILLIARDS_WEBSITE_EN.md` | Old extended working doc (Foundation 1–6 merge) |

**Rule:** every fact lives in exactly one living document; everything else links to it. When a decision is resolved, it gets written here and removed from DECISIONS.md.
