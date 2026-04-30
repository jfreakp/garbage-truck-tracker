import { type NextRequest } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-context";
import { handleError } from "@/lib/errors";
import { createScheduleSchema } from "@/modules/schedules/schedules.schemas";
import { createSchedule, listSchedules } from "@/modules/schedules/schedules.service";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const schedules = await listSchedules();
    return Response.json({ success: true, data: schedules });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body  = await request.json();
    const input = createScheduleSchema.parse(body);
    const schedule = await createSchedule(input);
    return Response.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
