import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { CreateScheduleInput, UpdateScheduleInput } from "./schedules.schemas";

export async function listSchedules() {
  return prisma.wasteSchedule.findMany({ orderBy: { dayOfWeek: "asc" } });
}

export async function getSchedule(id: number) {
  const s = await prisma.wasteSchedule.findUnique({ where: { id } });
  if (!s) throw new NotFoundError("Horario");
  return s;
}

export async function createSchedule(input: CreateScheduleInput) {
  const existing = await prisma.wasteSchedule.findUnique({
    where: { dayOfWeek: input.dayOfWeek },
  });
  if (existing) throw new ConflictError("Ya existe un horario para ese día de la semana");

  return prisma.wasteSchedule.create({ data: input });
}

export async function updateSchedule(id: number, input: UpdateScheduleInput) {
  const existing = await prisma.wasteSchedule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Horario");
  return prisma.wasteSchedule.update({ where: { id }, data: input });
}

export async function deleteSchedule(id: number) {
  const existing = await prisma.wasteSchedule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Horario");
  await prisma.wasteSchedule.delete({ where: { id } });
}
