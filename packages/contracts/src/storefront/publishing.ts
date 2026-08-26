import { z } from "zod";

import { ProductDetailSchema } from "./product";

export const ProductArchetypeSchema = z.enum([
  "SIMPLE_ACCESSORY",
  "SPECIFICATION_SKU",
  "FURNITURE_DELIVERY",
  "INSTALL_REQUIRED",
  "QUOTE_ONLY",
  "CONFIGURABLE_PARENT",
]);

export type ProductArchetype = z.infer<typeof ProductArchetypeSchema>;

export const PublicationStageSchema = z.enum([
  "DRAFT",
  "IN_REVIEW",
  "READY",
  "PUBLISHED",
  "PAUSED",
  "RETIRED",
]);

export type PublicationStage = z.infer<typeof PublicationStageSchema>;

export const PublishingGateNameSchema = z.enum([
  "CATALOG_IDENTITY",
  "ROUTING",
  "CONTENT",
  "MEDIA",
  "COMMERCE",
  "OPTIONS",
  "SEO",
  "BUSINESS_REVIEW",
]);

export type PublishingGateName = z.infer<typeof PublishingGateNameSchema>;

export const PublishingGateStateSchema = z.enum([
  "PENDING",
  "IN_REVIEW",
  "APPROVED",
  "BLOCKED",
  "NOT_REQUIRED",
]);

export type PublishingGateState = z.infer<typeof PublishingGateStateSchema>;

export const PublishingGateCheckSchema = z.object({
  gate: PublishingGateNameSchema,
  state: PublishingGateStateSchema,
  note: z.string().min(1).nullable(),
});

export type PublishingGateCheck = z.infer<typeof PublishingGateCheckSchema>;

export const PublishingGateSchema = z
  .object({
    stage: PublicationStageSchema,
    checks: z.array(PublishingGateCheckSchema).length(8),
    blockers: z.array(z.string().min(1)),
  })
  .superRefine((publishing, context) => {
    const gateNames = new Set(publishing.checks.map(({ gate }) => gate));

    if (gateNames.size !== publishing.checks.length) {
      context.addIssue({
        code: "custom",
        message: "Each publishing gate must appear exactly once",
        path: ["checks"],
      });
    }

    if (["READY", "PUBLISHED"].includes(publishing.stage)) {
      for (const [index, check] of publishing.checks.entries()) {
        if (!["APPROVED", "NOT_REQUIRED"].includes(check.state)) {
          context.addIssue({
            code: "custom",
            message: `${publishing.stage} requires every gate to be approved`,
            path: ["checks", index, "state"],
          });
        }
      }

      if (publishing.blockers.length > 0) {
        context.addIssue({
          code: "custom",
          message: `${publishing.stage} cannot contain blockers`,
          path: ["blockers"],
        });
      }
    }
  });

export type PublishingGate = z.infer<typeof PublishingGateSchema>;

export const ProductFixtureSchema = z.object({
  fixtureId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  archetype: ProductArchetypeSchema,
  purpose: z.string().min(1),
  disclaimer: z.string().min(1),
  publishing: PublishingGateSchema,
  product: ProductDetailSchema,
});

export type ProductFixture = z.infer<typeof ProductFixtureSchema>;

export const ProductFixtureCatalogSchema = z
  .array(ProductFixtureSchema)
  .superRefine((fixtures, context) => {
    const ids = new Set<string>();
    const archetypes = new Set<string>();

    for (const [index, fixture] of fixtures.entries()) {
      if (ids.has(fixture.fixtureId)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate fixture id: ${fixture.fixtureId}`,
          path: [index, "fixtureId"],
        });
      }

      if (archetypes.has(fixture.archetype)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate fixture archetype: ${fixture.archetype}`,
          path: [index, "archetype"],
        });
      }

      ids.add(fixture.fixtureId);
      archetypes.add(fixture.archetype);
    }
  });

export type ProductFixtureCatalog = z.infer<typeof ProductFixtureCatalogSchema>;
