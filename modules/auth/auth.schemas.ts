import { z } from "zod/v4";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8).max(72),
  lat: z.number().optional(),
  lng: z.number().optional(),
  barrioId: z.number().int().positive().optional(),
  fcmToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
