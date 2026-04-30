import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { createBarrioSchema } from "@/modules/barrios/barrios.schemas";
import { createBarrio, listBarrios } from "@/modules/barrios/barrios.service";
import { handleError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const barrios = await listBarrios();
    return Response.json({ success: true, data: barrios });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const input = createBarrioSchema.parse(body);
    const barrio = await createBarrio(input);
    return Response.json({ success: true, data: barrio }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
