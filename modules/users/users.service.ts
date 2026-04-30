import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { UpdateUserInput } from "./users.schemas";

const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  lat: true,
  lng: true,
  fcmToken: true,
  barrioId: true,
  createdAt: true,
  barrio: { select: { id: true, name: true } },
  alertProximity: true,
  alertDelayed:   true,
  alertReminder:  true,
  alertEntry:     true,
} as const;

export async function getUser(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: SAFE_SELECT,
  });

  if (!user) throw new NotFoundError("User");
  return user;
}

export async function updateUser(id: number, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!user) throw new NotFoundError("User");

  return prisma.user.update({
    where: { id },
    data: input,
    select: SAFE_SELECT,
  });
}
