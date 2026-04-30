import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { getBarrio, updateBarrio, deleteBarrio } from "@/modules/barrios/barrios.service";
import { updateBarrioSchema } from "@/modules/barrios/barrios.schemas";
import { handleError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const barrio = await getBarrio(Number(id));
    return Response.json({ success: true, data: barrio });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const input = updateBarrioSchema.parse(body);
    const barrio = await updateBarrio(Number(id), input);
    return Response.json({ success: true, data: barrio });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    await requireAuth(request);
    const { id } = await params;
    await deleteBarrio(Number(id));
    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
