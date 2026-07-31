import type { ServiceHealth } from "@home-billiards/contracts";

export function GET(): Response {
  const response: ServiceHealth = {
    status: "ok",
    service: "home-billiards-admin",
    version: process.env.npm_package_version ?? "0.1.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    checks: [{ name: "application", status: "up" }],
  };

  return Response.json(response, {
    headers: { "Cache-Control": "no-store" },
  });
}
