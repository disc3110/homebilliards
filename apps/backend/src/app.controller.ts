import { Controller, Get } from "@nestjs/common";
import type { ApiInfo } from "@home-billiards/contracts";

@Controller()
export class AppController {
  @Get()
  getApiInfo(): ApiInfo {
    return {
      name: "home-billiards-api",
      version: process.env.npm_package_version ?? "0.1.0",
      environment: process.env.NODE_ENV ?? "development",
      health: "/v1/health",
    };
  }
}
