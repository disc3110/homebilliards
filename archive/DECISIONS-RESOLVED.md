# Home Billiards — Resolved Decisions (Record)

**Archived:** 2026-07-08 · Decisions made by Jorge/Diego.  
All of these are already reflected in [DOCUMENTATION.md](../DOCUMENTATION.md), which is the living reference. This file is the historical record only.

| # | Decision | Resolution |
|---|---|---|
| A1 | Product data source for MVP | **BigCommerce-first.** The existing BigCommerce store (already running with products) is the catalog source. Rosetta is out of scope for the website — it's a separate tool that will feed the database later. *Note (Jorge): "No necesito que pienses tanto en Rosetta, porque Rosetta solo va a ser una herramienta aparte para meter cosas a la base de datos, pero no necesitamos tomarla tanto en cuenta para la página."* |
| A2 | Backend stack | **Two separate apps: Next.js (frontend) + NestJS (backend/BFF)** for better scalability. NestJS on Railway, Next.js on Vercel. |
| A3 | Search engine | **Algolia.** |
| A4 | CTA computation | **Backend precomputes `cta`.** Frontend renders it without deriving logic (per ADR-003). |
| B1 | MVP sitemap | Approved with changes: **Foosball, Games, and Shuffleboard in from the beginning** (with `foosball/[slug]` and `games/[slug]` routes). **Commercial = simple landing + quote form.** **No blog/resources.** |
| B2 | Quote workflow | Store every quote in the database + formatted email notification to staff. Auto-reply to customer from `info@homebilliards.ca`. One shared form with `serviceType`/`productRef`. SLA message: "We'll get back to you within 3 business days" (wording to confirm with Shawn). |
| B3 | Analytics | **GA4 + PostHog free tier.** All events through one internal `track()` helper. |
| B4 | Content production | Keep and update the existing BigCommerce products. Descriptions: AI-assisted with human review — Rosetta generates descriptions/info, humans review and paste in. Jordan has override capability on `searchTitle` / `shortDescription`. |
| C1 | Grills product type | Stay under Furniture Product. |
| C2 | Pool table CTA | All pool tables use "Check Installation" in MVP. |
| C3 | Service quote workflow | One shared workflow; `serviceType` field distinguishes. |
| C4 | Image roles | `{ url, role, alt }` with roles: `hero`, `gallery`, `swatch`, `lifestyle`. |
| C5 | Search metadata editable | Yes — manual edits win, never overwritten by re-syncs. |
| C6 | Product comparison | Not in MVP; phase 2+. |
| C7 | Postal code check on PDP | Yes — lightweight "check installation availability" input on pool table PDPs, feeds the quote form. |
| C8 | Service pages | `/services` landing + individual page per service. |
| C11 | Inventory sync | Manual for now. Not a website concern for MVP. |
| C12 | Webhooks | MVP needs only Stripe payment webhooks + BigCommerce order webhooks. |
| C13 | BigCommerce long-term | Treat as replaceable; all BigCommerce-specific code stays behind the canonical schema mapping. |
| C14 | Financing | **No financing.** Promotions and shipping rules moved to Shawn's pending list. |

## Facts confirmed at the same time

| Fact | Value |
|---|---|
| Production domain | `homebilliards.ca` |
| Current site | BigCommerce storefront already live with products loaded |
| Store hours | Mon–Fri 9:00–17:00, Sat 10:00–16:00 |
| Social media | Instagram — to be added later |
| Brand assets | Available from Shawn |
| Shawn | Company manager; makes the business decisions |
| Jordan | SEO |
| Stripe | Existing account; Shawn provides credentials |
| Cloudinary | Existing account |
| DMI | Dismantle, Move and Install |
