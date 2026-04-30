import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { createTruckSchema } from "@/modules/trucks/trucks.schemas";
import { createTruck, listTrucks } from "@/modules/trucks/trucks.service";
import { handleError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const trucks = await listTrucks();
    return Response.json({ success: true, data: trucks });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const input = createTruckSchema.parse(body);
    const truck = await createTruck(input);
    return Response.json({ success: true, data: truck }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
