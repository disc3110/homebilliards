# Storefront Step 1 Control Pack

Status: `DRAFT_FOR_APPROVAL`

Owner of final approvals: Jorge

Business and SEO authority: Shawn and Jordan, as applicable

Implementation owner: Codex, under Jorge's approval gates

## Purpose

This directory turns Jordan's navigation directory and the August 2026 Content Template Specification into an executable storefront plan. It does not change the production storefront, the current BigCommerce category tree, or any catalog record.

Jordan's directory is the authority for the intended public taxonomy. BigCommerce remains the source of commerce data, but its current category names and URLs do not define the new public URL structure.

## Files

- `url-registry.csv`: master inventory of public routes and route patterns.
- `bigcommerce-category-mapping.csv`: proposed mapping from the current BigCommerce tree to the new routes.
- `redirect-map.csv`: preliminary legacy-category redirect inventory.
- `content-template-matrix.csv`: V1 and V2 content-generation rules.
- `launch-scope.md`: proposed pilot, V1, and later rollout boundaries.
- `pilot-products.md`: representative products and journeys for the first vertical slice.
- `decision-log.md`: locked directions, proposals, and approvals still required.

## Control model

Each phase has one approval gate:

1. URL and content contract.
2. Visual system and shared shell.
3. Real BigCommerce vertical slice.
4. Commerce and lead flows.
5. Launch readiness.

Codex prepares the work, validation evidence, and a concise change summary. Jorge approves or rejects the gate before the next phase begins.

## Step 1 completion criteria

Step 1 is structurally complete when:

- Every entry in Jordan's directory has a route record.
- Every route has a page type, parent, navigation placement, indexability state, content shape, and launch phase.
- Every current BigCommerce category is mapped, explicitly deferred, or marked for a business decision.
- Every known current category URL has a redirect decision or an explicit `TBD` destination.
- Product, brand, collection, and editorial route patterns are recorded.
- C1, C2, and C3 page behavior is separated.
- V1 and V2 content requirements are separated.
- Structural validation passes.
- Jorge approves the open URL decisions in `decision-log.md`.

## Validation

Run:

```bash
npm run validate:storefront-plan
```

The validator checks duplicate route IDs, duplicate canonical paths, missing parents, unknown mapping targets, duplicate legacy paths, and invalid redirect targets. Pending approvals are reported but do not fail structural validation.

## Important boundaries

- No BigCommerce categories or products are changed in Step 1.
- No storefront routes are implemented in Step 1.
- Existing SKUs are not re-keyed.
- Filter combinations do not become indexable routes automatically.
- FAQ content and FAQPage schema remain V2.
- Empty categories are not published or indexed until their launch behavior is approved.
