import { type NextRequest } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-context";
import { createDeviceSchema } from "@/modules/devices/devices.schemas";
import { createDevice, listDevices } from "@/modules/devices/devices.service";
import { handleError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const devices = await listDevices();
    return Response.json({ success: true, data: devices });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body  = await request.json();
    const input = createDeviceSchema.parse(body);
    const device = await createDevice(input);
    return Response.json({ success: true, data: device }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
