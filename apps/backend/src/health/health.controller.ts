import { Controller, Get, Header } from "@nestjs/common";
import type { ServiceHealth } from "@home-billiards/contracts";

import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  getHealth(): ServiceHealth {
    return this.healthService.getHealth();
  }

  @Get("ready")
  @Header("Cache-Control", "no-store")
  getReadiness(): ServiceHealth {
    return this.healthService.getReadiness();
  }
}
