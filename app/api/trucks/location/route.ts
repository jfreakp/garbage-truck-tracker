import { type NextRequest } from "next/server";
import { z } from "zod/v4";
import { updateLocationSchema } from "@/modules/trucks/trucks.schemas";
import { updateTruckLocation } from "@/modules/trucks/trucks.service";
import { findActiveDeviceByToken } from "@/modules/devices/devices.service";
import { requireAuth } from "@/lib/auth-context";
import { handleError, UnauthorizedError } from "@/lib/errors";

// Schema for device-authenticated pings (no truckId — comes from the token)
const devicePingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * POST /api/trucks/location
 *
 * Two authentication modes:
 *
 * 1. Device token  — header `X-Device-Token: <token>`
 *    Body: { lat, lng }
 *    The truckId is resolved from the registered device.
 *
 * 2. Admin JWT     — header `Authorization: Bearer <jwt>`
 *    Body: { truckId, lat, lng }
 *    Used by the simulator / admin tools.
 */
export async function POST(request: NextRequest) {
  try {
    const deviceToken = request.headers.get("x-device-token");

    if (deviceToken) {
      // ── Device auth ────────────────────────────────────────────────────
      const device = await findActiveDeviceByToken(deviceToken);
      if (!device) throw new UnauthorizedError("Token de dispositivo inválido o inactivo");

      const body  = await request.json();
      const input = devicePingSchema.parse(body);
      const result = await updateTruckLocation({
        truckId: device.truckId,
        lat:     input.lat,
        lng:     input.lng,
      });
      return Response.json({ success: true, data: result });
    }

    // ── Admin JWT auth ─────────────────────────────────────────────────
    await requireAuth(request);
    const body  = await request.json();
    const input = updateLocationSchema.parse(body);
    const result = await updateTruckLocation(input);
    return Response.json({ success: true, data: result });

  } catch (error) {
    return handleError(error);
  }
}
