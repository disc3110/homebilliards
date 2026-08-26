#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DEFAULT_OUTPUT = path.join(ROOT, "artifacts", "bigcommerce-inspection");

function parseArgs(argv) {
  const options = {
    mode: "all",
    output: DEFAULT_OUTPUT,
    limit: 5,
    envFile: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];

    if (argument === "--mode" && value) {
      options.mode = value;
      index += 1;
    } else if (argument === "--out" && value) {
      options.output = path.resolve(ROOT, value);
      index += 1;
    } else if (argument === "--limit" && value) {
      options.limit = Number.parseInt(value, 10);
      index += 1;
    } else if (argument === "--env" && value) {
      options.envFile = path.resolve(ROOT, value);
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  if (!new Set(["all", "graphql", "catalog"]).has(options.mode)) {
    throw new Error("--mode must be one of: all, graphql, catalog");
  }
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 50
  ) {
    throw new Error("--limit must be an integer between 1 and 50");
  }

  return options;
}

function printHelp() {
  console.log(`Inspect a BigCommerce store without changing it.

Usage:
  npm run inspect:bigcommerce -- [options]

Options:
  --mode all|graphql|catalog  APIs to inspect (default: all)
  --limit N                   Number of catalog products to sample (default: 5)
  --out PATH                  Output directory
  --env PATH                  Explicit env file
  -h, --help                  Show this help

Environment:
  BIGCOMMERCE_STORE_HASH
  BIGCOMMERCE_STOREFRONT_PRIVATE_TOKEN (preferred) or BIGCOMMERCE_STOREFRONT_TOKEN
  BIGCOMMERCE_ACCESS_TOKEN
  BIGCOMMERCE_STOREFRONT_GRAPHQL_URL (optional)
`);
}

function parseEnv(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const normalized = line.startsWith("export ") ? line.slice(7) : line;
    const separator = normalized.indexOf("=");
    if (separator < 1) continue;
    const key = normalized.slice(0, separator).trim();
    let value = normalized.slice(separator + 1).trim();
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

async function loadEnvironment(explicitFile) {
  const candidates = explicitFile
    ? [explicitFile]
    : [path.join(ROOT, ".env"), path.join(ROOT, "apps", "backend", ".env")];

  for (const filename of candidates) {
    if (!existsSync(filename)) continue;
    const parsed = parseEnv(await readFile(filename, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
    console.log(`Loaded environment from ${path.relative(ROOT, filename)}`);
    return;
  }

  if (explicitFile) throw new Error(`Env file not found: ${explicitFile}`);
  console.log("No .env file found; using the current process environment.");
}

function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

async function fetchJson(url, init, label) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { rawResponse: text.slice(0, 2_000) };
  }

  if (!response.ok) {
    const detail =
      body?.title ?? body?.errors?.[0]?.message ?? response.statusText;
    throw new Error(`${label} failed (${response.status}): ${detail}`);
  }
  return body;
}

const INTROSPECTION_QUERY = `
query IntrospectionQuery {
  __schema {
    description
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
        args {
          name
          description
          defaultValue
          type { ...TypeRef }
        }
        type { ...TypeRef }
      }
      inputFields {
        name
        description
        defaultValue
        type { ...TypeRef }
      }
      interfaces { ...TypeRef }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
      possibleTypes { ...TypeRef }
    }
    directives {
      name
      description
      locations
      args {
        name
        description
        defaultValue
        type { ...TypeRef }
      }
    }
  }
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType { kind name }
      }
    }
  }
}`;

function typeName(type) {
  if (!type) return "unknown";
  if (type.kind === "NON_NULL") return `${typeName(type.ofType)}!`;
  if (type.kind === "LIST") return `[${typeName(type.ofType)}]`;
  return type.name ?? type.kind;
}

async function inspectGraphql(outputDirectory) {
  requireEnv(["BIGCOMMERCE_STORE_HASH"]);
  const token =
    process.env.BIGCOMMERCE_STOREFRONT_PRIVATE_TOKEN ||
    process.env.BIGCOMMERCE_STOREFRONT_TOKEN;
  if (!token) {
    throw new Error(
      "Missing environment variable: BIGCOMMERCE_STOREFRONT_PRIVATE_TOKEN (preferred) or BIGCOMMERCE_STOREFRONT_TOKEN",
    );
  }
  const endpoint =
    process.env.BIGCOMMERCE_STOREFRONT_GRAPHQL_URL ||
    `https://store-${process.env.BIGCOMMERCE_STORE_HASH}.mybigcommerce.com/graphql`;

  console.log(`Inspecting Storefront GraphQL at ${new URL(endpoint).host}...`);
  const response = await fetchJson(
    endpoint,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: INTROSPECTION_QUERY }),
    },
    "GraphQL introspection",
  );

  if (response.errors?.length) {
    throw new Error(
      `GraphQL introspection failed: ${response.errors[0].message}`,
    );
  }

  const schema = response.data.__schema;
  const publicTypes = schema.types.filter(
    (type) => !type.name.startsWith("__"),
  );
  const summary = {
    endpointHost: new URL(endpoint).host,
    inspectedAt: new Date().toISOString(),
    queryType: schema.queryType?.name ?? null,
    mutationType: schema.mutationType?.name ?? null,
    typeCount: publicTypes.length,
    types: publicTypes.map((type) => ({
      kind: type.kind,
      name: type.name,
      fields:
        type.fields?.map((field) => ({
          name: field.name,
          type: typeName(field.type),
          args: field.args.map((argument) => ({
            name: argument.name,
            type: typeName(argument.type),
          })),
        })) ?? [],
      inputFields:
        type.inputFields?.map((field) => ({
          name: field.name,
          type: typeName(field.type),
        })) ?? [],
      enumValues: type.enumValues?.map((value) => value.name) ?? [],
    })),
  };

  await writeJson(
    path.join(outputDirectory, "storefront-graphql-schema.json"),
    response.data,
  );
  await writeJson(
    path.join(outputDirectory, "storefront-graphql-summary.json"),
    summary,
  );
  return summary;
}

function mergeShape(current, value) {
  if (value === null) return current ?? { types: ["null"] };
  const kind = Array.isArray(value) ? "array" : typeof value;
  const result = current ?? { types: [] };
  if (!result.types.includes(kind)) result.types.push(kind);

  if (kind === "object") {
    result.fields ??= {};
    for (const [key, child] of Object.entries(value)) {
      result.fields[key] = mergeShape(result.fields[key], child);
    }
  } else if (kind === "array") {
    for (const child of value) result.items = mergeShape(result.items, child);
  }
  return result;
}

async function inspectCatalog(outputDirectory, limit) {
  requireEnv(["BIGCOMMERCE_STORE_HASH", "BIGCOMMERCE_ACCESS_TOKEN"]);
  const apiRoot = `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_HASH}`;
  const baseUrl = `${apiRoot}/v3`;
  const headers = {
    Accept: "application/json",
    "X-Auth-Token": process.env.BIGCOMMERCE_ACCESS_TOKEN,
  };

  const get = (pathname, label) =>
    fetchJson(`${baseUrl}${pathname}`, { headers }, label);
  const getAbsolute = (url, label) => fetchJson(url, { headers }, label);
  console.log(
    `Sampling ${limit} product(s) from the Management Catalog API...`,
  );

  const productQuery =
    `/catalog/products?limit=${limit}` +
    "&include=variants,images,custom_fields,options,modifiers,videos";
  const [
    firstProductsResponse,
    categoryTreesResponse,
    brandsResponse,
    rawStoreInfo,
  ] = await Promise.all([
    get(productQuery, "Products request"),
    get("/catalog/trees", "Category trees request"),
    get(`/catalog/brands?limit=${Math.max(limit, 10)}`, "Brands request"),
    getAbsolute(`${apiRoot}/v2/store`, "Store information request").catch(
      (error) => ({ inspectionError: error.message }),
    ),
  ]);

  const storeInfo = rawStoreInfo.inspectionError
    ? { inspectionError: rawStoreInfo.inspectionError }
    : {
        name: rawStoreInfo.name ?? null,
        domain: rawStoreInfo.domain ?? null,
        secureUrl: rawStoreInfo.secure_url ?? null,
        currency: rawStoreInfo.currency ?? null,
        currencySymbol: rawStoreInfo.currency_symbol ?? null,
        timezone: rawStoreInfo.timezone?.name ?? rawStoreInfo.timezone ?? null,
        weightUnits: rawStoreInfo.weight_units ?? null,
        dimensionUnits: rawStoreInfo.dimension_units ?? null,
      };

  const productPages = [firstProductsResponse];
  const totalProductPages =
    firstProductsResponse.meta?.pagination?.total_pages ?? 1;
  let retrievedProductCount = firstProductsResponse.data?.length ?? 0;
  for (
    let page = 2;
    page <= totalProductPages && retrievedProductCount < limit;
    page += 1
  ) {
    const response = await get(
      `${productQuery}&page=${page}`,
      `Products page ${page}`,
    );
    retrievedProductCount += response.data?.length ?? 0;
    productPages.push(response);
  }
  const products = productPages
    .flatMap((response) => response.data ?? [])
    .slice(0, limit);
  const productsResponse = {
    ...firstProductsResponse,
    data: products,
    inspection: {
      requestedLimit: limit,
      retrieved: products.length,
      sourcePages: productPages.length,
    },
  };

  const categoriesByTree = await Promise.all(
    (categoryTreesResponse.data ?? []).map(async (tree) => ({
      treeId: tree.id,
      treeName: tree.name,
      response: await get(
        `/catalog/trees/${tree.id}/categories?limit=250`,
        `Categories for tree ${tree.id}`,
      ),
    })),
  );

  const metafieldResults = await Promise.all(
    products.map(async (product) => {
      try {
        const response = await get(
          `/catalog/products/${product.id}/metafields?limit=50`,
          `Metafields for ${product.id}`,
        );
        return { productId: product.id, data: response.data ?? [] };
      } catch (error) {
        return { productId: product.id, error: error.message };
      }
    }),
  );

  const snapshot = {
    inspectedAt: new Date().toISOString(),
    sampleLimit: limit,
    store: storeInfo,
    products: productsResponse,
    categoryTrees: categoryTreesResponse,
    categoriesByTree,
    brands: brandsResponse,
    productMetafields: metafieldResults,
  };
  const shapes = {
    note: "Inferred from this store sample; REST responses are not a complete formal schema.",
    products: products.reduce(
      (shape, product) => mergeShape(shape, product),
      null,
    ),
    categoryTrees: (categoryTreesResponse.data ?? []).reduce(
      (shape, tree) => mergeShape(shape, tree),
      null,
    ),
    categories: categoriesByTree
      .flatMap((tree) => tree.response.data ?? [])
      .reduce((shape, category) => mergeShape(shape, category), null),
    brands: (brandsResponse.data ?? []).reduce(
      (shape, brand) => mergeShape(shape, brand),
      null,
    ),
    metafields: metafieldResults
      .flatMap((result) => result.data ?? [])
      .reduce((shape, metafield) => mergeShape(shape, metafield), null),
  };

  await writeJson(
    path.join(outputDirectory, "management-catalog-sample.json"),
    snapshot,
  );
  await writeJson(
    path.join(outputDirectory, "management-catalog-shapes.json"),
    shapes,
  );
  return { productCount: products.length, shapes };
}

async function writeJson(filename, value) {
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(ROOT, filename)}`);
}

async function writeReport(outputDirectory, results) {
  const lines = [
    "# BigCommerce inspection",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This is a read-only snapshot. REST shapes are inferred from sampled store data, while the GraphQL file is a formal introspection result.",
    "",
  ];

  if (results.graphql) {
    lines.push(
      "## Storefront GraphQL",
      "",
      `- Query root: \`${results.graphql.queryType}\``,
      `- Mutation root: \`${results.graphql.mutationType ?? "none"}\``,
      `- Public types: ${results.graphql.typeCount}`,
      "- Files: `storefront-graphql-schema.json`, `storefront-graphql-summary.json`",
      "",
    );
  }
  if (results.catalog) {
    lines.push(
      "## Management Catalog REST",
      "",
      `- Products sampled: ${results.catalog.productCount}`,
      "- Includes product variants, images, options, modifiers, custom fields, videos, metafields, category trees, and brands.",
      "- Files: `management-catalog-sample.json`, `management-catalog-shapes.json`",
      "",
    );
  }

  lines.push(
    "## Suggested next step",
    "",
    "Compare these outputs with the canonical product fields in `DOCUMENTATION.md`, then implement an explicit BigCommerce-to-canonical mapper in the backend.",
    "",
  );
  await writeFile(
    path.join(outputDirectory, "README.md"),
    lines.join("\n"),
    "utf8",
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await loadEnvironment(options.envFile);
  await mkdir(options.output, { recursive: true });

  const results = {};
  if (options.mode === "all" || options.mode === "graphql") {
    results.graphql = await inspectGraphql(options.output);
  }
  if (options.mode === "all" || options.mode === "catalog") {
    results.catalog = await inspectCatalog(options.output, options.limit);
  }
  await writeReport(options.output, results);
  console.log(
    `Done. Open ${path.relative(ROOT, path.join(options.output, "README.md"))}`,
  );
}

main().catch((error) => {
  console.error(`\nBigCommerce inspection failed: ${error.message}`);
  process.exitCode = 1;
});
