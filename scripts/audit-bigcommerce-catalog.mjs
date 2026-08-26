#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const OUTPUT_DIRECTORY = path.join(ROOT, "artifacts", "bigcommerce-inspection");
const SAMPLE_FILE = path.join(
  OUTPUT_DIRECTORY,
  "management-catalog-sample.json",
);

function parseEnv(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function fetchJson(url, token, label) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "X-Auth-Token": token },
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `${label} failed (${response.status}): ${body.title ?? response.statusText}`,
    );
  }
  return body;
}

async function fetchAll(baseUrl, pathname, token, label) {
  const separator = pathname.includes("?") ? "&" : "?";
  const first = await fetchJson(
    `${baseUrl}${pathname}${separator}limit=250&page=1`,
    token,
    `${label} page 1`,
  );
  const responses = [first];
  const totalPages = first.meta?.pagination?.total_pages ?? 1;
  for (let page = 2; page <= totalPages; page += 1) {
    responses.push(
      await fetchJson(
        `${baseUrl}${pathname}${separator}limit=250&page=${page}`,
        token,
        `${label} page ${page}`,
      ),
    );
  }
  return responses.flatMap((response) => response.data ?? []);
}

function flattenCategories(nodes, parentNames = [], output = []) {
  for (const node of nodes) {
    const names = [...parentNames, node.name];
    output.push({
      id: node.id,
      parentId: node.parent_id,
      name: node.name,
      depth: node.depth,
      path: names,
      url: node.url,
      isVisible: node.is_visible,
    });
    flattenCategories(node.children ?? [], names, output);
  }
  return output;
}

function isPresent(value) {
  return value !== null && value !== undefined && value !== "" && value !== 0;
}

function count(products, predicate) {
  return products.filter(predicate).length;
}

function duplicates(products, selector) {
  const grouped = new Map();
  for (const product of products) {
    const value = selector(product);
    if (!value) continue;
    const normalized = String(value).trim().toLowerCase();
    const items = grouped.get(normalized) ?? [];
    items.push({ id: product.id, name: product.name, value });
    grouped.set(normalized, items);
  }
  return [...grouped.values()].filter((items) => items.length > 1);
}

function examples(products, predicate, limit = 15) {
  return products
    .filter(predicate)
    .slice(0, limit)
    .map(({ id, name, sku }) => ({ id, name, sku }));
}

async function main() {
  const environment = parseEnv(
    await readFile(path.join(ROOT, "apps", "backend", ".env"), "utf8"),
  );
  const storeHash = environment.BIGCOMMERCE_STORE_HASH;
  const token = environment.BIGCOMMERCE_ACCESS_TOKEN;
  if (!storeHash || !token) {
    throw new Error(
      "BIGCOMMERCE_STORE_HASH and BIGCOMMERCE_ACCESS_TOKEN are required",
    );
  }

  const baseUrl = `https://api.bigcommerce.com/stores/${storeHash}/v3`;
  const fields = [
    "id",
    "name",
    "sku",
    "type",
    "brand_id",
    "categories",
    "price",
    "calculated_price",
    "retail_price",
    "sale_price",
    "map_price",
    "inventory_level",
    "inventory_tracking",
    "availability",
    "availability_description",
    "is_visible",
    "is_featured",
    "is_price_hidden",
    "is_preorder_only",
    "preorder_message",
    "custom_url",
    "description",
    "warranty",
    "weight",
    "width",
    "height",
    "depth",
    "upc",
    "gtin",
    "mpn",
    "page_title",
    "meta_description",
    "search_keywords",
    "date_created",
    "date_modified",
  ].join(",");

  console.log("Fetching the complete lightweight product index...");
  const [products, brands, sample] = await Promise.all([
    fetchAll(
      baseUrl,
      `/catalog/products?include_fields=${fields}`,
      token,
      "Products",
    ),
    fetchAll(baseUrl, "/catalog/brands?", token, "Brands"),
    readFile(SAMPLE_FILE, "utf8").then(JSON.parse),
  ]);

  const categories = flattenCategories(
    sample.categoriesByTree.flatMap((tree) => tree.response.data ?? []),
  );
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const brandById = new Map(brands.map((brand) => [brand.id, brand.name]));

  const categoryUsage = categories
    .map((category) => ({
      ...category,
      productCount: count(products, (product) =>
        product.categories.includes(category.id),
      ),
    }))
    .sort((left, right) => right.productCount - left.productCount);
  const unknownCategoryIds = [
    ...new Set(
      products
        .flatMap((product) => product.categories)
        .filter((categoryId) => !categoryById.has(categoryId)),
    ),
  ];
  const brandUsage = brands
    .map((brand) => ({
      id: brand.id,
      name: brand.name,
      productCount: count(products, (product) => product.brand_id === brand.id),
    }))
    .sort((left, right) => right.productCount - left.productCount);

  const detailedProducts = sample.products.data ?? [];
  const detailedVariants = detailedProducts.flatMap(
    (product) => product.variants ?? [],
  );
  const detailedImages = detailedProducts.flatMap(
    (product) => product.images ?? [],
  );
  const customFields = detailedProducts.flatMap((product) =>
    (product.custom_fields ?? []).map((field) => ({
      productId: product.id,
      productName: product.name,
      name: field.name,
      value: field.value,
    })),
  );
  const optionNames = new Map();
  for (const product of detailedProducts) {
    for (const option of product.options ?? []) {
      const key = `${option.display_name} (${option.type})`;
      optionNames.set(key, (optionNames.get(key) ?? 0) + 1);
    }
  }

  const audit = {
    generatedAt: new Date().toISOString(),
    scope: {
      totalProducts: products.length,
      detailedSampleProducts: detailedProducts.length,
      brands: brands.length,
      categories: categories.length,
    },
    store: sample.store,
    completeness: {
      visible: count(products, (product) => product.is_visible),
      hidden: count(products, (product) => !product.is_visible),
      missingSku: count(products, (product) => !isPresent(product.sku)),
      missingBrand: count(
        products,
        (product) => !brandById.has(product.brand_id),
      ),
      noCategory: count(products, (product) => product.categories.length === 0),
      multipleCategories: count(
        products,
        (product) => product.categories.length > 1,
      ),
      missingDescription: count(
        products,
        (product) => !isPresent(product.description),
      ),
      missingPrice: count(products, (product) => !isPresent(product.price)),
      onSale: count(products, (product) => product.sale_price > 0),
      priceHidden: count(products, (product) => product.is_price_hidden),
      preorderOnly: count(products, (product) => product.is_preorder_only),
      missingAnyIdentifier: count(
        products,
        (product) =>
          !isPresent(product.gtin) &&
          !isPresent(product.upc) &&
          !isPresent(product.mpn),
      ),
      missingPageTitle: count(
        products,
        (product) => !isPresent(product.page_title),
      ),
      missingMetaDescription: count(
        products,
        (product) => !isPresent(product.meta_description),
      ),
      missingWeight: count(products, (product) => !isPresent(product.weight)),
      missingAnyDimension: count(
        products,
        (product) =>
          !isPresent(product.width) ||
          !isPresent(product.height) ||
          !isPresent(product.depth),
      ),
      inventoryTracking: Object.fromEntries(
        ["none", "product", "variant"].map((mode) => [
          mode,
          count(products, (product) => product.inventory_tracking === mode),
        ]),
      ),
    },
    duplicates: {
      skuGroups: duplicates(products, (product) => product.sku),
      urlGroups: duplicates(products, (product) => product.custom_url?.url),
    },
    examples: {
      missingSku: examples(products, (product) => !isPresent(product.sku)),
      missingBrand: examples(
        products,
        (product) => !brandById.has(product.brand_id),
      ),
      noCategory: examples(
        products,
        (product) => product.categories.length === 0,
      ),
      missingPrice: examples(products, (product) => !isPresent(product.price)),
    },
    categoryUsage,
    unknownCategoryIds,
    brandUsage,
    detailedSample: {
      products: detailedProducts.length,
      variants: detailedVariants.length,
      configurableProducts: count(
        detailedProducts,
        (product) =>
          (product.variants?.length ?? 0) > 1 ||
          (product.options?.length ?? 0) > 0,
      ),
      productsWithModifiers: count(
        detailedProducts,
        (product) => (product.modifiers?.length ?? 0) > 0,
      ),
      productsWithCustomFields: count(
        detailedProducts,
        (product) => (product.custom_fields?.length ?? 0) > 0,
      ),
      customFields,
      optionDefinitions: [...optionNames.entries()]
        .map(([name, productCount]) => ({ name, productCount }))
        .sort((left, right) => right.productCount - left.productCount),
      images: detailedImages.length,
      imagesMissingAlt: count(
        detailedImages,
        (image) => !isPresent(image.description),
      ),
      metafields: sample.productMetafields.flatMap(
        (result) => result.data ?? [],
      ),
    },
  };

  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  const outputFile = path.join(
    OUTPUT_DIRECTORY,
    "management-catalog-audit.json",
  );
  await writeFile(outputFile, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${path.relative(ROOT, outputFile)} (${products.length} products audited)`,
  );
}

main().catch((error) => {
  console.error(`\nBigCommerce audit failed: ${error.message}`);
  process.exitCode = 1;
});
