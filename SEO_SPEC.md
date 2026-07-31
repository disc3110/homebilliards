# Home Billiards — SEO Specification

**Owner:** Jordan (SEO) · **Maintainer:** Diego Solis-Cuevas  
**Status:** Feed-aware field mapping updated · indexing/feed rules pending Jordan's decisions (see [DECISIONS.md](DECISIONS.md))

> This document defines exactly which content field appears on each surface of the website, the rules for the three description fields, and the SEO checklist per page type. It is the implementation contract between the SEO team and development.

---

## 1. Content Fields

Every product has separate text fields for display, organic SEO, product feeds, and on-page content. The feed title and the SEO title are intentionally different fields.

| Field | Length | Produced By | Purpose |
|---|---|---|---|
| `name` | Clean product display name | BigCommerce + review | H1, cards, customer-facing product identity |
| `feedTitle` | Up to 150 chars | BigCommerce + Feedonomics mapping + overrides | Shopping/free-listing product title; clean product name, not SEO keyword title |
| `shortDescription` | 1–2 sentences (~160 chars) | AI-assisted + human review, Jordan can override | Product cards, meta description, search snippets, Open Graph |
| `longDescription` | 3–6 paragraphs | AI-assisted + human review | PDP body — sells the product, tells the story |
| `feedDescription` | Feed-safe product facts | BigCommerce + Feedonomics mapping + overrides | Feed description; no shipping claims, promo copy, store name, or competitor mentions |
| `searchTitle` | 60–70 chars | Template-generated, Jordan can override | `<title>` tag, Algolia search index |
| `productHighlights` | 2–10 short factual bullets | Content enrichment | PDP bullets, feed `product_highlight`, AI-answer extraction |

**Rules:**

- `shortDescription` must be unique per product. It cannot be a truncated version of `longDescription`.
- `longDescription` is HTML-safe (supports `<p>`, `<ul>`, `<strong>`). Never rendered outside the PDP.
- `searchTitle` is optimized for keywords, not marketing copy. Example: `"8ft Slate Pool Table | Legacy Oak | Home Billiards"` vs. the display name `"Legacy Oak Pool Table"`.
- `feedTitle` should match the product landing page and feed requirements. It should not contain promo text, keyword stuffing, shipping claims, or all-caps copy.
- `feedDescription` should be factual product content only. Feed-specific formatting and final GMC delivery rules live in `FEED_SPEC.md`.
- Manual overrides always win and are never overwritten by catalog re-syncs.
- Existing BigCommerce product content is kept and updated — not replaced from scratch.

---

## 2. What Is Exposed Where

### Product Card (PLP / Homepage featured)

| Element | Source Field | Notes |
|---|---|---|
| Product name | `name` | Display name, not SEO-optimized |
| Brand | `brand` | Plain text |
| Price | `price` | Formatted client-side |
| Fulfillment badge | `stockStatus` + `fulfillmentType` | e.g. "In Stock", "Special Order" |
| Short description | `shortDescription` | Shown below name on hover or below image |
| CTA button | `cta` (precomputed) | e.g. "Add to Cart", "Check Installation" |
| Product image | `images[0]` (primary) | Served via Cloudinary CDN |

### Product Detail Page (PDP)

| Element | Source Field | Notes |
|---|---|---|
| `<title>` | `searchTitle` | SEO-optimized, shown in browser tab and SERP |
| `<meta name="description">` | `shortDescription` | ≤ 160 chars |
| `<link rel="canonical">` | `slug` | e.g. `/pool-tables/legacy-oak-8ft` |
| H1 heading | `name` | Display name |
| Brand | `brand` | Linked to brand PLP filter |
| Price | `price` + variant `priceAdjustment` | |
| Short description | `shortDescription` | Displayed below H1, above price |
| Long description | `longDescription` | Full body section below images |
| Product highlights | `productHighlights` | Short factual bullets when available |
| Specs / attributes | `specifications` (key-value pairs) | Rendered in a specs table |
| Variants | `variants[]` | Size, cloth color, finish, etc. |
| Fulfillment info | `fulfillmentType`, `leadTime`, `installationRequired` | Shown near CTA |
| CTA button | `cta` (precomputed) | Primary action |
| Breadcrumbs | Category hierarchy | Used in breadcrumb schema |
| Open Graph title | `searchTitle` | Shared on social media |
| Open Graph description | `shortDescription` | |
| Open Graph image | `images[0]` | |

### Structured Data (JSON-LD)

| Schema Type | Page | Fields Used |
|---|---|---|
| `Product` | PDP | `name`, `brand`, `sku`, `price`, `stockStatus`, `images[0]`, `shortDescription` |
| `AggregateRating` / `Review` | PDP | Only when at least one real review exists and is visible on the page |
| `BreadcrumbList` | PDP | Category hierarchy + `slug` |
| `Organization` | All pages | Business name, address, phone, URL |
| `WebSite` + `SearchAction` | Homepage | Enables Google sitelinks searchbox |
| `LocalBusiness` | Contact page | Address, phone, hours (Mon–Fri 9–5, Sat 10–4) |

Review schema rule: do not output `aggregateRating` with `reviewCount: 0`, a zero rating, or reviews that are not visible to customers on the page. Products with zero reviews still render Product/Offer JSON-LD, but omit rating and review properties entirely.

### Search Results Page (internal)

| Element | Source Field |
|---|---|
| Result title | `searchTitle` |
| Result snippet | `shortDescription` |
| Result image | `images[0]` |
| Brand chip | `brand` |
| Category | `category` |

### Category Pages (PLP)

| Element | Source Field | Notes |
|---|---|---|
| `<title>` | Category name + site name | e.g. `"Pool Tables — Home Billiards"` |
| `<meta name="description">` | Category-level copy | Hand-written, not from product fields |
| `<link rel="canonical">` | Category slug | Handles pagination with `?page=N` |
| `rel="next"` / `rel="prev"` | Pagination | For multi-page categories |
| FAQ blocks | Category-level structured Q&A | Optional enrichment for high-consideration categories; used for UX and AI-answer extraction, not guaranteed FAQ rich results |

### Homepage

| Element | Source | Notes |
|---|---|---|
| `<title>` | Static copy | e.g. `"Home Billiards — Canada's Destination for Luxury Game Rooms"` |
| `<meta name="description">` | Static copy | Written by SEO team |
| Featured product cards | `name`, `images[0]`, `price`, `cta` | No description on cards here |

---

## 3. SEO Checklist Per Page Type

### PDP

- [ ] `<title>` uses `searchTitle` (50–70 chars, includes brand + category keyword)
- [ ] `<meta name="description">` uses `shortDescription` (≤ 160 chars, unique)
- [ ] `<link rel="canonical">` present
- [ ] H1 = product display `name`
- [ ] Open Graph tags present (`og:title`, `og:description`, `og:image`, `og:url`)
- [ ] `Product` JSON-LD present with `offers` (price + availability)
- [ ] `aggregateRating` / `review` JSON-LD omitted unless the product has at least one real, visible review
- [ ] `BreadcrumbList` JSON-LD present
- [ ] No duplicate content between `shortDescription` and `longDescription`
- [ ] Images have descriptive `alt` text (not just filename)
- [ ] Visible price and availability match JSON-LD, feed values, and checkout/cart behavior

### PLP (Category)

- [ ] `<title>` unique per category
- [ ] `<meta name="description">` category-level, not auto-generated
- [ ] `<link rel="canonical">` handles pagination correctly
- [ ] `rel="next"` / `rel="prev"` for paginated pages
- [ ] H1 = category name
- [ ] Filters do not generate indexable URLs unless intentional
- [ ] Category FAQ/content blocks included only when approved for the category

### Homepage

- [ ] `<title>` includes primary keyword
- [ ] `WebSite` + `SearchAction` JSON-LD for Google sitelinks searchbox
- [ ] `Organization` or `LocalBusiness` JSON-LD

---

## 4. Pending Decisions

The following items block final implementation of the indexing rules. They live in [DECISIONS.md](DECISIONS.md) — Jordan's section:

- **J1** — Pagination indexing (index page 1 only?)
- **J2** — Filter-URL indexing rules
- **J3** — Variant URL strategy
- **J4** — **301 redirect map from the current live site (required before launch)**
- **J5** — `searchTitle` template approval
- **J6** — Category meta descriptions: who writes them, priority order
- **J7** — GA4 / Search Console properties

Feed-specific requirements live in [FEED_SPEC.md](FEED_SPEC.md). SEO implementation must still ensure feed/page consistency for URLs, titles, descriptions, images, price, availability, and structured data.
