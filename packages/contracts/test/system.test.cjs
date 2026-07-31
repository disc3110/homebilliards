const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  ApiInfoSchema,
  ServiceHealthSchema,
} = require("../dist/index.js");

test("accepts the API information contract", () => {
  const result = ApiInfoSchema.safeParse({
    name: "home-billiards-api",
    version: "0.1.0",
    environment: "test",
    health: "/v1/health",
  });

  assert.equal(result.success, true);
});

test("rejects an invalid health timestamp", () => {
  const result = ServiceHealthSchema.safeParse({
    status: "ok",
    service: "home-billiards-api",
    version: "0.1.0",
    timestamp: "not-a-date",
    uptimeSeconds: 1,
    checks: [{ name: "application", status: "up" }],
  });

  assert.equal(result.success, false);
});
