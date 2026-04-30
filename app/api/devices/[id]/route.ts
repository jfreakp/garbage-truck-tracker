import { type NextRequest } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-context";
import { updateDeviceSchema } from "@/modules/devices/devices.schemas";
import { deleteDevice, getDevice, updateDevice } from "@/modules/devices/devices.service";
import { handleError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const device = await getDevice(Number(id));
    return Response.json({ success: true, data: device });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body  = await request.json();
    const input = updateDeviceSchema.parse(body);
    const device = await updateDevice(Number(id), input);
    return Response.json({ success: true, data: device });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    await deleteDevice(Number(id));
    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
