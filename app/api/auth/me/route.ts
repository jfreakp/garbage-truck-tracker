import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { getMe } from "@/modules/auth/auth.service";
import { handleError, NotFoundError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    const user = await getMe(Number(payload.sub));

    if (!user) throw new NotFoundError("User");

    return Response.json({ success: true, data: user });
  } catch (error) {
    return handleError(error);
  }
}
