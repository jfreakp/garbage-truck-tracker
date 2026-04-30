import { z } from "zod/v4";

const BIN_COLORS = ["VERDE", "NEGRA", "NINGUNO"] as const;
const TIME_RE    = /^\d{2}:\d{2}$/;

export const createScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  binColor:  z.enum(BIN_COLORS),
  startTime: z.string().regex(TIME_RE).optional(),
  endTime:   z.string().regex(TIME_RE).optional(),
  active:    z.boolean().optional(),
  notes:     z.string().max(200).nullable().optional(),
});

export const updateScheduleSchema = z.object({
  binColor:  z.enum(BIN_COLORS).optional(),
  startTime: z.string().regex(TIME_RE).optional(),
  endTime:   z.string().regex(TIME_RE).optional(),
  active:    z.boolean().optional(),
  notes:     z.string().max(200).nullable().optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
