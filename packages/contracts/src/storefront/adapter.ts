import { z } from "zod";

import {
  CanonicalPathSchema,
  type CatalogLeaf,
  type StorefrontNavigation,
} from "./navigation";
import {
  CategoryPageSchema,
  ProductCardSchema,
  type ProductDetail,
} from "./product";

export const ProductSortSchema = z.enum([
  "FEATURED",
  "NEWEST",
  "PRICE_ASC",
  "PRICE_DESC",
  "NAME_ASC",
]);

export type ProductSort = z.infer<typeof ProductSortSchema>;

export const ProductListQuerySchema = z.object({
  categoryPath: CanonicalPathSchema,
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  sort: ProductSortSchema,
  filters: z.record(z.string(), z.array(z.string().min(1))),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export const ProductCollectionSchema = z
  .object({
    categoryPath: CanonicalPathSchema,
    category: CategoryPageSchema,
    items: z.array(ProductCardSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .superRefine((collection, context) => {
    if (collection.categoryPath !== collection.category.path) {
      context.addIssue({
        code: "custom",
        message: "Collection and category paths must match",
        path: ["categoryPath"],
      });
    }
  });

export type ProductCollection = z.infer<typeof ProductCollectionSchema>;

export const CatalogLeafLookupSchema = z.object({
  categoryPath: CanonicalPathSchema.refine((path) => path !== "/"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export type CatalogLeafLookup = z.infer<typeof CatalogLeafLookupSchema>;

/**
 * Backend boundary for catalog sources. BigCommerce-specific response shapes stay
 * behind an implementation of this interface and never reach the storefront.
 */
export interface StorefrontCatalogAdapter {
  getNavigation(): Promise<StorefrontNavigation>;
  listProducts(query: ProductListQuery): Promise<ProductCollection>;
  resolveLeaf(lookup: CatalogLeafLookup): Promise<CatalogLeaf | null>;
  getProductByPath(canonicalPath: string): Promise<ProductDetail | null>;
}
