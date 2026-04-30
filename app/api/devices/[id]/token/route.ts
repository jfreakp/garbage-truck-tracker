import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { regenerateToken } from "@/modules/devices/devices.service";
import { handleError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/devices/:id/token — genera un nuevo token para el equipo */
export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const device = await regenerateToken(Number(id));
    return Response.json({ success: true, data: device });
  } catch (error) {
    return handleError(error);
  }
}
