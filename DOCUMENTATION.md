# Home Billiards Website — Project Documentation

**Version:** 1.0 · July 2026  
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
| Frontend        | **Next.js** (TypeScript)                 | Deployed on Vercel                                             |
| Backend (BFF)   | **NestJS** (TypeScript)                  | Deployed on Railway; the only API the frontend talks to        |
| Product catalog | **BigCommerce**                          | Existing store, already loaded with products                   |
| Database        | **PostgreSQL** (Railway)                 | Quotes + manual metadata overrides — _not_ the product catalog |
| Search          | **Algolia**                              | Indexed from BigCommerce via the NestJS app                    |
| Payments        | **Stripe** / BigCommerce hosted checkout | Existing Stripe account                                        |
| Media           | **Cloudinary**                           | Existing account                                               |
| Analytics       | **GA4 + PostHog**                        | All events through one internal `track()` helper               |
| CI/CD           | GitHub → Vercel / Railway                | Fully automated; no manual production deploys                  |

**Note on Rosetta:** Rosetta is an internal catalog-normalization tool being developed separately. It will eventually feed product data and generated descriptions into the system, but **it is out of scope for the website**. The website integrates with BigCommerce and never needs to know Rosetta exists.

---

## 3. System Architecture

```
BigCommerce ──────────┐            ┌────── Algolia
(catalog + orders)    │            │       (search)
                      ▼            ▼
              ┌─────────────────────────┐
              │   NestJS BFF (Railway)  │──── PostgreSQL
              │  · canonical mapping    │     (quotes, overrides)
              │  · business rules       │
              │  · CTA computation      │
              └───────────┬─────────────┘
                          │ REST (canonical schema only)
                          ▼
              ┌─────────────────────────┐
              │ Next.js Frontend        │────► Stripe / hosted checkout
              │ (Vercel)                │
              └─────────────────────────┘
```

### Responsibilities

**NestJS backend (BFF — Backend for Frontend):**

- Fetches products from BigCommerce and maps them into the canonical schema. The frontend never sees BigCommerce's raw shape.
- Computes all business rules: CTA, fulfillment messaging, quote-required state.
- Stores and processes quote submissions.
- Keeps the Algolia index in sync.
- Validates every request and input; rate-limits public forms.

**Next.js frontend:**

- Renders the state returned by the backend.
- Manages UI state, form validation, responsive layout, accessibility.
- Never talks directly to BigCommerce, Stripe internals, or Cloudinary admin APIs.

### Architecture rules

| Rule                             | Meaning                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Canonical schema is the contract | Shared TypeScript types define what a Product looks like; both apps depend on those types                                |
| BigCommerce is replaceable       | All BigCommerce-specific code stays behind the mapping layer; swapping the data source later must not touch the frontend |
| Backend precomputes `cta`        | The frontend renders `cta` as a button; it never maps productType/stock to an action itself                              |
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
  "slug": "legacy-oak-8ft",
  "productType": "install_required",
  "category": "pool-tables",
  "brand": "Legacy",
  "name": "Legacy Oak Pool Table",
  "shortDescription": "…",
  "longDescription": "…",
  "price": 4999,
  "stockStatus": "IN_STOCK",
  "fulfillmentType": "LOCAL_STOCK",
  "leadTime": null,
  "installationRequired": true,
  "quoteRequired": false,
  "cta": "CHECK_INSTALLATION",
  "images": [{ "url": "…", "role": "hero", "alt": "…" }],
  "variants": [],
  "specifications": {},
  "seo": { "metaTitle": "…", "metaDescription": "…", "searchTitle": "…" }
}
```

### Field groups

| Group          | Fields                                                                                | Notes                                           |
| -------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Identity       | `id`, `sku`, `slug`                                                                   | `slug` is the URL segment                       |
| Classification | `productType`, `category`, `brand`                                                    | drives behavior and navigation                  |
| Content        | `name`, `shortDescription`, `longDescription`                                         | see [SEO](#11-seo) for usage rules              |
| Pricing        | `price`, variant `priceAdjustment`                                                    |                                                 |
| Fulfillment    | `stockStatus`, `fulfillmentType`, `leadTime`, `installationRequired`, `quoteRequired` | structured, never plain text                    |
| Action         | `cta`                                                                                 | precomputed by backend                          |
| Media          | `images[]` with `{ url, role, alt }`                                                  | roles: `hero`, `gallery`, `swatch`, `lifestyle` |
| Search         | `searchTitle`, synonyms, keywords                                                     | feeds Algolia                                   |
| SEO            | `metaTitle`, `metaDescription`                                                        |                                                 |

### Variants

Products expose zero or more variants (cloth color, size, finish, cue weight). Variants inherit the parent and expose only differing fields (`id`, `name`, `sku`, `priceAdjustment`, `isAvailable`).

Variant URLs: **[Pending: Jordan — J3]**. Dev recommendation is one URL per product with variants as client-side state.

### Publishing rules

A product must not be published without: ID, SKU, product type, category, name, price, stock status, fulfillment type, primary image, and slug. Incomplete products stay unpublished.

### Content fields (three descriptions)

| Field              | Length                         | Used in                                                      |
| ------------------ | ------------------------------ | ------------------------------------------------------------ |
| `shortDescription` | 1–2 sentences (~160 chars)     | Product cards, meta description, search snippets, Open Graph |
| `longDescription`  | 3–6 paragraphs, HTML-safe      | PDP body only                                                |
| `searchTitle`      | 60–70 chars, keyword-optimized | `<title>` tag, Algolia index                                 |

Rules: `shortDescription` is unique per product and never a truncation of `longDescription`. `searchTitle` is generated by template with manual override capability (overrides always win and survive re-syncs).

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
/games                               PLP — contents to confirm [Pending: Shawn — S6]
/games/[slug]                        PDP
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
- Nav: Billiards, Ping Pong, BBQ, Foosball, Darts, Games, Commercial, New Arrivals, Sale, Made in Canada.
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

Category facets depend on the final category structure **[Pending: Shawn — S6]**.

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
- Admin functionality (future) requires authentication and authorization; role-based permissions planned.
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
| Cloudinary      | Placeholder images                                              |
| Stripe          | Disable checkout; explain payment issue                         |
| PostgreSQL      | Friendly error on quote forms; retry mechanism                  |

---

## 16. Deployment

```
GitHub (frontend repo)  → CI → Vercel   → Next.js
GitHub (backend repo)   → CI → Railway  → NestJS + PostgreSQL
```

- Fully automated deploys from GitHub; manual production deploys avoided.
- Environments: local → preview (per-PR) → production.
- Launch requires: DNS cutover for homebilliards.ca, 301 redirect map live (J4), Search Console + GA4 verified, QA checklists passed.

---

## 17. Quality Assurance

Run per feature before deploy:

**PDP** — images load · price displayed · variants work · CTA correct · breadcrumbs correct · related products shown · SEO metadata generated.

**PLP** — filters work · pagination correct · sorting works · product count correct.

**Search** — synonyms work · misspellings return results · SKU search works · brand search works.

**Quote forms** — validation works · success confirmation shown · database record created · staff notification sent.

---

## 18. Roadmap

| Phase                 | Scope                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| **1 — MVP (current)** | Everything in this document: full sitemap, quote flow, Algolia search, BigCommerce catalog, GA4/PostHog |
| **1.5**               | Content enrichment across the catalog (AI-assisted descriptions with review), mobile optimization pass  |
| **2**                 | Customer accounts, wishlists, product reviews                                                           |
| **3**                 | Advanced configurators, appointment scheduling                                                          |
| **4**                 | AI-powered search, personalized recommendations, customer dashboards, advanced merchandising            |

Explicitly excluded: financing (decided against), blog/resources (not in MVP), product comparison (phase 2+).

---

## 19. Glossary

| Term                  | Meaning                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| **BFF**               | Backend for Frontend — the NestJS app; the only API the frontend consumes                                  |
| **Canonical schema**  | The single standardized product shape the frontend receives, regardless of data source                     |
| **CTA**               | Call to Action — the primary button on a product (Add to Cart, Check Installation, …)                      |
| **DMI**               | Dismantle, Move and Install — a service offering                                                           |
| **Fulfillment state** | How a product reaches the customer (In Stock, Special Order, Quote Required, …)                            |
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
| `DEMO/HBSWebv2/WEBSITE_HANDOFF.md` | Demo detail: page-by-page state, asset folders, cloth color tables, builder behavior |

**Archive** (`archive/` — history, do not use for current work):

| Document                               | Purpose                                         |
| -------------------------------------- | ----------------------------------------------- |
| `archive/DECISIONS-RESOLVED.md`        | Record of all decisions made and their notes    |
| `archive/HOME_BILLIARDS_WEBSITE_EN.md` | Old extended working doc (Foundation 1–6 merge) |

**Rule:** every fact lives in exactly one living document; everything else links to it. When a decision is resolved, it gets written here and removed from DECISIONS.md.
