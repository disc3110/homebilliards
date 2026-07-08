# Home Billiards Website — Working Document

**Author:** Diego Solis-Cuevas  
**Version:** 1.0 — July 2026  
**Status:** In Progress

---

## Table of Contents

1. [Business Context](#1-business-context)
2. [System Architecture](#2-system-architecture)
3. [External Dependencies](#3-external-dependencies)
4. [Domain Model](#4-domain-model)
5. [Product Types](#5-product-types)
6. [Fulfillment States](#6-fulfillment-states)
7. [CTA by Product State](#7-cta-by-product-state)
8. [Canonical Data Model](#8-canonical-data-model)
9. [Website Behaviour](#9-website-behaviour)
10. [Integration Architecture](#10-integration-architecture)
11. [Current Demo State](#11-current-demo-state)
12. [Design Direction](#12-design-direction)
13. [Development Principles](#13-development-principles)
14. [Analytics](#14-analytics)
15. [Quality Assurance](#15-quality-assurance)
16. [Security](#16-security)
17. [SEO](#17-seo)
18. [Deployment](#18-deployment)
19. [Project Risks](#19-project-risks)
20. [Roadmap](#20-roadmap)
21. [Working Rules](#21-working-rules)
22. [Open Decisions](#22-open-decisions)

---

## 1. Business Context

Home Billiards has been serving customers throughout British Columbia since 1987. Specialty in premium game room products:

- Pool Tables
- Cue Sports
- Ping Pong Tables
- Foosball Tables
- Shuffleboard
- Air Hockey
- Darts
- Outdoor Grills (Traeger)
- Accessories

The catalog contains approximately **10,000 products** from multiple manufacturers. Pool tables represent only one category but generate most of business value and require significantly more complex purchasing workflows.

To normalize vendor catalogs, **Rosetta** is being developed — an internal platform that converts inconsistent catalogs into standardized product data the website consumes.

**The website never consumes vendor catalogs directly.**

---

## 2. System Architecture

```
Vendor Catalogs → Rosetta → Canonical Database → Backend API → Next.js Frontend
                                                       ↕              ↕
                                           Cloudinary / Stripe / BigCommerce / Search Index / ACE POS
```

- **Rosetta** normalizes vendor catalogs.
- **Canonical Database** is the website's single source of truth.
- **Backend API** applies business rules and serves the frontend (BFF — Backend for Frontend pattern).
- **Frontend (Next.js)** renders the state returned by the backend. It never derives business logic.

---

## 3. External Dependencies

| System             | Website Uses It For                         |
| ------------------ | ------------------------------------------- |
| Rosetta            | Standardized product data                   |
| Canonical Database | Product source of truth                     |
| Cloudinary         | Images and media                            |
| Stripe             | Payment processing                          |
| BigCommerce        | Orders and SEO                              |
| ACE POS            | Legacy inventory reference during migration |

---

## 4. Domain Model

### Design Principles

- **Canonical Data First** — The frontend never receives vendor-specific data.
- **Customer Experience Drives Architecture** — Products are modeled according to how customers buy them, not how vendors organize them.
- **One Product Type, One Behavior** — Every product belongs to exactly one Product Type that determines its CTA, customer journey, and page behavior.
- **Business Rules Live in the Backend** — The frontend renders state; it never duplicates business logic.
- **Progressive Complexity** — Simple products remain simple to purchase. Additional complexity only appears when the product requires it.

### Domain Relationships

```
Product → ProductType
Product → Category
Product → Brand
Product → CTA
```

---

## 5. Product Types

| Type              | Examples                                              | Primary CTA                  |
| ----------------- | ----------------------------------------------------- | ---------------------------- |
| Standard SKU      | Chalk, Cases, Balls                                   | Add to Cart                  |
| Specification SKU | Cues, Shafts, Darts                                   | Add to Cart                  |
| Furniture Product | Ping Pong, Foosball, Shuffleboard, Air Hockey, Grills | Add to Cart / Check Delivery |
| Install Required  | Pool Tables                                           | Check Installation           |
| Service           | Installation, Move, Recover, DMI                      | Request Service Quote        |

### Standard SKU

Fixed pricing, standard shipping, immediate checkout, simple flow.

### Specification SKU

Technical specs influence purchasing decisions. Customers benefit from filtering and comparison.

### Furniture Product

Large products that may require delivery planning. Installation is optional.

### Install Required (Pool Tables)

Highest-value products. Require delivery planning, installation scheduling, and often customer consultation before purchase.  
**Future:** Selected in-stock pool tables may support direct online checkout.

### Service

No physical inventory. Initiates a workflow requiring staff review and scheduling.

---

## 6. Fulfillment States

| State              | Customer Meaning                              |
| ------------------ | --------------------------------------------- |
| In Stock           | Available in the warehouse                    |
| Supplier Available | Available from a supplier; lead time required |
| Special Order      | Ordered after purchase                        |
| Custom Order       | Built or configured after order               |
| Quote Required     | Staff confirmation required before purchase   |

**Rule:** The website never displays "Available" without giving the customer enough context to understand how the product will be fulfilled.

---

## 7. CTA by Product State

| Product State         | Primary CTA           |
| --------------------- | --------------------- |
| Standard In Stock     | Add to Cart           |
| Standard Out of Stock | Notify Me             |
| Furniture Product     | Check Delivery        |
| Install Required      | Check Installation    |
| Supplier Product      | Request Quote         |
| Service               | Request Service Quote |

The backend returns the precomputed CTA. The frontend renders it without deriving additional logic.

---

## 8. Canonical Data Model

### Required Fields per Product

| Group          | Fields                              |
| -------------- | ----------------------------------- |
| Identity       | id, sku, slug                       |
| Classification | productType, category, brand        |
| Content        | name, shortDescription, description |
| Pricing        | price                               |
| Inventory      | stockStatus                         |
| Fulfillment    | fulfillmentType                     |
| Media          | images                              |
| Search         | searchTitle                         |
| SEO            | metaTitle, metaDescription          |

### Conceptual Schema

```json
{
  "id": "uuid",
  "sku": "HB-001",
  "slug": "legacy-oak-8ft",
  "productType": "install_required",
  "category": "pool-tables",
  "brand": "Legacy",
  "name": "Legacy Oak Pool Table",
  "price": 4999,
  "stockStatus": "IN_STOCK",
  "fulfillmentType": "LOCAL_STOCK",
  "images": [],
  "variants": []
}
```

### Variant Model

Products may expose zero or more variants (cloth color, table size, cue weight, finish). Variants inherit the parent product and only expose fields that differ.

### Fulfillment Fields

| Field                | Purpose                                    |
| -------------------- | ------------------------------------------ |
| fulfillmentType      | Delivery strategy                          |
| stockStatus          | Inventory state                            |
| leadTime             | Estimated availability                     |
| installationRequired | Installation flag                          |
| quoteRequired        | Indicates if staff interaction is required |

### Search Metadata

| Field         | Example                    |
| ------------- | -------------------------- |
| searchTitle   | Legacy Oak Pool Table      |
| synonyms      | billiard table, pool table |
| keywords      | slate, 8ft                 |
| searchableSku | HB-001                     |
| brand         | Legacy                     |

### Publishing Rules

A product must not be published unless it has:  
Product ID, SKU, Product Type, Category, Name, Price, Stock Status, Fulfillment Type, Primary Image, SEO Slug.

### API Response

```json
{
  "product": {
    "id": "uuid",
    "name": "Legacy Oak Pool Table",
    "productType": "install_required",
    "price": 4999,
    "stockStatus": "IN_STOCK",
    "fulfillmentType": "LOCAL_STOCK",
    "cta": "CHECK_INSTALLATION"
  }
}
```

---

## 9. Website Behaviour

### Principles

Every page must help the customer answer three questions as quickly as possible:

1. What is this product?
2. Can I buy it?
3. What should I do next?

### Customer Journey

```
Home → Category (PLP) → Product (PDP) → Decision → Checkout / Quote
```

### Homepage

**Required sections:**

- Hero banner
- Featured product categories
- Featured products
- Why Home Billiards
- Installation & delivery overview
- Services
- Footer

**Required data per section:**

| Component         | Data Required                   |
| ----------------- | ------------------------------- |
| Hero              | Headline, CTA, background media |
| Categories        | Name, image, slug               |
| Featured Products | Product card data               |
| Services          | Title, description, CTA         |

The homepage must be data-driven. Merchandising content must be configurable without code changes.

### Product Listing Pages (PLP)

**Required features:**

- Pagination
- Sorting
- Filters (including price slider)
- Search within category
- Breadcrumbs
- Product cards
- Horizontal category strip

**Product Card — required fields:**

- Primary image
- Product name
- Brand
- Price
- Fulfillment badge
- Primary CTA

Product cards never expose vendor-specific information.

### Product Detail Pages (PDP)

**Required sections:**

- Image gallery
- Product information
- Price
- Variants
- Specifications
- Fulfillment information
- Primary CTA
- Related products

**Pool Table additional modules:**

- Cloth selection
- Live Custumazation
- Installation information
- Delivery information
- Quote guidance

**Service pages:**  
Focus on explaining the service and collecting customer information rather than displaying inventory.

### Search Experience

- Autocomplete
- Synonym support
- SKU search
- Brand search
- Category suggestions
- No-results recovery

### Quote Flow

**Required fields:**

- Customer name
- Email
- Phone number
- Postal code
- Product
- Selected options
- Customer notes

After submission, the customer receives confirmation that the request was received.

### Service Pages

- Pool table moving
- Installation
- Recovering
- DMI services

Emphasis on consultation and scheduling, not ecommerce checkout.

### Error / Empty States

| Situation           | Expected Behaviour                                 |
| ------------------- | -------------------------------------------------- |
| No search results   | Suggest related products or categories             |
| Product unavailable | Show next best action (Notify Me or Request Quote) |
| Missing image       | Show placeholder image                             |
| API failure         | Friendly error with retry option                   |

### Accessibility & Responsive

- Fully responsive
- Keyboard navigation
- Meaningful alt text
- Readable typography on all devices

---

## 10. Integration Architecture

### BFF Pattern (Backend for Frontend)

The backend centralizes all interactions with external systems. The frontend never communicates directly with Stripe, Cloudinary, or BigCommerce. The backend acts as proxy and orchestrator.

### API Endpoints

| Endpoint            | Method | Purpose                        |
| ------------------- | ------ | ------------------------------ |
| `/products`         | GET    | Product list                   |
| `/products/{slug}`  | GET    | Product detail                 |
| `/categories`       | GET    | Product categories             |
| `/search`           | GET    | Search with filters            |
| `/quotes`           | POST   | Submit a quote request         |
| `/checkout/session` | POST   | Create Stripe Checkout session |
| `/filters`          | GET    | Available filters              |

### API Design Principles

- RESTful with appropriate HTTP verbs
- Semantic versioning via URL path (e.g. `/v1/`)
- Explicit DTOs for input/output
- Strong validation with detailed error messages
- Consistent error format

### Failure Scenarios

| Failure                 | Website Behaviour                                                 |
| ----------------------- | ----------------------------------------------------------------- |
| Database unavailable    | Friendly error; retry mechanism; non-critical feature degradation |
| Cloudinary unavailable  | Fallback to placeholder images                                    |
| Stripe unavailable      | Disable checkout; notify user                                     |
| BigCommerce unavailable | Allow browsing, disable orders                                    |
| Search unavailable      | Fallback to category browsing                                     |

### Non-Functional Requirements

- **Performance:** Response times < 300ms for 95% of requests under normal load
- **Scalability:** Support 10,000 concurrent sessions
- **Availability:** 99.9% uptime
- **Security:** HTTPS, OAuth2/JWT, PCI compliance for payments
- **Observability:** Centralized logging, metrics, alerting

### Architecture Decision Records (ADRs)

| ADR     | Decision                                                   | Status   |
| ------- | ---------------------------------------------------------- | -------- |
| ADR-001 | Every product belongs to exactly one Product Type          | Accepted |
| ADR-002 | Product Type defines the default customer journey          | Accepted |
| ADR-003 | Frontend renders state; backend owns business rules        | Accepted |
| ADR-004 | Website consumes canonical product data only               | Accepted |
| ADR-005 | Vendor-specific logic is prohibited in the frontend        | Accepted |
| ADR-006 | Adopt Backend for Frontend pattern                         | Accepted |
| ADR-007 | Frontend never communicates directly with Rosetta          | Accepted |
| ADR-008 | Canonical Database is the website's single source of truth | Accepted |
| ADR-009 | Stripe integration isolated behind backend API             | Accepted |
| ADR-010 | Cloudinary URLs provided exclusively by backend            | Accepted |
| ADR-011 | Search index maintained independently and consumed via API | Accepted |
| ADR-012 | Graceful degradation strategies for external failures      | Accepted |

---

## 11. Current Demo State

The static demo lives at: `DEMO/HBSWebv2/`

The demo is a **local static mockup** (HTML/CSS/JS). Eventually product data, pricing, variants, inventory, and collection links should come from BigCommerce.

### Current Pages

| File                                                  | Description                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `index.html`                                          | Finalized homepage — hero, department cards, Austin builder promo, services, resources, footer |
| `pool-tables.html`                                    | Category page with 106 mock product cards, filters, sorting, category strip                    |
| `austin-pool-table.html`                              | Premium builder/configurator for California House Austin Pool Table                            |
| `ping-pong-tables.html`                               | Category page with 7 mock product cards                                                        |
| `whistler-indoor-table-tennis-table.html`             | Regular product page                                                                           |
| `traeger-smokers.html`                                | Traeger category page with hero, category strip, filters, product grid                         |
| `cues.html`                                           | Category page with 15 product cards and filters                                                |
| `dartboards.html`                                     | Category page with 8 product cards and filters                                                 |
| `bull-carbon-black-with-6-purple-abalone-points.html` | Cue product page with weight selection                                                         |
| `contact-us.html`                                     | Contact/showroom page                                                                          |

### Contact Details

- **Phone:** `(604) 321-5553`
- **Email:** `info@homebilliards.ca`
- **Address:** `1644 SE Marine Drive, Vancouver, BC V5P 2R6`

### Navigation / Header

- Logo on the left
- Search and "Contact Us" centered above navigation
- Nav categories: Billiards, Ping Pong, BBQ, Foosball, Darts, Games, Commercial, New Arrivals, Sale, Made in Canada
- "Contact Us" → `contact-us.html`
- Darts links → `dartboards.html`

### Key Assets

| Folder/File                                   | Contents                       |
| --------------------------------------------- | ------------------------------ |
| `assets/home-hero-luxury-game-room.jpg`       | Homepage hero                  |
| `assets/austin-lifestyle-promo.png`           | Austin builder promo section   |
| `assets/service-design-help.jpg`              | Design Help service image      |
| `assets/service-table-moving.jpg`             | Table Moving service image     |
| `assets/service-table-recovering.jpg`         | Table Recovering service image |
| `assets/service-commercial-game-rooms.jpg`    | Commercial Game Rooms image    |
| `assets/resource-pool-table-style-guide.jpg`  | Blog/guide resource            |
| `assets/resource-pool-table-buying-guide.jpg` | Blog/guide resource            |
| `assets/resource-cue-comparison-guide.jpg`    | Blog/guide resource            |
| `assets/california-house-finishes/`           | Wood finish swatches           |
| `assets/california-house-austin-renders/`     | Austin renders by finish       |
| `assets/austin-gallery/`                      | Austin gallery photos          |
| `assets/pool-table-categories/`               | Pool table category images     |
| `assets/pool-table-products/`                 | Pool table product images      |
| `assets/ping-pong-categories/`                | Ping pong category images      |
| `assets/ping-pong-products/`                  | Ping pong product images       |
| `assets/cue-products/`                        | Cue product images             |
| `assets/dartboard-products/`                  | Dartboard product images       |
| `assets/traeger-categories/`                  | Traeger category images        |

### Pool Table Builder (Austin)

- Product: California House Austin Pool Table
- In-stock mode: skips size/finish, starts at cloth selection, then add-ons
- Build-your-table mode: shows all steps
- California House finishes: Maple and Oak (Oak = upgrade, mocked as `+$2,000`)
- Austin renders change by wood finish using images in `assets/california-house-austin-renders/`

### Cloth Options

**Championship Invitational** (included):

| Color              | Hex       |
| ------------------ | --------- |
| Red                | `#B90610` |
| Burgundy           | `#8E1013` |
| Titanium           | `#2E3945` |
| Charcoal           | `#353634` |
| Steel Grey         | `#5D6C60` |
| Black              | `#1A1918` |
| Purple             | `#1A1173` |
| Olive              | `#525132` |
| Taupe              | `#6E582F` |
| Golden             | `#B48824` |
| Khaki              | `#8D7B52` |
| Camel              | `#936B3C` |
| Brown              | `#5A3216` |
| Basic Green        | `#025F65` |
| Championship Green | `#026E4B` |
| Dark Green         | `#04392D` |
| Bottle Green       | `#113028` |
| English Green      | `#035012` |
| Aztec              | `#AB5108` |
| Brick              | `#752F0B` |
| Navy               | `#162133` |
| Wine               | `#48161A` |
| Academy Blue       | `#314A74` |
| Championship Blue  | `#0362B6` |
| Euro Blue          | `#022EA3` |
| Electric Blue      | `#054CBC` |

**Championship Tour Edition** (upgrade, all `+$249`):

Championship Green, Dark Green, Red, Olive, Bottle Green, Electric Blue, Camel, Euro Blue, Navy, Burgundy, Merlot (`#5B1424`), Wine, Steel Grey, Charcoal, Black, Championship Blue, Lilac (`#9B82B8`)

---

## 12. Design Direction

The site should feel **modern, premium, warm, and clean**.

- Minimal product-page layout inspired by modern furniture ecommerce
- Wide product imagery with restrained typography
- The configuration/interactive side should feel like a light floating glass panel, not a hard sidebar box
- Product cards with clean light-grey/off-white image wells, not heavy beige blocks
- Buttons: large, confident, rounded/pill-like — **black primary**, pale outlined secondary
- Lean text. Avoid overexplaining in UI.

### Category Strip (consistent across all categories)

- Horizontal strip near the top
- Image tile with label below
- Active item has a black underline
- "View X items" link beside category title
- Sort select on the right

### Filters (consistent across all categories)

- Use pool tables filter style everywhere
- No grey box around filters
- Include price slider

### Product Cards

- Clean, light image wells, less beige
- Use clean tight crop or multiply/contrast treatment when it helps
- If category strip uses product cutouts instead of lifestyle photos, keep consistent with tight or contained images

---

## 13. Development Principles

Long-term maintainability is equally important as feature development.

**Backend:** Central home for all business rules — product retrieval, validation, quote processing, checkout orchestration, inventory state, fulfillment rules, search preparation. The frontend never duplicates backend logic.

**Frontend:** Renders data, manages UI state, handles form validation, builds responsive layouts, manages user interaction and accessibility. Business decisions always originate from backend responses.

Every new feature should integrate with the existing architecture rather than introducing special-case logic.

---

## 14. Analytics

Events should represent meaningful business actions, not UI clicks (button presses, hovers, etc.).

### Product Events

| Event            | Description                       |
| ---------------- | --------------------------------- |
| Product Viewed   | Customer opens a PDP              |
| Variant Selected | Customer changes a product option |
| Add to Cart      | Product added to cart             |
| Quote Started    | Customer opens quote form         |
| Quote Submitted  | Customer submits a quote          |

### Search Events

| Event               | Description               |
| ------------------- | ------------------------- |
| Search Performed    | Customer searches         |
| Search Result Click | Customer selects a result |
| No Results          | Search returned nothing   |

### Checkout Events

| Event              | Description            |
| ------------------ | ---------------------- |
| Checkout Started   | Stripe session created |
| Checkout Completed | Payment successful     |
| Checkout Failed    | Payment unsuccessful   |

### Service Events

| Event                   | Description                    |
| ----------------------- | ------------------------------ |
| Service Viewed          | Customer visits a service page |
| Service Quote Submitted | Customer requests a service    |

---

## 15. Quality Assurance

### Product Pages

- [ ] Images load correctly
- [ ] Price displayed
- [ ] Variants work
- [ ] CTA correct
- [ ] Breadcrumbs correct
- [ ] Related products displayed
- [ ] SEO metadata generated

### Category Pages

- [ ] Filters work
- [ ] Pagination correct
- [ ] Sorting works
- [ ] Product count correct

### Search

- [ ] Synonyms work
- [ ] Misspellings return results
- [ ] SKU search works
- [ ] Brand search works

### Quote Forms

- [ ] Field validation works
- [ ] Success confirmation shown
- [ ] Database record created
- [ ] Staff notification generated

---

## 16. Security

Customers must never have direct access to: internal IDs, supplier information, administrative endpoints, internal pricing, or inventory adjustments.

The backend must validate every request, every input, and every quote submission. Rate limiting must protect public-facing forms.

Administrative features require authentication and authorization. Future versions will implement role-based permissions.

---

## 17. SEO

### Content Types: Descriptions

Every product has **three distinct description fields**, each with a different purpose and audience:

| Field              | Length                     | Written By           | Purpose                                                      |
| ------------------ | -------------------------- | -------------------- | ------------------------------------------------------------ |
| `shortDescription` | 1–2 sentences (~160 chars) | Copywriter / Rosetta | Product cards, meta description, search snippets, Open Graph |
| `longDescription`  | 3–6 paragraphs             | Copywriter           | PDP body — sells the product, tells the story                |
| `searchTitle`      | 60–70 chars                | SEO / Rosetta        | `<title>` tag, internal search index                         |

**Rules:**

- `shortDescription` must be unique per product. It cannot be a truncated version of `longDescription`.
- `longDescription` should be HTML-safe (supports `<p>`, `<ul>`, `<strong>`). Never rendered outside the PDP.
- `searchTitle` is optimized for keywords, not marketing copy. Example: `"8ft Slate Pool Table | Legacy Oak | Home Billiards"` vs. the display name `"Legacy Oak Pool Table"`.

---

### What Is Exposed Where

This map tells the SEO team exactly which content field appears on each surface.

#### Product Card (PLP / Homepage featured)

| Element           | Source Field                      | Notes                                    |
| ----------------- | --------------------------------- | ---------------------------------------- |
| Product name      | `name`                            | Display name, not SEO-optimized          |
| Brand             | `brand`                           | Plain text                               |
| Price             | `price`                           | Formatted client-side                    |
| Fulfillment badge | `stockStatus` + `fulfillmentType` | e.g. "In Stock", "Special Order"         |
| Short description | `shortDescription`                | Shown below name on hover or below image |
| CTA button        | `cta` (precomputed)               | e.g. "Add to Cart", "Check Installation" |
| Product image     | `images[0]` (primary)             | Served via Cloudinary CDN                |

#### Product Detail Page (PDP)

| Element                     | Source Field                                          | Notes                                        |
| --------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| `<title>`                   | `searchTitle`                                         | SEO-optimized, shown in browser tab and SERP |
| `<meta name="description">` | `shortDescription`                                    | ≤ 160 chars                                  |
| `<link rel="canonical">`    | `slug`                                                | e.g. `/pool-tables/legacy-oak-8ft`           |
| H1 heading                  | `name`                                                | Display name                                 |
| Brand                       | `brand`                                               | Linked to brand PLP filter                   |
| Price                       | `price` + variant `priceAdjustment`                   |                                              |
| Short description           | `shortDescription`                                    | Displayed below H1, above price              |
| Long description            | `longDescription`                                     | Full body section below images               |
| Specs / attributes          | `specifications` (key-value pairs)                    | Rendered in a specs table                    |
| Variants                    | `variants[]`                                          | Size, cloth color, finish, etc.              |
| Fulfillment info            | `fulfillmentType`, `leadTime`, `installationRequired` | Shown near CTA                               |
| CTA button                  | `cta` (precomputed)                                   | Primary action                               |
| Breadcrumbs                 | Category hierarchy                                    | Used in breadcrumb schema                    |
| Open Graph title            | `searchTitle`                                         | Shared on social media                       |
| Open Graph description      | `shortDescription`                                    |                                              |
| Open Graph image            | `images[0]`                                           |                                              |

#### Structured Data (JSON-LD)

| Schema Type                | Page         | Fields Used                                                                     |
| -------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `Product`                  | PDP          | `name`, `brand`, `sku`, `price`, `stockStatus`, `images[0]`, `shortDescription` |
| `BreadcrumbList`           | PDP          | Category hierarchy + `slug`                                                     |
| `Organization`             | All pages    | Business name, address, phone, URL                                              |
| `WebSite` + `SearchAction` | Homepage     | Enables Google sitelinks searchbox                                              |
| `LocalBusiness`            | Contact page | Address, phone, hours                                                           |

#### Search Results Page (internal)

| Element        | Source Field       |
| -------------- | ------------------ |
| Result title   | `searchTitle`      |
| Result snippet | `shortDescription` |
| Result image   | `images[0]`        |
| Brand chip     | `brand`            |
| Category       | `category`         |

#### Category Pages (PLP)

| Element                     | Source Field              | Notes                                       |
| --------------------------- | ------------------------- | ------------------------------------------- | ---------------- |
| `<title>`                   | Category name + site name | e.g. `"Pool Tables                          | Home Billiards"` |
| `<meta name="description">` | Category-level copy       | Managed separately, not from product fields |
| `<link rel="canonical">`    | Category slug             | Handles pagination with `?page=N`           |
| `rel="next"` / `rel="prev"` | Pagination                | For multi-page categories                   |

#### Homepage

| Element                     | Source                              | Notes                                                                |
| --------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `<title>`                   | Static copy                         | e.g. `"Home Billiards — Canada's Destination for Luxury Game Rooms"` |
| `<meta name="description">` | Static copy                         | Written by SEO team                                                  |
| Featured product cards      | `name`, `images[0]`, `price`, `cta` | No description on cards here                                         |

---

### SEO Checklist Per Page Type

#### PDP

- [ ] `<title>` uses `searchTitle` (50–70 chars, includes brand + category keyword)
- [ ] `<meta name="description">` uses `shortDescription` (≤ 160 chars, unique)
- [ ] `<link rel="canonical">` present
- [ ] H1 = product display `name`
- [ ] Open Graph tags present (`og:title`, `og:description`, `og:image`, `og:url`)
- [ ] `Product` JSON-LD present with `offers` (price + availability)
- [ ] `BreadcrumbList` JSON-LD present
- [ ] No duplicate content between `shortDescription` and `longDescription`
- [ ] Images have descriptive `alt` text (not just filename)

#### PLP (Category)

- [ ] `<title>` unique per category
- [ ] `<meta name="description">` category-level, not auto-generated
- [ ] `<link rel="canonical">` handles pagination correctly
- [ ] `rel="next"` / `rel="prev"` for paginated pages
- [ ] H1 = category name
- [ ] Filters do not generate indexable URLs unless intentional

#### Homepage

- [ ] `<title>` includes primary keyword
- [ ] `WebSite` + `SearchAction` JSON-LD for Google sitelinks searchbox
- [ ] `Organization` or `LocalBusiness` JSON-LD

---

### Open Questions for SEO Team

- Who writes `shortDescription` — copywriter, AI-assisted, or Rosetta-generated?
- Who writes `longDescription` — same copywriter for all 10,000 products? Which categories are priority?
- Should paginated PLPs be indexed or `noindex`?
- Should variant pages (e.g. `/pool-tables/austin-maple` vs `/pool-tables/austin-oak`) have independent URLs and canonical tags?
- Should filter combinations (brand + size) generate indexable URLs or be blocked via `noindex`/`robots.txt`?
- Which categories get category-level descriptions first (MVP)?

---

## 18. Deployment

```
Developer → GitHub → CI/CD → Railway → Backend → PostgreSQL / Cloudinary / Stripe
Developer → GitHub → Vercel → Frontend
```

Deployment must be fully automated through GitHub. Manual production deployments should be avoided.

---

## 19. Project Risks

### Business Risks

- Incomplete product data
- Changing vendor catalogs
- Manual operational processes
- Legacy system dependencies

### Technical Risks

- Integration complexity
- Search relevance
- Inventory synchronization
- Performance degradation
- Third-party service outages

The architecture mitigates these risks by separating: product normalization, canonical storage, website behavior, and external integrations. Each layer can change without breaking the others.

---

## 20. Roadmap

### Phase 1 — MVP (Current)

Core architecture, main pages, quote flow, BigCommerce/Stripe integration.

### Phase 2

- Customer accounts
- Wishlists
- Product reviews

### Phase 3

- Advanced configurators
- Appointment scheduling

### Phase 4

- AI-powered search
- Personalized recommendations
- Customer dashboards
- Advanced merchandising

---

## 21. Working Rules

- Desktop-first. Mobile optimization later.
- Keep edits scoped. When the user says "only change X," do exactly that.
- Use local assets whenever possible.
- Only scrape external info when asked or when current data may be stale.
- After changes, state what changed and what was intentionally left alone.
- Prefer visual progress over technical detail.
- The project is not currently a Git repository.
- Local `file://` pages are the normal preview method.
- Product cards on newly built category pages are mock/non-navigating unless a real product page already exists.

---

## 22. Open Decisions

**Product Model**

- Will all pool tables use "Check Installation" as the primary CTA during MVP?
  Olhausen and California , Legacy if we have them in stock will be purshasable, if not will be quote
  Canada Billiard all be quote

**Data Model**

- Should variants receive independent URLs or remain part of the parent product? \*\*\* JORDAN

**Website Behaviour**

- Should services have their own landing pages or live under a single Services section? \*\*\* JORDAN
