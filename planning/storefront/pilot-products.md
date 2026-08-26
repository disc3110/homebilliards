# Pilot Product Candidates

Status: `CANDIDATES_PENDING_CATALOG_OWNER_APPROVAL`

The pilot should cover different buying behaviors, not simply the most popular categories. IDs below were observed in the read-only BigCommerce audit or detailed sample. Final inclusion requires confirmation that the product will survive catalog cleanup.

## Recommended candidates

| Journey | Candidate | BigCommerce product ID | Why it is useful | Approval status |
| --- | --- | ---: | --- | --- |
| Install-required pool table | Olhausen Canadiana Pool Table | 119 | Real pool-table parent with structured custom fields in the audit sample | Pending |
| Quote-only pool table | Olhausen Custom Augusta Pool Table | 1161 | Exercises hidden/zero price and Request Quote behavior | Pending |
| Configurable showcase | Austin Pool Table | TBD | Matches the demo builder and validates size, finish, cloth, and add-on composition | Live product mapping required |
| Furniture / delivery | Whistler Indoor Table Tennis Table | 125 | Matches an existing demo PDP and tests delivery-oriented furniture behavior | Pending |
| Specification SKU | Harrows Voodoo Brass Dart | 141 | Tests technical specifications and option display without furniture logic | Pending |
| Furniture product | Tornado T-3000 Tournament Foosball Table | 130 | Tests product highlights, commercial/home usage, and availability | Pending |
| BBQ product | Traeger Pro Series 575 Wood Pellet Grill | 198 | Rich custom-field sample for specifications and standard commerce | Pending |
| Standard accessory | Traeger Cherry Hardwood Pellets | 203 | Candidate for a simple Add to Cart path | Price, stock, and final category must be verified |

## Required approval for each candidate

- Product remains after cleanup.
- Parent product ID remains stable.
- Canonical category and URL are approved.
- Price mode is correct.
- Inventory/availability behavior is understood.
- Primary image is approved.
- Options are classified correctly.
- Existing legacy URL is captured.

## Minimum final pilot set

1. One install-required product.
2. One quote-only or price-hidden product.
3. One configurable product.
4. One furniture/delivery product.
5. One specification-driven product.
6. One simple Add to Cart product.

The final set does not need to use every candidate above. Catalog stability is more important than preserving a specific candidate.
