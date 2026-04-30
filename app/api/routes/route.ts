import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { createRouteSchema } from "@/modules/routes/routes.schemas";
import { createRoute, listRoutes } from "@/modules/routes/routes.service";
import { handleError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const routes = await listRoutes();
    return Response.json({ success: true, data: routes });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const input = createRouteSchema.parse(body);
    const route = await createRoute(input);
    return Response.json({ success: true, data: route }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
