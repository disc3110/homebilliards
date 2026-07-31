import { z } from "zod";

export const ServiceCheckSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["up", "down"]),
});

export const ServiceHealthSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  service: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.iso.datetime(),
  uptimeSeconds: z.number().nonnegative(),
  checks: z.array(ServiceCheckSchema),
});

export type ServiceCheck = z.infer<typeof ServiceCheckSchema>;
export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;

export const ApiInfoSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  environment: z.string().min(1),
  health: z.string().startsWith("/"),
});

export type ApiInfo = z.infer<typeof ApiInfoSchema>;
