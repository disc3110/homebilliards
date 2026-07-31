const assert = require("node:assert/strict");
const { test } = require("node:test");

const { ServiceHealthSchema } = require("@home-billiards/contracts");
const { HealthService } = require("../dist/health/health.service.js");

test("health service returns the shared health contract", () => {
  const result = ServiceHealthSchema.safeParse(
    new HealthService().getHealth(),
  );

  assert.equal(result.success, true);
  assert.equal(result.data.status, "ok");
  assert.equal(result.data.service, "home-billiards-api");
});
