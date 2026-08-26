import { z } from "zod";

import { CanonicalPathSchema } from "./navigation";

export const ProductTypeSchema = z.enum([
  "STANDARD_SKU",
  "SPECIFICATION_SKU",
  "FURNITURE_PRODUCT",
  "INSTALL_REQUIRED",
  "SERVICE",
]);

export type ProductType = z.infer<typeof ProductTypeSchema>;

export const PriceModeSchema = z.enum([
  "DISPLAY_PRICE",
  "REQUEST_QUOTE",
  "CALL_FOR_PRICE",
  "IN_STORE_ONLY",
  "UNAVAILABLE",
]);

export type PriceMode = z.infer<typeof PriceModeSchema>;

export const AvailabilityStatusSchema = z.enum([
  "IN_STOCK",
  "LOW_STOCK",
  "SUPPLIER_AVAILABLE",
  "SPECIAL_ORDER",
  "CUSTOM_ORDER",
  "QUOTE_REQUIRED",
  "OUT_OF_STOCK",
  "DISCONTINUED",
  "UNKNOWN",
]);

export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>;

export const CtaKindSchema = z.enum([
  "ADD_TO_CART",
  "NOTIFY_ME",
  "CHECK_DELIVERY",
  "CHECK_INSTALLATION",
  "REQUEST_QUOTE",
  "CALL_STORE",
  "VISIT_SHOWROOM",
  "REQUEST_SERVICE_QUOTE",
  "UNAVAILABLE",
]);

export type CtaKind = z.infer<typeof CtaKindSchema>;

export const CtaActionSchema = z.enum([
  "CART",
  "FORM",
  "LINK",
  "PHONE",
  "NONE",
]);

export type CtaAction = z.infer<typeof CtaActionSchema>;

export const OptionTypeSchema = z.enum([
  "VARIANT",
  "MODIFIER",
  "ADD_ON",
  "QUOTE_SELECTION",
  "INFORMATIONAL",
]);

export type OptionType = z.infer<typeof OptionTypeSchema>;

export const MoneySchema = z.object({
  amount: z.number().finite().nonnegative(),
  currency: z.string().length(3).toUpperCase(),
});

export type Money = z.infer<typeof MoneySchema>;

export const ProductPriceSchema = z
  .object({
    mode: PriceModeSchema,
    current: MoneySchema.nullable(),
    compareAt: MoneySchema.nullable(),
    label: z.string().min(1).nullable(),
  })
  .superRefine((price, context) => {
    if (price.mode === "DISPLAY_PRICE" && price.current === null) {
      context.addIssue({
        code: "custom",
        message: "DISPLAY_PRICE requires a current price",
        path: ["current"],
      });
    }

    if (
      ["REQUEST_QUOTE", "CALL_FOR_PRICE", "UNAVAILABLE"].includes(price.mode) &&
      (price.current !== null || price.compareAt !== null)
    ) {
      context.addIssue({
        code: "custom",
        message: `${price.mode} cannot expose a numeric price`,
        path: ["current"],
      });
    }
  });

export type ProductPrice = z.infer<typeof ProductPriceSchema>;

export const ProductAvailabilitySchema = z.object({
  status: AvailabilityStatusSchema,
  label: z.string().min(1),
  detail: z.string().min(1).nullable(),
  purchasable: z.boolean(),
});

export type ProductAvailability = z.infer<typeof ProductAvailabilitySchema>;

export const ProductCtaSchema = z.object({
  kind: CtaKindSchema,
  label: z.string().min(1),
  action: CtaActionSchema,
  target: z.string().min(1).nullable(),
  disabled: z.boolean(),
});

export type ProductCta = z.infer<typeof ProductCtaSchema>;

export const ProductImageSchema = z.object({
  id: z.string().min(1),
  url: z.url(),
  filename: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+$/),
  alt: z.string().min(1).max(125),
  role: z.enum(["PRIMARY", "GALLERY", "DETAIL", "LIFESTYLE", "SWATCH"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type ProductImage = z.infer<typeof ProductImageSchema>;

export const ProductCardSchema = z.object({
  id: z.string().min(1),
  source: z.enum(["BIGCOMMERCE", "FIXTURE"]),
  sourceProductId: z.number().int().positive().nullable(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  canonicalPath: CanonicalPathSchema,
  productType: ProductTypeSchema,
  brand: z.string().min(1).nullable(),
  name: z.string().min(1).max(150),
  primaryImage: ProductImageSchema,
  badges: z.array(z.string().min(1)).max(4),
  price: ProductPriceSchema,
  availability: ProductAvailabilitySchema,
  cta: ProductCtaSchema,
});

export type ProductCard = z.infer<typeof ProductCardSchema>;

export const ProductContentSchema = z.object({
  name: z.string().min(1).max(150),
  searchTitle: z.string().min(1).max(150),
  feedTitle: z.string().min(1).max(150),
  shortDescription: z.string().min(1).max(500),
  longDescriptionHtml: z.string().min(1),
  highlights: z.array(z.string().min(1)).min(2).max(10),
});

export type ProductContent = z.infer<typeof ProductContentSchema>;

export const ProductOptionValueSchema = z.object({
  id: z.string().min(1),
  sourceEntityId: z.number().int().positive().nullable(),
  label: z.string().min(1),
  available: z.boolean(),
  selectedByDefault: z.boolean(),
  priceAdjustment: z
    .object({
      amount: z.number().finite(),
      currency: z.string().length(3).toUpperCase(),
    })
    .nullable(),
  swatch: z
    .object({
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .nullable(),
      imageUrl: z.url().nullable(),
    })
    .nullable(),
});

export type ProductOptionValue = z.infer<typeof ProductOptionValueSchema>;

export const ProductOptionSchema = z
  .object({
    id: z.string().min(1),
    sourceEntityId: z.number().int().positive().nullable(),
    label: z.string().min(1),
    type: OptionTypeSchema,
    control: z.enum([
      "BUTTONS",
      "SELECT",
      "RADIO",
      "CHECKBOX",
      "SWATCH",
      "INFORMATION",
    ]),
    required: z.boolean(),
    minSelections: z.number().int().nonnegative(),
    maxSelections: z.number().int().positive(),
    values: z.array(ProductOptionValueSchema).min(1),
  })
  .superRefine((option, context) => {
    if (option.minSelections > option.maxSelections) {
      context.addIssue({
        code: "custom",
        message: "minSelections cannot exceed maxSelections",
        path: ["minSelections"],
      });
    }

    if (
      option.type === "INFORMATIONAL" &&
      (option.control !== "INFORMATION" || option.required)
    ) {
      context.addIssue({
        code: "custom",
        message: "INFORMATIONAL options must be non-required information",
        path: ["type"],
      });
    }

    if (option.type !== "INFORMATIONAL" && option.control === "INFORMATION") {
      context.addIssue({
        code: "custom",
        message: "Only INFORMATIONAL options may use INFORMATION control",
        path: ["control"],
      });
    }
  });

export type ProductOption = z.infer<typeof ProductOptionSchema>;

export const SelectedOptionSchema = z.object({
  optionId: z.string().min(1),
  valueId: z.string().min(1),
});

export type SelectedOption = z.infer<typeof SelectedOptionSchema>;

export const ProductVariantSchema = z.object({
  id: z.string().min(1),
  sourceEntityId: z.number().int().positive().nullable(),
  sku: z.string().min(1).max(50).nullable(),
  selectedOptions: z.array(SelectedOptionSchema).min(1),
  price: MoneySchema.nullable(),
  availability: ProductAvailabilitySchema,
  purchasable: z.boolean(),
});

export type ProductVariant = z.infer<typeof ProductVariantSchema>;

export const ProductSpecificationSchema = z.object({
  section: z.string().min(1),
  name: z.string().min(1),
  value: z.string().min(1),
});

export type ProductSpecification = z.infer<typeof ProductSpecificationSchema>;

export const ProductCategorySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  path: CanonicalPathSchema,
  breadcrumbs: z
    .array(
      z.object({
        label: z.string().min(1),
        path: CanonicalPathSchema,
      }),
    )
    .min(1),
});

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const CategoryContentShapeSchema = z.enum(["C1", "C2", "C3"]);

export type CategoryContentShape = z.infer<typeof CategoryContentShapeSchema>;

export const CategoryPageSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    path: CanonicalPathSchema,
    parentPath: CanonicalPathSchema.nullable(),
    contentShape: CategoryContentShapeSchema,
    title: z.string().min(1).max(150),
    description: z.string().min(1).max(500),
    editorialHtml: z.string().min(1).nullable(),
    seo: z.object({
      metaTitle: z.string().min(1).max(70),
      metaDescription: z.string().min(1).max(170),
      canonicalPath: CanonicalPathSchema,
    }),
  })
  .superRefine((category, context) => {
    if (category.seo.canonicalPath !== category.path) {
      context.addIssue({
        code: "custom",
        message: "SEO canonical path must match the category path",
        path: ["seo", "canonicalPath"],
      });
    }

    if (category.contentShape === "C1" && category.title !== category.label) {
      context.addIssue({
        code: "custom",
        message: "C1 category title must match its approved label",
        path: ["title"],
      });
    }
  });

export type CategoryPage = z.infer<typeof CategoryPageSchema>;

export const ProductFulfillmentSchema = z.object({
  deliveryRequired: z.boolean(),
  installationRequired: z.boolean(),
  quoteRequired: z.boolean(),
  leadTime: z.string().min(1).nullable(),
  message: z.string().min(1),
});

export type ProductFulfillment = z.infer<typeof ProductFulfillmentSchema>;

export const ProductSeoSchema = z.object({
  metaTitle: z.string().min(1).max(70),
  metaDescription: z.string().min(1).max(170),
  canonicalPath: CanonicalPathSchema,
});

export type ProductSeo = z.infer<typeof ProductSeoSchema>;

export const ProductDetailSchema = ProductCardSchema.extend({
  sku: z.string().min(1).max(50).nullable(),
  category: ProductCategorySchema,
  content: ProductContentSchema,
  gallery: z.array(ProductImageSchema).min(1),
  options: z.array(ProductOptionSchema),
  variants: z.array(ProductVariantSchema),
  specifications: z.array(ProductSpecificationSchema),
  fulfillment: ProductFulfillmentSchema,
  seo: ProductSeoSchema,
}).superRefine((product, context) => {
  if (product.content.name !== product.name) {
    context.addIssue({
      code: "custom",
      message: "Product card and content names must match",
      path: ["content", "name"],
    });
  }

  if (product.seo.canonicalPath !== product.canonicalPath) {
    context.addIssue({
      code: "custom",
      message: "SEO canonical path must match the product canonical path",
      path: ["seo", "canonicalPath"],
    });
  }

  if (!product.gallery.some((image) => image.id === product.primaryImage.id)) {
    context.addIssue({
      code: "custom",
      message: "Primary image must be present in the gallery",
      path: ["gallery"],
    });
  }
});

export type ProductDetail = z.infer<typeof ProductDetailSchema>;
