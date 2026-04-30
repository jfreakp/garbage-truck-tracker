import { z } from "zod/v4";

export const createDeviceSchema = z.object({
  name:    z.string().min(1).max(200),
  truckId: z.number().int().positive(),
});

export const updateDeviceSchema = z.object({
  name:    z.string().min(1).max(200).optional(),
  active:  z.boolean().optional(),
  truckId: z.number().int().positive().optional(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
