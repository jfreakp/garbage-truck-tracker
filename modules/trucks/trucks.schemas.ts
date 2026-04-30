import { z } from "zod/v4";

export const updateLocationSchema = z.object({
  truckId: z.number().int().positive(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const createTruckSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateTruckSchema = z.object({
  name: z.string().min(1).max(100),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CreateTruckInput   = z.infer<typeof createTruckSchema>;
export type UpdateTruckInput   = z.infer<typeof updateTruckSchema>;
