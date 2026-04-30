import { z } from "zod/v4";

export const createBarrioSchema = z.object({
  name: z.string().min(1).max(100),
  // WKT polygon, e.g.: "POLYGON((-74.0 4.7, -74.1 4.7, -74.1 4.8, -74.0 4.8, -74.0 4.7))"
  polygonWkt: z
    .string()
    .regex(
      /^POLYGON\s*\(/i,
      "Must be a WKT POLYGON string, e.g. POLYGON((lng lat, ...))"
    ),
});

export const updateBarrioSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  visibleOnMap: z.boolean().optional(),
});

export type CreateBarrioInput = z.infer<typeof createBarrioSchema>;
export type UpdateBarrioInput = z.infer<typeof updateBarrioSchema>;
