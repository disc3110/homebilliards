# Open Decisions — Meeting Doc for Shawn & Jordan

**For:** Shawn, Jordan, and implementation planning · **Prepared by:** Diego
Everything already decided lives in [DOCUMENTATION.md](DOCUMENTATION.md). This doc is only what's still open. Each one says why we're asking and what we suggest. Write your answer right below each question; short answers are fine.

---

## Decision Checklist

This table is the operating checklist. The detailed question and recommendation for each ID appear below. A decision is complete only after the answer has been recorded here and moved into `DOCUMENTATION.md`, `SEO_SPEC.md`, or `FEED_SPEC.md` as appropriate.

| Done | ID  | Owner                | Priority | Needed before                        | Decision                                     |
| ---- | --- | -------------------- | -------- | ------------------------------------ | -------------------------------------------- |
| [ ]  | S1  | Shawn                | High     | Fulfillment UI, feed shipping fields | Customer-facing shipping policy              |
| [ ]  | S2  | Shawn                | Medium   | Sale page and promotion QA           | Launch sale/promotion behavior               |
| [ ]  | S3  | Shawn                | High     | Quote workflow implementation        | Notification recipients and response promise |
| [ ]  | S4  | Shawn                | High     | Visual implementation sign-off       | Production logo and brand assets             |
| [ ]  | J1  | Jordan               | Medium   | Technical SEO implementation         | Pagination indexing                          |
| [ ]  | J2  | Jordan               | High     | PLP URL and filter implementation    | Filtered URL indexing                        |
| [ ]  | J3  | Jordan               | High     | PDP routing and canonical rules      | Variant URL strategy                         |
| [ ]  | J4  | Jordan               | Critical | Production launch                    | Legacy URL redirect map                      |
| [ ]  | J5  | Jordan               | Medium   | Product metadata generation          | Product title template                       |
| [ ]  | J6  | Jordan               | Medium   | Category content population          | Category metadata ownership and priority     |
| [ ]  | J7  | Jordan               | High     | Analytics implementation and launch  | GA4 and Search Console status                |
| [ ]  | J8  | Jordan               | Low      | Category SEO content refinement      | Target keywords by category                  |
| [ ]  | F1  | Shawn + Jordan       | High     | Launch scope freeze                  | Feedonomics/GMC launch timing                |
| [ ]  | F2  | Jordan + Engineering | High     | Feed integration implementation      | Feedonomics source model                     |
| [ ]  | F3  | Shawn + Jordan       | Medium   | Feed population and QA               | GTIN/MPN sourcing ownership                  |
| [ ]  | F4  | Shawn + Jordan       | Medium   | PDP/review scope freeze              | Reviews at launch or fast-follow             |
| [ ]  | F5  | Shawn + Jordan       | Low      | Local inventory phase                | Local inventory feed timing                  |

**Does not block the first scaffold:** S1-S4, J1-J8, and F1-F5 can proceed in parallel while Engineering creates the three applications and shared contracts.

---

## For Shawn

### S1. What do we tell customers about shipping?

When someone looks at a product, what should the site say about shipping? For small stuff (chalk, balls, cues) — is it flat rate, free over a certain amount, or something else? For big items (tables, grills) we're planning to show "delivery quoted for large items."

We just need the real policy in a couple of sentences — we'll turn it into the right wording on the site.

> **Your answer:**

---

### S2. Will the site launch with any sales or promotions?

The new site has a "Sale" page (same as the current site's nav). Should it simply show whatever products are marked down in BigCommerce, or do you want anything more (banners, seasonal promos, bundles)?

**Our suggestion:** keep it simple — the Sale page just shows products that have sale pricing in BigCommerce. Anything fancier can come later.

> **Your answer:**

---

### S3. Quote requests — who gets them, and what do we promise?

When a customer asks for a quote (pool table, installation, moving, etc.), the site will email the team. Two questions:

1. **Which email address(es) should receive those notifications?** (We assume info@homebilliards.ca — anyone else?)
2. The customer will see a message like **"We'll get back to you within 3 business days."** Is 3 days right? Can the team keep that promise?

> **Your answer:**

---

### S4. Brand assets

We need the logo source files (ideally SVG/vector) and anything else you have — brand colors, fonts, old design files. Whatever exists is helpful, even if it's just the logo.

> **Where can we get them:**

---

## For Jordan

### J1. Category pages with many pages — what gets indexed?

Categories like Pool Tables will have more products than fit on one page (page 1, page 2, page 3…). Should Google index all pages, or only page 1?

**Our suggestion:** index page 1 only; mark the rest "noindex, follow" so Google still discovers the products but doesn't rank thin pages.

> **Your answer:**

---

### J2. Filtered URLs — indexed or not?

When a customer filters (e.g. brand = Olhausen + size = 8ft), the URL changes. Should those filtered URLs be indexable, or blocked?

**Our suggestion:** block them by default, and instead hand-pick a few high-demand combinations (like a dedicated Olhausen page) as real, curated landing pages. You'd tell us which ones are worth it.

> **Your answer:**

---

### J3. Product variants — one URL or many?

A pool table can come in Oak or Maple. Should each version have its own URL (`/austin-oak`, `/austin-maple`), or one product URL where the customer picks the finish on the page?

**Our suggestion:** one URL per product, options selected on the page (this is how the demo already works). Separate URLs only if you find real search demand for specific variants.

> **Your answer:**

---

### J4. Redirect map from the old site ⚠️ Most important item

The current homebilliards.ca has pages that Google already ranks. The new site will have different URLs. If we launch without redirecting old URLs to new ones, **those rankings are lost**.

**What we need from you:**

1. A list of the URLs that currently get traffic / rank (from Search Console or a crawl)
2. Together we map each old URL → new URL before launch

This doesn't block development, but launch cannot happen without it.

> **Status / plan:**

---

### J5. Page title format for products

We'll auto-generate product page titles with a template so 10,000 products don't need hand-written titles. Proposed format:

`{Product Name} | {Brand} | {Category keyword}` — e.g. _"Legacy Oak Pool Table | Legacy | 8ft Slate Pool Tables"_

You'll be able to override any product's title by hand, and your edits never get overwritten. Good format, or do you want it different?

> **Your answer:**

---

### J6. Category meta descriptions and category copy

Who writes the category-level meta descriptions and short PLP intro copy, and in what order should categories be prioritized?

The new category map includes Billiards, Ping Pong, BBQ & Cooking, Foosball, Darts, Air Hockey, Other Games, and Furniture. We need enough category copy for unique PLP titles/descriptions and future FAQ/content blocks.

> **Your answer:**

---

### J7. Google Analytics & Search Console — do they exist?

Is there already a GA4 property and Search Console verification for homebilliards.ca? If yes, we'll reuse them (keeps the history — and we need Search Console for J4). If not, we'll create them.

> **Status:**

---

### J8. Target keyword per category _(nice to have)_

One line per category — the main search phrase each page should aim for (e.g. Pool Tables → "pool tables vancouver"). Helps us write headings and titles that match. Can be delivered bit by bit, no rush.

> **Your answer:**

---

## Joint / Feed Decisions

### F1. Feedonomics + Google Merchant Center launch scope

Will Google Shopping/free listings launch at the same time as the new site, or after the storefront is live?

**Our suggestion:** make the product schema Feedonomics-ready during MVP, but treat live GMC feed launch as a launch checklist item only if the required accounts, Feedonomics setup, and feed QA are ready.

> **Your answer:**

---

### F2. Feedonomics data source

Should Feedonomics read BigCommerce directly, a NestJS export, or a hybrid feed?

**Our suggestion:** hybrid. Let Feedonomics read checkout-sensitive commerce data from BigCommerce, and merge a NestJS enrichment/override export for canonical URLs, SEO/feed overrides, product type paths, specs, and custom labels.

> **Your answer:**

---

### F3. Product identifiers: GTIN and MPN sourcing

Who will collect manufacturer GTINs and MPNs from suppliers, and which product groups should be prioritized first?

**Our suggestion:** start with Traeger, cues/darts/accessories that likely have manufacturer identifiers, then high-value tables where suppliers can provide reliable MPNs. Never fabricate GTINs or MPNs.

> **Owner / plan:**

---

### F4. Reviews at launch or schema-ready only

Jordan's feed/SEO planning doc recommends the review collection system being ready at launch, but reviews add operational and engineering scope.

**Our suggestion:** reserve review fields and implement valid conditional JSON-LD in MVP. Launch review collection as a fast-follow unless Shawn/Jordan confirm reviews are a launch requirement.

> **Your answer:**

---

### F5. Local inventory feed timing

Should Home Billiards pursue Google local inventory listings ("in stock / on display in Vancouver") at launch or after launch?

**Our suggestion:** fast-follow after launch. It depends on Google Business Profile, Merchant Center linkage, a confirmed `store_code`, and reliable showroom stock data.

> **Your answer:**
