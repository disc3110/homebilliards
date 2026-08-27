# Storefront Step 3 — Visual System and Shared Shell

Status: `IMPLEMENTED_FOR_REVIEW`

Owner of final visual approval: Jorge

Visual authority: Shawn's finalized static Demo home page

Taxonomy and content authority: Jordan's approved directory and content specification

## Outcome

The production storefront now has a responsive home page and shared shell that follow the finalized static Demo's visual direction: a compact text wordmark, centred search, two-level navigation, large editorial hero, thin dividers, restrained warm neutrals, image-led departments, a split Austin feature, service and planning cards, a dark design-centre band, and a dark footer.

This step changes only the new frontend and its preview assets. It does not write to BigCommerce, publish catalog data, or modify the Demo.

## Authority order

When the references differ, use this order:

1. Shawn's finalized static Demo controls visual hierarchy, proportion, spacing, and section order.
2. Jordan's directory controls canonical URLs, public labels, parent-child relationships, and navigation visibility.
3. Jordan's content specification controls product and category copy structure, image requirements, title rules, and approval gates.
4. Canonical contracts control price, availability, CTA, option, and publication behavior.

## Implemented shell

- Shared header and footer in `apps/storefront/src/components/layout/`.
- Full desktop mega-menu and native mobile disclosure navigation from `storefrontNavigationFixture`.
- Search submits to the approved `/search` route.
- Contact, cart, brand, category, and collection links use the canonical route registry.
- Resources and Articles remain absent from header, mobile navigation, and footer while Q-007 is open.
- Skip link, visible keyboard focus, labelled navigation, reduced-motion handling, and descriptive image alt text are included.

## Implemented home page

The home page follows the Demo's section sequence:

1. Luxury game-room hero and three primary actions.
2. Delivery, selection, custom, and showroom planning strip.
3. Editorial department mosaic using Jordan's public categories.
4. California House Austin feature and canonical nested product path.
5. Six product cards that exercise the approved storefront behavior contracts.
6. Service cards routed to Contact until service routes and intake behavior are approved.
7. Planning cards that preserve the Demo's editorial rhythm without publishing the deferred Resources hub.
8. Dark design-centre callout and shared footer.

## Product preview boundary

All six product cards use synthetic fixtures from Step 2 and display a `Preview` badge. Their prices, availability, CTAs, copy, and identity mappings are not approved catalog facts.

The local images are used only to validate the visual system. The live adapter must later replace them with approved BigCommerce media and retain Jordan's square-primary presentation, minimum-dimension, filename, and alt-text controls.

No product CTA in this preview performs a cart, quote, delivery, or installation mutation.

## Visual review gate

Jorge's approval should answer these questions before the real BigCommerce vertical slice begins:

- Does the page feel sufficiently close to Shawn's Demo in scale, density, section order, and tone?
- Are the header, hero, department mosaic, Austin feature, product cards, service cards, planning cards, design band, and footer approved as the shared visual direction?
- Is Jordan's full directory usable in both the desktop mega-menu and mobile menu?
- Are the six product-card states visually distinct enough without making the storefront feel inconsistent?
- Is the `Preview` treatment sufficient to prevent synthetic data from being mistaken for approved catalog data?

Approval of this gate does not approve product facts, prices, images, inventory, options, services, or resources for publication.

## Validation evidence

Validated locally on August 26, 2026:

- Production build completed successfully with Next.js 16.2.12 and Node 24.
- TypeScript route generation and storefront typecheck passed.
- Desktop review completed at 1280 × 720.
- Mobile review completed at 390 × 844.
- Mobile document width matched the 390 px viewport with no horizontal overflow.
- All 20 rendered images had non-empty alt text.
- Billiards exposed 12 approved child links, plus the mobile `Shop all Billiards` link.
- Resources had zero public navigation links.
- Browser console returned no warnings or errors.

Run the implementation checks with:

```bash
env PATH=/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin npm run typecheck --workspace @home-billiards/storefront
env PATH=/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin npm run build --workspace @home-billiards/storefront
npm run validate:storefront-plan
```
