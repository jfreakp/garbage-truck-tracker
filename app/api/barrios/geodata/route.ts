import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/errors";

// Returns each barrio with its polygon as a GeoJSON geometry string
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const rows = await prisma.$queryRaw<
      { id: number; name: string; geojson: string }[]
    >`
      SELECT id, name, ST_AsGeoJSON(polygon)::text AS geojson
      FROM "Barrio"
      WHERE "visibleOnMap" = TRUE
      ORDER BY name ASC
    `;

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      geojson: r.geojson ? JSON.parse(r.geojson) : null,
    }));

    return Response.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}
