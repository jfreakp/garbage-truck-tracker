import { z } from "zod/v4";

export const updateUserSchema = z.object({
  name:             z.string().min(2).max(100).optional(),
  lat:              z.number().optional(),
  lng:              z.number().optional(),
  barrioId:         z.number().int().positive().nullable().optional(),
  fcmToken:         z.string().nullable().optional(),
  alertProximity:   z.boolean().optional(),
  alertDelayed:     z.boolean().optional(),
  alertReminder:    z.boolean().optional(),
  alertEntry:       z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
