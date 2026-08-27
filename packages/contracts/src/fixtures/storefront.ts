import {
  type ProductAvailability,
  type ProductContent,
  type ProductCta,
  ProductDetailSchema,
  type ProductFulfillment,
  type ProductOption,
  type ProductPrice,
  type ProductSpecification,
  type ProductType,
  type ProductVariant,
} from "../storefront/product";
import {
  CatalogLeafRegistrySchema,
  StorefrontNavigationSchema,
} from "../storefront/navigation";
import {
  ProductFixtureCatalogSchema,
  type ProductArchetype,
  type PublishingGate,
} from "../storefront/publishing";

const fixtureDisclaimer =
  "Preview-only synthetic content. Verify every field against BigCommerce and obtain the required approvals before publication.";

const createPublishingGate = (blocker: string): PublishingGate => ({
  stage: "DRAFT",
  checks: [
    { gate: "CATALOG_IDENTITY", state: "IN_REVIEW", note: blocker },
    {
      gate: "ROUTING",
      state: "APPROVED",
      note: "Uses the approved nested product URL pattern.",
    },
    {
      gate: "CONTENT",
      state: "IN_REVIEW",
      note: "Fixture copy is for component development only.",
    },
    {
      gate: "MEDIA",
      state: "IN_REVIEW",
      note: "Fixture image URL must be replaced by approved catalog media.",
    },
    {
      gate: "COMMERCE",
      state: "IN_REVIEW",
      note: "Price and availability are representative fixture values.",
    },
    {
      gate: "OPTIONS",
      state: "IN_REVIEW",
      note: "Option classifications require catalog verification.",
    },
    {
      gate: "SEO",
      state: "IN_REVIEW",
      note: "Metadata requires final SEO review.",
    },
    { gate: "BUSINESS_REVIEW", state: "BLOCKED", note: blocker },
  ],
  blockers: [blocker],
});

interface FixtureProductInput {
  id: string;
  sourceProductId: number | null;
  slug: string;
  category: { id: string; label: string; path: string };
  productType: ProductType;
  brand: string | null;
  name: string;
  sku: string | null;
  badges: string[];
  price: ProductPrice;
  availability: ProductAvailability;
  cta: ProductCta;
  content: ProductContent;
  options?: ProductOption[];
  variants?: ProductVariant[];
  specifications: ProductSpecification[];
  fulfillment: ProductFulfillment;
  metaTitle: string;
  metaDescription: string;
}

const createFixtureProduct = (input: FixtureProductInput) => {
  const canonicalPath = `${input.category.path}/${input.slug}`;
  const groupSlug = input.category.path.split("/")[1] ?? "catalog";
  const groupLabels: Record<string, string> = {
    billiards: "Billiards",
    "ping-pong": "Ping Pong",
    "bbq-cooking": "BBQ & Cooking",
    darts: "Darts",
  };
  const primaryImage = {
    id: `${input.id}-primary`,
    url: `https://cdn11.bigcommerce.com/s-homebilliards/product_images/${input.slug}-fixture.jpg`,
    filename: `${input.slug}-front.jpg`,
    alt: `${input.name} shown from the front.`,
    role: "PRIMARY" as const,
    width: 1200,
    height: 1200,
  };

  return ProductDetailSchema.parse({
    id: input.id,
    source: "FIXTURE",
    sourceProductId: input.sourceProductId,
    slug: input.slug,
    canonicalPath,
    productType: input.productType,
    brand: input.brand,
    name: input.name,
    primaryImage,
    badges: input.badges,
    price: input.price,
    availability: input.availability,
    cta: input.cta,
    sku: input.sku,
    category: {
      ...input.category,
      breadcrumbs: [
        { label: "Home", path: "/" },
        {
          label: groupLabels[groupSlug] ?? "Catalog",
          path: `/${groupSlug}`,
        },
        { label: input.category.label, path: input.category.path },
      ],
    },
    content: input.content,
    gallery: [primaryImage],
    options: input.options ?? [],
    variants: input.variants ?? [],
    specifications: input.specifications,
    fulfillment: input.fulfillment,
    seo: {
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalPath,
    },
  });
};

const cad = (amount: number) => ({ amount, currency: "CAD" });

const purchasableStock: ProductAvailability = {
  status: "IN_STOCK",
  label: "In stock",
  detail: "Available for standard fulfillment.",
  purchasable: true,
};

const quoteAvailability: ProductAvailability = {
  status: "QUOTE_REQUIRED",
  label: "Quote required",
  detail: "Availability and final configuration are confirmed by our team.",
  purchasable: false,
};

const fixtures: Array<{
  fixtureId: string;
  archetype: ProductArchetype;
  purpose: string;
  blocker: string;
  product: ReturnType<typeof createFixtureProduct>;
}> = [
  {
    fixtureId: "simple-accessory",
    archetype: "SIMPLE_ACCESSORY",
    purpose:
      "Validates a direct Add to Cart journey with minimal configuration.",
    blocker:
      "Confirm product 203 survives cleanup and verify its live commerce data.",
    product: createFixtureProduct({
      id: "fixture-product-203",
      sourceProductId: 203,
      slug: "traeger-cherry-hardwood-pellets",
      category: {
        id: "bbq_wood_pellets",
        label: "Wood Pellets",
        path: "/bbq-cooking/wood-pellets",
      },
      productType: "STANDARD_SKU",
      brand: "Traeger",
      name: "Traeger Cherry Hardwood Pellets",
      sku: "FIXTURE-203",
      badges: [],
      price: {
        mode: "DISPLAY_PRICE",
        current: cad(24.99),
        compareAt: null,
        label: null,
      },
      availability: purchasableStock,
      cta: {
        kind: "ADD_TO_CART",
        label: "Add to Cart",
        action: "CART",
        target: null,
        disabled: false,
      },
      content: {
        name: "Traeger Cherry Hardwood Pellets",
        searchTitle: "Traeger Cherry Hardwood Pellets",
        feedTitle: "Traeger Cherry Hardwood Pellets",
        shortDescription:
          "Cherry hardwood pellets provide a mild smoke profile for everyday grilling. Confirm bag size and compatibility before publication.",
        longDescriptionHtml:
          "<p>This preview product demonstrates the simplest storefront purchase path.</p><p>Final product claims, package size, price, and availability must come from approved catalog data.</p><p>No option selection is required before adding the item to cart.</p>",
        highlights: [
          "Simple standard-SKU purchase flow",
          "No configuration required",
        ],
      },
      specifications: [
        { section: "Product", name: "Fuel type", value: "Hardwood pellets" },
        { section: "Product", name: "Flavour", value: "Cherry" },
      ],
      fulfillment: {
        deliveryRequired: false,
        installationRequired: false,
        quoteRequired: false,
        leadTime: null,
        message: "Standard fulfillment applies.",
      },
      metaTitle: "Traeger Cherry Hardwood Pellets",
      metaDescription:
        "Preview the direct purchase experience for Traeger Cherry Hardwood Pellets. Final product details and availability require catalog approval.",
    }),
  },
  {
    fixtureId: "specification-sku",
    archetype: "SPECIFICATION_SKU",
    purpose:
      "Validates technical specifications and a purchasable variant selector.",
    blocker:
      "Confirm product 141 survives cleanup and map its real dart-weight variants.",
    product: createFixtureProduct({
      id: "fixture-product-141",
      sourceProductId: 141,
      slug: "harrows-voodoo-brass-dart",
      category: {
        id: "darts_darts",
        label: "Darts",
        path: "/darts/darts",
      },
      productType: "SPECIFICATION_SKU",
      brand: "Harrows",
      name: "Harrows Voodoo Brass Dart",
      sku: null,
      badges: [],
      price: {
        mode: "DISPLAY_PRICE",
        current: cad(39.99),
        compareAt: null,
        label: "From",
      },
      availability: purchasableStock,
      cta: {
        kind: "ADD_TO_CART",
        label: "Add to Cart",
        action: "CART",
        target: null,
        disabled: false,
      },
      content: {
        name: "Harrows Voodoo Brass Dart",
        searchTitle: "Harrows Voodoo Brass Dart",
        feedTitle: "Harrows Voodoo Brass Dart",
        shortDescription:
          "The Voodoo brass dart fixture demonstrates technical comparison and weight selection. Exact specifications require catalog verification.",
        longDescriptionHtml:
          "<p>This fixture puts specifications near the purchase controls for customers comparing darts.</p><p>Weight is represented as a purchasable variant and is not copied into the permanent product title.</p><p>Final barrel, shaft, flight, and package details must be verified.</p>",
        highlights: [
          "Technical specifications remain easy to scan",
          "Weight selection controls the purchasable variant",
        ],
      },
      options: [
        {
          id: "dart-weight",
          sourceEntityId: null,
          label: "Weight",
          type: "VARIANT",
          control: "BUTTONS",
          required: true,
          minSelections: 1,
          maxSelections: 1,
          values: [
            {
              id: "weight-21g",
              sourceEntityId: null,
              label: "21 g",
              available: true,
              selectedByDefault: true,
              priceAdjustment: null,
              swatch: null,
            },
            {
              id: "weight-23g",
              sourceEntityId: null,
              label: "23 g",
              available: true,
              selectedByDefault: false,
              priceAdjustment: null,
              swatch: null,
            },
          ],
        },
      ],
      variants: [
        {
          id: "fixture-141-21g",
          sourceEntityId: null,
          sku: "FIXTURE-141-21G",
          selectedOptions: [{ optionId: "dart-weight", valueId: "weight-21g" }],
          price: cad(39.99),
          availability: purchasableStock,
          purchasable: true,
        },
        {
          id: "fixture-141-23g",
          sourceEntityId: null,
          sku: "FIXTURE-141-23G",
          selectedOptions: [{ optionId: "dart-weight", valueId: "weight-23g" }],
          price: cad(39.99),
          availability: purchasableStock,
          purchasable: true,
        },
      ],
      specifications: [
        { section: "Dart", name: "Barrel material", value: "Brass" },
        { section: "Dart", name: "Tip type", value: "Steel tip" },
      ],
      fulfillment: {
        deliveryRequired: false,
        installationRequired: false,
        quoteRequired: false,
        leadTime: null,
        message: "Select an available weight before adding to cart.",
      },
      metaTitle: "Harrows Voodoo Brass Dart",
      metaDescription:
        "Preview the specification-driven product experience for the Harrows Voodoo Brass Dart. Final weights and specifications require approval.",
    }),
  },
  {
    fixtureId: "furniture-delivery",
    archetype: "FURNITURE_DELIVERY",
    purpose:
      "Validates pricing with delivery planning for a large furniture product.",
    blocker:
      "Confirm product 125 survives cleanup and approve its delivery policy.",
    product: createFixtureProduct({
      id: "fixture-product-125",
      sourceProductId: 125,
      slug: "whistler-indoor-table-tennis-table",
      category: {
        id: "ping_pong_tables",
        label: "Ping Pong Tables",
        path: "/ping-pong/ping-pong-tables",
      },
      productType: "FURNITURE_PRODUCT",
      brand: "Whistler",
      name: "Whistler Indoor Table Tennis Table",
      sku: "FIXTURE-125",
      badges: [],
      price: {
        mode: "DISPLAY_PRICE",
        current: cad(1299),
        compareAt: null,
        label: null,
      },
      availability: {
        status: "SUPPLIER_AVAILABLE",
        label: "Supplier available",
        detail: "Lead time and delivery area require confirmation.",
        purchasable: false,
      },
      cta: {
        kind: "CHECK_DELIVERY",
        label: "Check Delivery",
        action: "FORM",
        target: "#delivery-request",
        disabled: false,
      },
      content: {
        name: "Whistler Indoor Table Tennis Table",
        searchTitle: "Whistler Indoor Table Tennis Table",
        feedTitle: "Whistler Indoor Table Tennis Table",
        shortDescription:
          "This indoor table tennis fixture pairs visible pricing with delivery planning. Dimensions and delivery availability require verification.",
        longDescriptionHtml:
          "<p>This preview demonstrates how a large product can show price while asking the customer to confirm delivery.</p><p>The delivery CTA is computed by the backend and is not inferred from category inside the frontend.</p><p>Final dimensions, assembly details, and lead time must be sourced from the catalog.</p>",
        highlights: [
          "Visible product price with a delivery-first CTA",
          "Large-item specifications grouped for planning",
        ],
      },
      specifications: [
        { section: "Table", name: "Use", value: "Indoor" },
        {
          section: "Planning",
          name: "Delivery",
          value: "Confirmation required",
        },
      ],
      fulfillment: {
        deliveryRequired: true,
        installationRequired: false,
        quoteRequired: false,
        leadTime: "Confirm with the Home Billiards team.",
        message: "Check delivery availability before completing the purchase.",
      },
      metaTitle: "Whistler Indoor Table Tennis Table",
      metaDescription:
        "Preview the furniture and delivery experience for the Whistler Indoor Table Tennis Table. Final dimensions and availability require approval.",
    }),
  },
  {
    fixtureId: "install-required",
    archetype: "INSTALL_REQUIRED",
    purpose: "Validates the guided installation journey for a pool table.",
    blocker:
      "Confirm product 119 survives cleanup and complete its mandatory business review.",
    product: createFixtureProduct({
      id: "fixture-product-119",
      sourceProductId: 119,
      slug: "olhausen-canadiana-pool-table",
      category: {
        id: "billiards_pool_tables",
        label: "Pool Tables",
        path: "/billiards/pool-tables",
      },
      productType: "INSTALL_REQUIRED",
      brand: "Olhausen",
      name: "Olhausen Canadiana Pool Table",
      sku: null,
      badges: [],
      price: {
        mode: "DISPLAY_PRICE",
        current: cad(6999),
        compareAt: null,
        label: "Starting at",
      },
      availability: {
        status: "CUSTOM_ORDER",
        label: "Custom order",
        detail:
          "Configuration, room access, delivery, and installation are confirmed by our team.",
        purchasable: false,
      },
      cta: {
        kind: "CHECK_INSTALLATION",
        label: "Check Installation",
        action: "FORM",
        target: "#installation-request",
        disabled: false,
      },
      content: {
        name: "Olhausen Canadiana Pool Table",
        searchTitle: "Olhausen Canadiana Pool Table",
        feedTitle: "Olhausen Canadiana Pool Table",
        shortDescription:
          "The Canadiana fixture demonstrates a guided pool-table purchase with installation review. Final materials and options require verification.",
        longDescriptionHtml:
          "<p>This preview product demonstrates the installation-required journey used by pool tables.</p><p>A starting price may be displayed, but room access, configuration, delivery, and installation are confirmed before purchase.</p><p>Static copy never presents a selected size, finish, or cloth colour as a permanent product fact.</p>",
        highlights: [
          "Guided installation review before purchase",
          "Configuration details stay outside the permanent title",
        ],
      },
      options: [
        {
          id: "canadiana-finish",
          sourceEntityId: null,
          label: "Finish",
          type: "QUOTE_SELECTION",
          control: "SWATCH",
          required: true,
          minSelections: 1,
          maxSelections: 1,
          values: [
            {
              id: "finish-preview-oak",
              sourceEntityId: null,
              label: "Oak preview",
              available: true,
              selectedByDefault: true,
              priceAdjustment: null,
              swatch: { color: "#8A5A3B", imageUrl: null },
            },
          ],
        },
      ],
      specifications: [
        { section: "Planning", name: "Installation", value: "Required" },
        { section: "Product", name: "Configuration", value: "Custom order" },
      ],
      fulfillment: {
        deliveryRequired: true,
        installationRequired: true,
        quoteRequired: false,
        leadTime: "Confirmed after configuration review.",
        message:
          "Installation and room access must be reviewed before purchase.",
      },
      metaTitle: "Olhausen Canadiana Pool Table",
      metaDescription:
        "Preview the installation-guided experience for the Olhausen Canadiana Pool Table. Final configuration, price, and availability require approval.",
    }),
  },
  {
    fixtureId: "quote-only",
    archetype: "QUOTE_ONLY",
    purpose:
      "Validates a price-hidden product whose only conversion is a quote request.",
    blocker:
      "Confirm product 1161 survives cleanup and approve quote handling details.",
    product: createFixtureProduct({
      id: "fixture-product-1161",
      sourceProductId: 1161,
      slug: "olhausen-custom-augusta-pool-table",
      category: {
        id: "billiards_pool_tables",
        label: "Pool Tables",
        path: "/billiards/pool-tables",
      },
      productType: "INSTALL_REQUIRED",
      brand: "Olhausen",
      name: "Olhausen Custom Augusta Pool Table",
      sku: null,
      badges: ["Custom order"],
      price: {
        mode: "REQUEST_QUOTE",
        current: null,
        compareAt: null,
        label: "Request a quote for pricing",
      },
      availability: quoteAvailability,
      cta: {
        kind: "REQUEST_QUOTE",
        label: "Request Quote",
        action: "FORM",
        target: "#quote-request",
        disabled: false,
      },
      content: {
        name: "Olhausen Custom Augusta Pool Table",
        searchTitle: "Olhausen Custom Augusta Pool Table",
        feedTitle: "Olhausen Custom Augusta Pool Table",
        shortDescription:
          "The Custom Augusta fixture demonstrates a price-hidden, quote-only purchase path. All configuration details require staff confirmation.",
        longDescriptionHtml:
          "<p>This preview covers products that cannot expose a reliable numeric price online.</p><p>The backend returns a quote price mode and a fully formed Request Quote CTA, so the frontend does not guess.</p><p>Configuration choices are captured as structured quote selections.</p>",
        highlights: [
          "No unsupported online price is displayed",
          "Selections are carried into the quote request",
        ],
      },
      options: [
        {
          id: "augusta-room-readiness",
          sourceEntityId: null,
          label: "Room readiness",
          type: "QUOTE_SELECTION",
          control: "RADIO",
          required: true,
          minSelections: 1,
          maxSelections: 1,
          values: [
            {
              id: "room-ready",
              sourceEntityId: null,
              label: "Room is ready",
              available: true,
              selectedByDefault: false,
              priceAdjustment: null,
              swatch: null,
            },
            {
              id: "planning-help",
              sourceEntityId: null,
              label: "I need planning help",
              available: true,
              selectedByDefault: false,
              priceAdjustment: null,
              swatch: null,
            },
          ],
        },
      ],
      specifications: [
        { section: "Purchase", name: "Price", value: "Quote required" },
        { section: "Planning", name: "Installation", value: "Required" },
      ],
      fulfillment: {
        deliveryRequired: true,
        installationRequired: true,
        quoteRequired: true,
        leadTime: "Confirmed with the quote.",
        message:
          "Submit a quote request to confirm configuration and fulfillment.",
      },
      metaTitle: "Olhausen Custom Augusta Pool Table",
      metaDescription:
        "Request configuration and pricing for the Olhausen Custom Augusta Pool Table. Final product details and availability require staff confirmation.",
    }),
  },
  {
    fixtureId: "configurable-parent",
    archetype: "CONFIGURABLE_PARENT",
    purpose:
      "Exercises all option classes needed by the Austin visual builder.",
    blocker:
      "Map Austin to a stable live BigCommerce parent product before integration.",
    product: createFixtureProduct({
      id: "fixture-austin-parent",
      sourceProductId: null,
      slug: "austin-pool-table",
      category: {
        id: "billiards_pool_tables",
        label: "Pool Tables",
        path: "/billiards/pool-tables",
      },
      productType: "INSTALL_REQUIRED",
      brand: "California House",
      name: "California House Austin Pool Table",
      sku: null,
      badges: ["Builder preview"],
      price: {
        mode: "DISPLAY_PRICE",
        current: cad(7499),
        compareAt: null,
        label: "Starting at",
      },
      availability: {
        status: "CUSTOM_ORDER",
        label: "Custom order",
        detail: "The selected configuration requires confirmation.",
        purchasable: false,
      },
      cta: {
        kind: "CHECK_INSTALLATION",
        label: "Review Configuration",
        action: "FORM",
        target: "#configuration-review",
        disabled: false,
      },
      content: {
        name: "California House Austin Pool Table",
        searchTitle: "California House Austin Pool Table",
        feedTitle: "California House Austin Pool Table",
        shortDescription:
          "The Austin fixture powers the visual builder for size, finish, cloth, add-ons, and planning. It is not mapped to a live parent product.",
        longDescriptionHtml:
          "<p>This fixture is the frontend reference for the configurable Austin experience.</p><p>Options are explicitly classified so variant inventory, modifiers, add-ons, quote answers, and information are handled differently.</p><p>The selected values remain UI state and specifications; they never rewrite the permanent product title.</p>",
        highlights: [
          "One parent product supports the visual configuration journey",
          "Every choice declares its commerce behavior",
          "Configuration is reviewed before purchase",
        ],
      },
      options: [
        {
          id: "austin-size",
          sourceEntityId: null,
          label: "Table size",
          type: "VARIANT",
          control: "BUTTONS",
          required: true,
          minSelections: 1,
          maxSelections: 1,
          values: [
            {
              id: "size-7ft",
              sourceEntityId: null,
              label: "7 ft",
              available: true,
              selectedByDefault: true,
              priceAdjustment: null,
              swatch: null,
            },
            {
              id: "size-8ft",
              sourceEntityId: null,
              label: "8 ft",
              available: true,
              selectedByDefault: false,
              priceAdjustment: cad(500),
              swatch: null,
            },
          ],
        },
        {
          id: "austin-finish",
          sourceEntityId: null,
          label: "Wood finish",
          type: "MODIFIER",
          control: "SWATCH",
          required: true,
          minSelections: 1,
          maxSelections: 1,
          values: [
            {
              id: "finish-walnut",
              sourceEntityId: null,
              label: "Walnut preview",
              available: true,
              selectedByDefault: true,
              priceAdjustment: null,
              swatch: { color: "#6B4423", imageUrl: null },
            },
            {
              id: "finish-charcoal",
              sourceEntityId: null,
              label: "Charcoal preview",
              available: true,
              selectedByDefault: false,
              priceAdjustment: cad(250),
              swatch: { color: "#3B3B3B", imageUrl: null },
            },
          ],
        },
        {
          id: "austin-accessories",
          sourceEntityId: null,
          label: "Add-ons",
          type: "ADD_ON",
          control: "CHECKBOX",
          required: false,
          minSelections: 0,
          maxSelections: 2,
          values: [
            {
              id: "addon-dining-top",
              sourceEntityId: null,
              label: "Dining top preview",
              available: true,
              selectedByDefault: false,
              priceAdjustment: cad(899),
              swatch: null,
            },
            {
              id: "addon-accessory-kit",
              sourceEntityId: null,
              label: "Accessory kit preview",
              available: true,
              selectedByDefault: false,
              priceAdjustment: cad(249),
              swatch: null,
            },
          ],
        },
        {
          id: "austin-room-access",
          sourceEntityId: null,
          label: "Room access",
          type: "QUOTE_SELECTION",
          control: "RADIO",
          required: true,
          minSelections: 1,
          maxSelections: 1,
          values: [
            {
              id: "access-main-floor",
              sourceEntityId: null,
              label: "Main floor",
              available: true,
              selectedByDefault: false,
              priceAdjustment: null,
              swatch: null,
            },
            {
              id: "access-stairs",
              sourceEntityId: null,
              label: "Stairs or restricted access",
              available: true,
              selectedByDefault: false,
              priceAdjustment: null,
              swatch: null,
            },
          ],
        },
        {
          id: "austin-installation-note",
          sourceEntityId: null,
          label: "Installation",
          type: "INFORMATIONAL",
          control: "INFORMATION",
          required: false,
          minSelections: 0,
          maxSelections: 1,
          values: [
            {
              id: "installation-review",
              sourceEntityId: null,
              label:
                "Professional installation is reviewed with your configuration.",
              available: true,
              selectedByDefault: false,
              priceAdjustment: null,
              swatch: null,
            },
          ],
        },
      ],
      variants: [
        {
          id: "fixture-austin-7ft",
          sourceEntityId: null,
          sku: "FIXTURE-AUSTIN-7FT",
          selectedOptions: [{ optionId: "austin-size", valueId: "size-7ft" }],
          price: cad(7499),
          availability: {
            status: "CUSTOM_ORDER",
            label: "Custom order",
            detail: "Configuration review required.",
            purchasable: false,
          },
          purchasable: false,
        },
        {
          id: "fixture-austin-8ft",
          sourceEntityId: null,
          sku: "FIXTURE-AUSTIN-8FT",
          selectedOptions: [{ optionId: "austin-size", valueId: "size-8ft" }],
          price: cad(7999),
          availability: {
            status: "CUSTOM_ORDER",
            label: "Custom order",
            detail: "Configuration review required.",
            purchasable: false,
          },
          purchasable: false,
        },
      ],
      specifications: [
        { section: "Planning", name: "Installation", value: "Required" },
        {
          section: "Configuration",
          name: "Parent model",
          value: "Austin preview",
        },
      ],
      fulfillment: {
        deliveryRequired: true,
        installationRequired: true,
        quoteRequired: false,
        leadTime: "Confirmed after configuration review.",
        message:
          "Review the completed configuration with the Home Billiards team.",
      },
      metaTitle: "California House Austin Pool Table",
      metaDescription:
        "Preview the configurable California House Austin Pool Table builder. Live parent mapping, product claims, price, options, and availability require approval.",
    }),
  },
];

export const storefrontProductFixtures = ProductFixtureCatalogSchema.parse(
  fixtures.map(({ blocker, ...fixture }) => ({
    ...fixture,
    disclaimer: fixtureDisclaimer,
    publishing: createPublishingGate(blocker),
  })),
);

interface NavigationGroupInput {
  id: string;
  label: string;
  path: string;
  children: Array<readonly [id: string, label: string, path: string]>;
}

const navigationGroups: NavigationGroupInput[] = [
  {
    id: "billiards",
    label: "Billiards",
    path: "/billiards",
    children: [
      ["billiards_pool_tables", "Pool Tables", "/billiards/pool-tables"],
      ["billiards_pool_cues", "Pool Cues", "/billiards/pool-cues"],
      [
        "billiards_pool_cue_cases",
        "Pool Cue Cases",
        "/billiards/pool-cue-cases",
      ],
      [
        "billiards_pool_table_felt",
        "Pool Table Felt",
        "/billiards/pool-table-felt",
      ],
      [
        "billiards_pool_cue_racks",
        "Pool Cue Racks, Holders & Storage",
        "/billiards/pool-cue-racks-holders-storage",
      ],
      ["billiards_pool_balls", "Pool Balls", "/billiards/pool-balls"],
      [
        "billiards_pool_table_covers",
        "Pool Table Covers",
        "/billiards/pool-table-covers",
      ],
      [
        "billiards_chalk",
        "Chalk & Chalk Holders",
        "/billiards/chalk-chalk-holders",
      ],
      ["billiards_gloves", "Gloves", "/billiards/gloves"],
      [
        "billiards_cue_tips",
        "Cue Tips & Cue Maintenance",
        "/billiards/cue-tips-cue-maintenance",
      ],
      [
        "billiards_pool_table_care",
        "Pool Table Care",
        "/billiards/pool-table-care",
      ],
      [
        "billiards_joint_protectors",
        "Pool Cue Joint Protectors",
        "/billiards/pool-cue-joint-protectors",
      ],
    ],
  },
  {
    id: "ping_pong",
    label: "Ping Pong",
    path: "/ping-pong",
    children: [
      ["ping_pong_tables", "Ping Pong Tables", "/ping-pong/ping-pong-tables"],
      [
        "ping_pong_paddles",
        "Ping Pong Paddles",
        "/ping-pong/ping-pong-paddles",
      ],
      ["ping_pong_robots", "Ping Pong Robots", "/ping-pong/ping-pong-robots"],
      ["ping_pong_balls", "Ping Pong Balls", "/ping-pong/ping-pong-balls"],
      [
        "ping_pong_nets",
        "Ping Pong Net & Posts",
        "/ping-pong/ping-pong-net-posts",
      ],
      [
        "ping_pong_covers",
        "Ping Pong Table Covers",
        "/ping-pong/ping-pong-table-covers",
      ],
    ],
  },
  {
    id: "bbq_cooking",
    label: "BBQ & Cooking",
    path: "/bbq-cooking",
    children: [
      [
        "bbq_traeger_smokers",
        "Traeger Smokers",
        "/bbq-cooking/traeger-smokers",
      ],
      [
        "bbq_traeger_accessories",
        "Traeger Accessories",
        "/bbq-cooking/traeger-accessories",
      ],
      ["bbq_grill_covers", "Grill Covers", "/bbq-cooking/grill-covers"],
      ["bbq_sauces_spices", "Sauces & Spices", "/bbq-cooking/sauces-spices"],
      ["bbq_wood_pellets", "Wood Pellets", "/bbq-cooking/wood-pellets"],
      [
        "bbq_food_thermometers",
        "Food Thermometers",
        "/bbq-cooking/food-thermometers",
      ],
      ["bbq_cookware", "BBQ Cookware", "/bbq-cooking/bbq-cookware"],
      ["bbq_maintenance", "BBQ Maintenance", "/bbq-cooking/bbq-maintenance"],
    ],
  },
  {
    id: "foosball",
    label: "Foosball",
    path: "/foosball",
    children: [
      ["foosball_tables", "Foosball Tables", "/foosball/foosball-tables"],
      [
        "foosball_accessories",
        "Foosball Accessories",
        "/foosball/foosball-accessories",
      ],
    ],
  },
  {
    id: "darts",
    label: "Darts",
    path: "/darts",
    children: [
      ["darts_dartboards", "Dartboards", "/darts/dartboards"],
      ["darts_darts", "Darts", "/darts/darts"],
      ["darts_flights", "Dart Flights", "/darts/dart-flights"],
      ["darts_shafts", "Dart Shafts", "/darts/dart-shafts"],
      ["darts_cases", "Dart Cases", "/darts/dart-cases"],
      ["darts_tips", "Dart Tips", "/darts/dart-tips"],
      ["darts_accessories", "Dart Accessories", "/darts/dart-accessories"],
    ],
  },
  {
    id: "table_games",
    label: "Table Games",
    path: "/table-games",
    children: [
      [
        "table_games_air_hockey_tables",
        "Air Hockey Tables",
        "/table-games/air-hockey-tables",
      ],
      [
        "table_games_air_hockey_accessories",
        "Air Hockey Accessories",
        "/table-games/air-hockey-accessories",
      ],
      ["table_games_poker_tables", "Poker Tables", "/table-games/poker-tables"],
      ["table_games_poker_chips", "Poker Chips", "/table-games/poker-chips"],
      [
        "table_games_poker_accessories",
        "Poker Accessories",
        "/table-games/poker-accessories",
      ],
      ["table_games_cards", "Cards", "/table-games/cards"],
      ["table_games_board_games", "Board Games", "/table-games/board-games"],
      ["table_games_dice", "Dice", "/table-games/dice"],
      [
        "table_games_sports",
        "Sports & Backyard Games",
        "/table-games/sports-backyard-games",
      ],
    ],
  },
  {
    id: "shuffleboard",
    label: "Shuffleboard",
    path: "/shuffleboard",
    children: [
      [
        "shuffleboard_tables",
        "Shuffleboard Tables",
        "/shuffleboard/shuffleboard-tables",
      ],
      [
        "shuffleboard_powder",
        "Shuffleboard Powder",
        "/shuffleboard/shuffleboard-powder",
      ],
      [
        "shuffleboard_accessories",
        "Shuffleboard Accessories",
        "/shuffleboard/shuffleboard-accessories",
      ],
    ],
  },
  {
    id: "furniture",
    label: "Furniture",
    path: "/furniture",
    children: [
      ["furniture_chairs", "Chairs", "/furniture/chairs"],
      ["furniture_benches", "Benches", "/furniture/benches"],
      ["furniture_dining_tables", "Dining Tables", "/furniture/dining-tables"],
    ],
  },
  {
    id: "commercial",
    label: "Commercial",
    path: "/commercial",
    children: [
      [
        "commercial_pool_tables",
        "Coin-Operated Pool Tables",
        "/commercial/coin-operated-pool-tables",
      ],
      [
        "commercial_foosball",
        "Coin-Operated Foosball Tables",
        "/commercial/coin-operated-foosball-tables",
      ],
      [
        "commercial_air_hockey",
        "Coin-Operated Air Hockey Tables",
        "/commercial/coin-operated-air-hockey-tables",
      ],
      ["commercial_arcade", "Arcade Games", "/commercial/arcade-games"],
    ],
  },
];

const categoryNodes = navigationGroups.flatMap((group, groupIndex) => [
  {
    id: group.id,
    parentId: null,
    label: group.label,
    path: group.path,
    pageType: "CATEGORY_HUB" as const,
    placement: "HEADER" as const,
    sortOrder: groupIndex,
    visibility: "VISIBLE" as const,
  },
  ...group.children.map(([id, label, path], childIndex) => ({
    id,
    parentId: group.id,
    label,
    path,
    pageType: "PRODUCT_LIST" as const,
    placement: "MEGA_MENU" as const,
    sortOrder: childIndex,
    visibility: "VISIBLE" as const,
  })),
]);

export const storefrontNavigationFixture = StorefrontNavigationSchema.parse({
  version: "jordan-directory-preview-v1",
  nodes: [
    ...categoryNodes,
    {
      id: "sale",
      parentId: null,
      label: "On Sale",
      path: "/sale",
      pageType: "COLLECTION",
      placement: "HEADER",
      sortOrder: 20,
      visibility: "VISIBLE",
    },
    {
      id: "new_arrivals",
      parentId: null,
      label: "New Arrivals",
      path: "/new-arrivals",
      pageType: "COLLECTION",
      placement: "HEADER",
      sortOrder: 21,
      visibility: "VISIBLE",
    },
    {
      id: "made_in_canada",
      parentId: null,
      label: "Made in Canada",
      path: "/made-in-canada",
      pageType: "COLLECTION",
      placement: "HEADER",
      sortOrder: 22,
      visibility: "VISIBLE",
    },
    {
      id: "brands",
      parentId: null,
      label: "Brands",
      path: "/brands",
      pageType: "BRAND_INDEX",
      placement: "FOOTER",
      sortOrder: 0,
      visibility: "VISIBLE",
    },
    {
      id: "resources",
      parentId: null,
      label: "Resources",
      path: "/resources",
      pageType: "EDITORIAL_HUB",
      placement: "FOOTER",
      sortOrder: 1,
      visibility: "HIDDEN",
    },
    {
      id: "resources_articles",
      parentId: "resources",
      label: "Articles",
      path: "/resources/articles",
      pageType: "EDITORIAL_LIST",
      placement: "FOOTER",
      sortOrder: 0,
      visibility: "HIDDEN",
    },
    {
      id: "search",
      parentId: null,
      label: "Search",
      path: "/search",
      pageType: "UTILITY",
      placement: "UTILITY",
      sortOrder: 0,
      visibility: "VISIBLE",
    },
    {
      id: "cart",
      parentId: null,
      label: "Cart",
      path: "/cart",
      pageType: "UTILITY",
      placement: "UTILITY",
      sortOrder: 1,
      visibility: "VISIBLE",
    },
    {
      id: "contact",
      parentId: null,
      label: "Contact",
      path: "/contact",
      pageType: "UTILITY",
      placement: "UTILITY",
      sortOrder: 2,
      visibility: "VISIBLE",
    },
  ],
});

export const storefrontLeafRegistryFixture = CatalogLeafRegistrySchema.parse(
  storefrontProductFixtures.map(({ product }) => ({
    categoryPath: product.category.path,
    slug: product.slug,
    kind: "PRODUCT",
    canonicalPath: product.canonicalPath,
    resourceId: product.id,
  })),
);
