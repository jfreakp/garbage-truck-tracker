import { type NextRequest } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-context";
import { getTruck, updateTruck, deleteTruck } from "@/modules/trucks/trucks.service";
import { updateTruckSchema } from "@/modules/trucks/trucks.schemas";
import { handleError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const truck = await getTruck(Number(id));
    return Response.json({ success: true, data: truck });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const input = updateTruckSchema.parse(body);
    const truck = await updateTruck(Number(id), input);
    return Response.json({ success: true, data: truck });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    await deleteTruck(Number(id));
    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
