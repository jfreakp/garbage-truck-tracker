import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { listRoutesGeodata } from "@/modules/routes/routes.service";
import { handleError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const rows = await listRoutesGeodata();
    const data = rows.map((r) => ({
      id:        r.id,
      name:      r.name,
      truckId:   r.truckId,
      truckName: r.truckName,
      geojson:   r.geojson ? JSON.parse(r.geojson) : null,
    }));
    return Response.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}
