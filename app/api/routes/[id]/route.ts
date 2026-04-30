import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { updateRouteSchema } from "@/modules/routes/routes.schemas";
import { deleteRoute, updateRoute } from "@/modules/routes/routes.service";
import { handleError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const input = updateRouteSchema.parse(body);
    const route = await updateRoute(Number(id), input);
    return Response.json({ success: true, data: route });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    await requireAuth(request);
    const { id } = await params;
    await deleteRoute(Number(id));
    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
