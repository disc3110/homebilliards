#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLAN_DIRECTORY = path.join(ROOT, "planning", "storefront");

const errors = [];
const warnings = [];

function parseCsv(text, filename) {
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      record.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      record.push(field);
      field = "";
      if (record.some((value) => value !== "")) records.push(record);
      record = [];
    } else {
      field += character;
    }
  }

  if (quoted) errors.push(`${filename}: unmatched quote`);
  if (field !== "" || record.length > 0) {
    record.push(field);
    if (record.some((value) => value !== "")) records.push(record);
  }

  if (records.length === 0) {
    errors.push(`${filename}: file is empty`);
    return [];
  }

  const headers = records[0].map((value) => value.replace(/^\uFEFF/u, "").trim());

  return records.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) {
      errors.push(
        `${filename}:${rowIndex + 2}: expected ${headers.length} columns, found ${values.length}`,
      );
    }

    return Object.fromEntries(
      headers.map((header, columnIndex) => [header, (values[columnIndex] ?? "").trim()]),
    );
  });
}

async function readCsv(filename) {
  return parseCsv(
    await readFile(path.join(PLAN_DIRECTORY, filename), "utf8"),
    filename,
  );
}

function requireFields(rows, fields, filename) {
  rows.forEach((row, index) => {
    for (const field of fields) {
      if (!row[field]) errors.push(`${filename}:${index + 2}: missing ${field}`);
    }
  });
}

function checkUnique(rows, field, filename) {
  const seen = new Map();
  rows.forEach((row, index) => {
    const value = row[field];
    if (!value) return;
    const previous = seen.get(value);
    if (previous !== undefined) {
      errors.push(
        `${filename}:${index + 2}: duplicate ${field} "${value}" (first seen on row ${previous})`,
      );
    } else {
      seen.set(value, index + 2);
    }
  });
}

function splitPipe(value) {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

const [routes, mappings, redirects, contentRules] = await Promise.all([
  readCsv("url-registry.csv"),
  readCsv("bigcommerce-category-mapping.csv"),
  readCsv("redirect-map.csv"),
  readCsv("content-template-matrix.csv"),
]);

requireFields(
  routes,
  [
    "route_id",
    "source",
    "label",
    "canonical_path",
    "page_type",
    "navigation",
    "indexability",
    "content_shape",
    "product_title_shape",
    "launch_phase",
    "status",
  ],
  "url-registry.csv",
);
checkUnique(routes, "route_id", "url-registry.csv");
checkUnique(routes, "canonical_path", "url-registry.csv");

const routeIds = new Set(routes.map((route) => route.route_id));
const canonicalPaths = new Set(routes.map((route) => route.canonical_path));

for (const [index, route] of routes.entries()) {
  if (!route.canonical_path.startsWith("/")) {
    errors.push(`url-registry.csv:${index + 2}: path must start with /`);
  }
  if (route.canonical_path !== "/" && route.canonical_path.endsWith("/")) {
    errors.push(`url-registry.csv:${index + 2}: canonical path must not end with /`);
  }
  if (/[A-Z\s]/u.test(route.canonical_path)) {
    errors.push(`url-registry.csv:${index + 2}: canonical path must be lowercase and contain no spaces`);
  }
  if (route.parent_route_id && !routeIds.has(route.parent_route_id)) {
    errors.push(
      `url-registry.csv:${index + 2}: unknown parent_route_id "${route.parent_route_id}"`,
    );
  }
}

requireFields(
  mappings,
  ["new_route_id", "new_path", "mapping_action", "notes", "status"],
  "bigcommerce-category-mapping.csv",
);
checkUnique(mappings, "new_route_id", "bigcommerce-category-mapping.csv");

const mappedRouteIds = new Set(mappings.map((mapping) => mapping.new_route_id));
for (const [index, mapping] of mappings.entries()) {
  if (!routeIds.has(mapping.new_route_id)) {
    errors.push(
      `bigcommerce-category-mapping.csv:${index + 2}: unknown route "${mapping.new_route_id}"`,
    );
  }
  const registeredPath = routes.find(
    (route) => route.route_id === mapping.new_route_id,
  )?.canonical_path;
  if (registeredPath && registeredPath !== mapping.new_path) {
    errors.push(
      `bigcommerce-category-mapping.csv:${index + 2}: path differs from registry (${registeredPath})`,
    );
  }
  for (const categoryId of splitPipe(mapping.current_category_ids)) {
    if (!/^\d+$/u.test(categoryId)) {
      errors.push(
        `bigcommerce-category-mapping.csv:${index + 2}: invalid category ID "${categoryId}"`,
      );
    }
  }
}

for (const route of routes.filter((item) => item.source === "JORDAN")) {
  if (!mappedRouteIds.has(route.route_id)) {
    errors.push(`Jordan route "${route.route_id}" has no BigCommerce mapping row`);
  }
}

requireFields(
  redirects,
  [
    "legacy_path",
    "target_path",
    "source_category_id",
    "production_status",
    "staging_status",
    "reason",
    "status",
  ],
  "redirect-map.csv",
);
checkUnique(redirects, "legacy_path", "redirect-map.csv");

for (const [index, redirect] of redirects.entries()) {
  if (!redirect.legacy_path.startsWith("/")) {
    errors.push(`redirect-map.csv:${index + 2}: legacy path must start with /`);
  }
  if (
    redirect.target_path !== "TBD" &&
    !canonicalPaths.has(redirect.target_path)
  ) {
    errors.push(
      `redirect-map.csv:${index + 2}: target "${redirect.target_path}" is not a registered canonical path`,
    );
  }
  if (redirect.production_status !== "301") {
    errors.push(`redirect-map.csv:${index + 2}: production redirect must be 301`);
  }
  if (redirect.staging_status !== "307") {
    errors.push(`redirect-map.csv:${index + 2}: staging redirect must be 307`);
  }
}

requireFields(
  contentRules,
  [
    "field",
    "scope",
    "release",
    "template_or_rule",
    "source_data",
    "manual_override",
    "qa_rule",
  ],
  "content-template-matrix.csv",
);
checkUnique(contentRules, "field", "content-template-matrix.csv");

const auditFile = path.join(
  ROOT,
  "artifacts",
  "bigcommerce-inspection",
  "management-catalog-audit.json",
);
const audit = JSON.parse(await readFile(auditFile, "utf8"));
const referencedCategoryIds = new Set([
  ...mappings.flatMap((mapping) => splitPipe(mapping.current_category_ids)),
  ...redirects.map((redirect) => redirect.source_category_id),
]);
const missingCurrentCategories = (audit.categoryUsage ?? []).filter(
  (category) => !referencedCategoryIds.has(String(category.id)),
);

for (const category of missingCurrentCategories) {
  errors.push(
    `Current BigCommerce category ${category.id} (${category.path.join(" > ")}) has no mapping or redirect decision`,
  );
}

const pendingRouteCount = routes.filter((route) =>
  route.status.includes("pending"),
).length;
const tbdRedirectCount = redirects.filter(
  (redirect) => redirect.target_path === "TBD",
).length;
const pendingMappingCount = mappings.filter((mapping) =>
  mapping.status.includes("pending"),
).length;

if (pendingRouteCount > 0) {
  warnings.push(`${pendingRouteCount} routes still require approval`);
}
if (pendingMappingCount > 0) {
  warnings.push(`${pendingMappingCount} category mappings still require approval or cleanup`);
}
if (tbdRedirectCount > 0) {
  warnings.push(`${tbdRedirectCount} legacy paths still have a TBD destination`);
}

console.log("Storefront planning validation");
console.log(`Routes: ${routes.length}`);
console.log(`Jordan routes: ${routes.filter((route) => route.source === "JORDAN").length}`);
console.log(`BigCommerce mappings: ${mappings.length}`);
console.log(`Legacy redirects: ${redirects.length}`);
console.log(`Content rules: ${contentRules.length}`);

for (const warning of warnings) console.warn(`WARNING: ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`Validation failed with ${errors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log("Validation passed with no structural errors.");
}
