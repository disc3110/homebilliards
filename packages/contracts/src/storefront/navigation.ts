import { z } from "zod";

export const CanonicalPathSchema = z
  .string()
  .regex(
    /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/,
    "Expected a lowercase kebab-case path without a trailing slash",
  );

export type CanonicalPath = z.infer<typeof CanonicalPathSchema>;

export const NavigationPageTypeSchema = z.enum([
  "HOME",
  "CATEGORY_HUB",
  "PRODUCT_LIST",
  "COLLECTION",
  "BRAND_INDEX",
  "EDITORIAL_HUB",
  "EDITORIAL_LIST",
  "UTILITY",
]);

export type NavigationPageType = z.infer<typeof NavigationPageTypeSchema>;

export const NavigationPlacementSchema = z.enum([
  "HEADER",
  "MEGA_MENU",
  "UTILITY",
  "FOOTER",
]);

export type NavigationPlacement = z.infer<typeof NavigationPlacementSchema>;

export const NavigationVisibilitySchema = z.enum(["VISIBLE", "HIDDEN"]);

export type NavigationVisibility = z.infer<typeof NavigationVisibilitySchema>;

export const NavigationNodeSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
  parentId: z.string().nullable(),
  label: z.string().min(1),
  path: CanonicalPathSchema,
  pageType: NavigationPageTypeSchema,
  placement: NavigationPlacementSchema,
  sortOrder: z.number().int().nonnegative(),
  visibility: NavigationVisibilitySchema,
});

export type NavigationNode = z.infer<typeof NavigationNodeSchema>;

export const StorefrontNavigationSchema = z
  .object({
    version: z.string().min(1),
    nodes: z.array(NavigationNodeSchema),
  })
  .superRefine(({ nodes }, context) => {
    const ids = new Set<string>();
    const paths = new Set<string>();

    for (const [index, node] of nodes.entries()) {
      if (ids.has(node.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate navigation id: ${node.id}`,
          path: ["nodes", index, "id"],
        });
      }

      if (paths.has(node.path)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate navigation path: ${node.path}`,
          path: ["nodes", index, "path"],
        });
      }

      ids.add(node.id);
      paths.add(node.path);
    }

    for (const [index, node] of nodes.entries()) {
      if (node.parentId !== null && !ids.has(node.parentId)) {
        context.addIssue({
          code: "custom",
          message: `Unknown navigation parent: ${node.parentId}`,
          path: ["nodes", index, "parentId"],
        });
      }
    }
  });

export type StorefrontNavigation = z.infer<typeof StorefrontNavigationSchema>;

export const CatalogLeafKindSchema = z.enum([
  "PRODUCT",
  "CURATED_CATEGORY",
  "BRAND_CATEGORY",
]);

export type CatalogLeafKind = z.infer<typeof CatalogLeafKindSchema>;

export const CatalogLeafSchema = z
  .object({
    categoryPath: CanonicalPathSchema.refine((path) => path !== "/"),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    kind: CatalogLeafKindSchema,
    canonicalPath: CanonicalPathSchema,
    resourceId: z.string().min(1),
  })
  .superRefine((leaf, context) => {
    if (leaf.canonicalPath !== `${leaf.categoryPath}/${leaf.slug}`) {
      context.addIssue({
        code: "custom",
        message: "canonicalPath must equal categoryPath plus slug",
        path: ["canonicalPath"],
      });
    }
  });

export type CatalogLeaf = z.infer<typeof CatalogLeafSchema>;

export const CatalogLeafRegistrySchema = z
  .array(CatalogLeafSchema)
  .superRefine((leaves, context) => {
    const keys = new Set<string>();

    for (const [index, leaf] of leaves.entries()) {
      const key = `${leaf.categoryPath}:${leaf.slug}`;

      if (keys.has(key)) {
        context.addIssue({
          code: "custom",
          message: `Catalog leaf collision: ${key}`,
          path: [index, "slug"],
        });
      }

      keys.add(key);
    }
  });

export type CatalogLeafRegistry = z.infer<typeof CatalogLeafRegistrySchema>;
