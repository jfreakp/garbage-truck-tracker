import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-context";
import { handleError, AppError } from "@/lib/errors";
import { updateScheduleSchema } from "@/modules/schedules/schedules.schemas";
import { deleteSchedule, updateSchedule } from "@/modules/schedules/schedules.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(request);
    const { id } = await ctx.params;
    const numId  = Number(id);
    if (!Number.isInteger(numId) || numId < 1) throw new AppError("ID inválido", 400);
    const body  = await request.json();
    const input = updateScheduleSchema.parse(body);
    const schedule = await updateSchedule(numId, input);
    return Response.json({ success: true, data: schedule });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(request);
    const { id } = await ctx.params;
    const numId  = Number(id);
    if (!Number.isInteger(numId) || numId < 1) throw new AppError("ID inválido", 400);
    await deleteSchedule(numId);
    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
