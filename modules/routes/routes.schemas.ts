import { z } from "zod/v4";

export const createRouteSchema = z.object({
  name:    z.string().min(1).max(100),
  truckId: z.number().int().positive(),
  // Array of [lat, lng] waypoints — min 2 points to form a line
  points:  z.array(z.tuple([z.number(), z.number()])).min(2),
});

export const updateRouteSchema = z.object({
  truckId: z.number().int().positive(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
