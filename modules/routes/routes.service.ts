import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateRouteInput, UpdateRouteInput } from "./routes.schemas";

// Convert [lat, lng][] → PostGIS LINESTRING WKT (lng lat order)
function toLineStringWkt(points: [number, number][]): string {
  const coords = points.map(([lat, lng]) => `${lng} ${lat}`).join(", ");
  return `LINESTRING(${coords})`;
}

export async function createRoute(input: CreateRouteInput) {
  const wkt = toLineStringWkt(input.points as [number, number][]);
  const rows = await prisma.$queryRaw<{ id: number; name: string }[]>`
    INSERT INTO "Route" (name, "truckId", path, "createdAt")
    VALUES (
      ${input.name},
      ${input.truckId},
      ST_GeomFromText(${wkt}, 4326),
      NOW()
    )
    RETURNING id, name
  `;
  return rows[0];
}

export async function listRoutes() {
  return prisma.route.findMany({
    include: { truck: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateRoute(id: number, input: UpdateRouteInput) {
  const existing = await prisma.route.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Route");
  return prisma.route.update({
    where: { id },
    data: { truckId: input.truckId },
    include: { truck: { select: { id: true, name: true } } },
  });
}

export async function deleteRoute(id: number) {
  const existing = await prisma.route.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Route");
  await prisma.route.delete({ where: { id } });
}

export async function listRoutesGeodata() {
  return prisma.$queryRaw<
    { id: number; name: string; truckId: number | null; truckName: string | null; geojson: string }[]
  >`
    SELECT
      r.id,
      r.name,
      r."truckId",
      t.name AS "truckName",
      ST_AsGeoJSON(r.path)::text AS geojson
    FROM "Route" r
    LEFT JOIN "Truck" t ON t.id = r."truckId"
    ORDER BY r."createdAt" DESC
  `;
}
