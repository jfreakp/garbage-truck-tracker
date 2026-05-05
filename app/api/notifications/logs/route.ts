import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-context";
import { handleError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

/** DELETE /api/notifications/logs — borra todos los registros de notificación (solo admin, solo dev/test) */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { count } = await prisma.notificationLog.deleteMany();
    return Response.json({ success: true, deleted: count });
  } catch (error) {
    return handleError(error);
  }
}
