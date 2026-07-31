import { Injectable } from "@nestjs/common";
import type { ServiceHealth } from "@home-billiards/contracts";

@Injectable()
export class HealthService {
  getHealth(): ServiceHealth {
    return this.createResponse();
  }

  getReadiness(): ServiceHealth {
    return this.createResponse();
  }

  private createResponse(): ServiceHealth {
    return {
      status: "ok",
      service: "home-billiards-api",
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      checks: [{ name: "application", status: "up" }],
    };
  }
}
