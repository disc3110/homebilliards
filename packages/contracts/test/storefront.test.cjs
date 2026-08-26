const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  CatalogLeafRegistrySchema,
  CategoryPageSchema,
  ProductOptionSchema,
  ProductPriceSchema,
  PublishingGateSchema,
  storefrontLeafRegistryFixture,
  storefrontNavigationFixture,
  storefrontProductFixtures,
} = require("../dist/index.js");

test("provides one valid fixture for every approved product archetype", () => {
  assert.equal(storefrontProductFixtures.length, 6);
  assert.deepEqual(
    new Set(storefrontProductFixtures.map(({ archetype }) => archetype)),
    new Set([
      "SIMPLE_ACCESSORY",
      "SPECIFICATION_SKU",
      "FURNITURE_DELIVERY",
      "INSTALL_REQUIRED",
      "QUOTE_ONLY",
      "CONFIGURABLE_PARENT",
    ]),
  );

  for (const fixture of storefrontProductFixtures) {
    assert.equal(fixture.product.source, "FIXTURE");
    assert.equal(fixture.publishing.stage, "DRAFT");
    assert.ok(fixture.publishing.blockers.length > 0);
  }
});

test("covers all five option classifications in the fixture catalog", () => {
  const optionTypes = new Set(
    storefrontProductFixtures.flatMap(({ product }) =>
      product.options.map(({ type }) => type),
    ),
  );

  assert.deepEqual(
    optionTypes,
    new Set([
      "VARIANT",
      "MODIFIER",
      "ADD_ON",
      "QUOTE_SELECTION",
      "INFORMATIONAL",
    ]),
  );
});

test("keeps Austin selections out of its permanent product title", () => {
  const { product } = storefrontProductFixtures.find(
    ({ archetype }) => archetype === "CONFIGURABLE_PARENT",
  );

  for (const option of product.options) {
    for (const value of option.values) {
      assert.equal(product.name.includes(value.label), false);
    }
  }
});

test("requires a numeric current price only for display pricing", () => {
  assert.equal(
    ProductPriceSchema.safeParse({
      mode: "DISPLAY_PRICE",
      current: null,
      compareAt: null,
      label: null,
    }).success,
    false,
  );

  assert.equal(
    ProductPriceSchema.safeParse({
      mode: "REQUEST_QUOTE",
      current: { amount: 1, currency: "CAD" },
      compareAt: null,
      label: "Request quote",
    }).success,
    false,
  );
});

test("enforces informational option behavior", () => {
  const invalidOption = {
    id: "delivery-note",
    sourceEntityId: null,
    label: "Delivery",
    type: "INFORMATIONAL",
    control: "RADIO",
    required: true,
    minSelections: 1,
    maxSelections: 1,
    values: [
      {
        id: "note",
        sourceEntityId: null,
        label: "Delivery is confirmed separately.",
        available: true,
        selectedByDefault: false,
        priceAdjustment: null,
        swatch: null,
      },
    ],
  };

  assert.equal(ProductOptionSchema.safeParse(invalidOption).success, false);
});

test("rejects category and slug collisions in the shared leaf registry", () => {
  const existing = storefrontLeafRegistryFixture[0];
  const result = CatalogLeafRegistrySchema.safeParse([
    existing,
    { ...existing, resourceId: "different-resource" },
  ]);

  assert.equal(result.success, false);
});

test("represents Jordan's preview navigation with Resources hidden", () => {
  assert.equal(storefrontNavigationFixture.nodes.length, 72);

  const resources = storefrontNavigationFixture.nodes.find(
    ({ id }) => id === "resources",
  );
  const dartboards = storefrontNavigationFixture.nodes.find(
    ({ id }) => id === "darts_dartboards",
  );

  assert.equal(resources.visibility, "HIDDEN");
  assert.equal(dartboards.path, "/darts/dartboards");
});

test("does not allow READY status while a publishing gate is pending", () => {
  const fixtureGate = storefrontProductFixtures[0].publishing;
  const result = PublishingGateSchema.safeParse({
    ...fixtureGate,
    stage: "READY",
    blockers: [],
  });

  assert.equal(result.success, false);
});

test("keeps category content on its approved canonical path", () => {
  const result = CategoryPageSchema.safeParse({
    id: "pool-tables",
    label: "Pool Tables",
    path: "/billiards/pool-tables",
    parentPath: "/billiards",
    contentShape: "C1",
    title: "Pool Tables",
    description:
      "Browse pool tables for custom game rooms. Final inventory and service information comes from approved catalog data.",
    editorialHtml: null,
    seo: {
      metaTitle: "Pool Tables",
      metaDescription:
        "Browse pool tables for custom game rooms. Final inventory and service information comes from approved catalog data.",
      canonicalPath: "/wrong-path",
    },
  });

  assert.equal(result.success, false);
});
