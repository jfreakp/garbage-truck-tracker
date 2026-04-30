import { prisma } from "@/lib/prisma";

interface BarrioRow {
  id: number;
  name: string;
}

/**
 * Returns the barrio whose polygon contains (lat, lng).
 * Uses PostGIS ST_Contains + ST_SetSRID + ST_MakePoint.
 */
export async function findBarrioByCoords(
  lat: number,
  lng: number
): Promise<BarrioRow | null> {
  const rows = await prisma.$queryRaw<BarrioRow[]>`
    SELECT id, name
    FROM "Barrio"
    WHERE ST_Contains(
      polygon,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    )
    LIMIT 1
  `;

  return rows[0] ?? null;
}

/**
 * Returns all barrios whose polygon is within `meters` of (lat, lng).
 * Useful for the NEAR notification type.
 */
export async function findBarriosNear(
  lat: number,
  lng: number,
  meters: number
): Promise<BarrioRow[]> {
  return prisma.$queryRaw<BarrioRow[]>`
    SELECT id, name
    FROM "Barrio"
    WHERE ST_DWithin(
      polygon::geography,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${meters}
    )
  `;
}

/**
 * Inserts a barrio with a PostGIS polygon from WKT.
 * WKT format: 'POLYGON((lng lat, lng lat, ..., lng lat))'
 */
export async function createBarrioWithPolygon(
  name: string,
  polygonWkt: string
): Promise<{ id: number; name: string }> {
  const rows = await prisma.$queryRaw<{ id: number; name: string }[]>`
    INSERT INTO "Barrio" (name, polygon, "createdAt")
    VALUES (
      ${name},
      ST_GeomFromText(${polygonWkt}, 4326),
      NOW()
    )
    RETURNING id, name
  `;
  return rows[0];
}
