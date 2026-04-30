import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { createBarrioWithPolygon } from "@/modules/geo/geo.service";
import type { CreateBarrioInput, UpdateBarrioInput } from "./barrios.schemas";

export async function createBarrio(input: CreateBarrioInput) {
  return createBarrioWithPolygon(input.name, input.polygonWkt);
}

export async function listBarrios() {
  return prisma.barrio.findMany({
    select: { id: true, name: true, visibleOnMap: true, createdAt: true },
    orderBy: { name: "asc" },
  });
}

export async function updateBarrio(id: number, input: UpdateBarrioInput) {
  const existing = await prisma.barrio.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Barrio");
  return prisma.barrio.update({
    where: { id },
    data: {
      ...(input.name         !== undefined && { name: input.name }),
      ...(input.visibleOnMap !== undefined && { visibleOnMap: input.visibleOnMap }),
    },
  });
}

export async function deleteBarrio(id: number) {
  const existing = await prisma.barrio.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Barrio");
  await prisma.barrio.delete({ where: { id } });
}

export async function getBarrio(id: number) {
  const barrio = await prisma.barrio.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
  });

  if (!barrio) throw new NotFoundError("Barrio");
  return barrio;
}
