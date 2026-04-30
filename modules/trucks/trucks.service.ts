import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { NotFoundError } from "@/lib/errors";
import { findBarrioByCoords, findBarriosNear } from "@/modules/geo/geo.service";
import { eventBus } from "@/modules/events/event-bus";
import type { UpdateLocationInput, CreateTruckInput, UpdateTruckInput } from "./trucks.schemas";

const NEAR_RADIUS_METERS = 500;

export async function createTruck(input: CreateTruckInput) {
  return prisma.truck.create({
    data: { name: input.name },
  });
}

export async function listTrucks() {
  return prisma.truck.findMany({
    include: { currentBarrio: { select: { id: true, name: true } } },
    orderBy: { id: "asc" },
  });
}

export async function updateTruck(id: number, input: UpdateTruckInput) {
  const existing = await prisma.truck.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Truck");
  return prisma.truck.update({ where: { id }, data: { name: input.name } });
}

export async function deleteTruck(id: number) {
  const existing = await prisma.truck.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Truck");
  await prisma.truck.delete({ where: { id } });
}

export async function getTruck(id: number) {
  const truck = await prisma.truck.findUnique({
    where: { id },
    include: { currentBarrio: { select: { id: true, name: true } } },
  });

  if (!truck) throw new NotFoundError("Truck");
  return truck;
}

/**
 * Core function: receives a GPS ping, persists it, detects barrio changes,
 * and emits events when the truck enters or gets near a barrio.
 */
export async function updateTruckLocation(input: UpdateLocationInput) {
  const truck = await prisma.truck.findUnique({
    where: { id: input.truckId },
    select: { id: true, currentBarrioId: true },
  });

  if (!truck) throw new NotFoundError("Truck");

  // Persist new coordinates + append to history
  await prisma.$transaction([
    prisma.truck.update({
      where: { id: input.truckId },
      data: { lat: input.lat, lng: input.lng },
    }),
    prisma.locationHistory.create({
      data: { truckId: input.truckId, lat: input.lat, lng: input.lng },
    }),
  ]);

  // ── Geo detection ──────────────────────────────────────────────────────────

  // 1. Check ENTRY: truck is inside a barrio polygon
  const insideBarrio = await findBarrioByCoords(input.lat, input.lng);

  if (insideBarrio) {
    const previousBarrioId = truck.currentBarrioId;
    const enteredNewBarrio = insideBarrio.id !== previousBarrioId;

    // Update truck's current barrio
    await prisma.truck.update({
      where: { id: input.truckId },
      data: { currentBarrioId: insideBarrio.id },
    });

    if (enteredNewBarrio) {
      logger.info("Truck entered barrio", {
        truckId: input.truckId,
        barrioId: insideBarrio.id,
        barrioName: insideBarrio.name,
      });

      await eventBus.emit("ENTERED_BARRIO", {
        truckId: input.truckId,
        barrioId: insideBarrio.id,
        barrioName: insideBarrio.name,
      });
    }

    return {
      truckId: input.truckId,
      lat: input.lat,
      lng: input.lng,
      insideBarrio,
      nearBarrios: [],
    };
  }

  // Truck is not inside any barrio → clear currentBarrioId if it was set
  if (truck.currentBarrioId !== null) {
    await prisma.truck.update({
      where: { id: input.truckId },
      data: { currentBarrioId: null },
    });
  }

  // 2. Check NEAR: truck is within NEAR_RADIUS_METERS of a barrio
  const nearBarrios = await findBarriosNear(
    input.lat,
    input.lng,
    NEAR_RADIUS_METERS
  );

  for (const barrio of nearBarrios) {
    await eventBus.emit("NEAR_BARRIO", {
      truckId: input.truckId,
      barrioId: barrio.id,
      barrioName: barrio.name,
    });
  }

  return {
    truckId: input.truckId,
    lat: input.lat,
    lng: input.lng,
    insideBarrio: null,
    nearBarrios,
  };
}
