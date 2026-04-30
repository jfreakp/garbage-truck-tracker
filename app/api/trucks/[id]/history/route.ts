import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { handleError, NotFoundError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const truckId = Number(id);

    const truck = await prisma.truck.findUnique({ where: { id: truckId }, select: { id: true } });
    if (!truck) throw new NotFoundError("Truck");

    // Last 500 points, newest first
    const history = await prisma.locationHistory.findMany({
      where: { truckId },
      orderBy: { recordedAt: "desc" },
      take: 500,
      select: { lat: true, lng: true, recordedAt: true },
    });

    return Response.json({ success: true, data: history });
  } catch (error) {
    return handleError(error);
  }
}
