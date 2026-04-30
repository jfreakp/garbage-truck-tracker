import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { updateUserSchema } from "@/modules/users/users.schemas";
import { getUser, updateUser } from "@/modules/users/users.service";
import { handleError, UnauthorizedError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;

    // Users can only fetch their own profile
    if (payload.sub !== id) {
      throw new UnauthorizedError("Cannot access another user's profile");
    }

    const user = await getUser(Number(id));
    return Response.json({ success: true, data: user });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(request);
    const { id } = await params;

    if (payload.sub !== id) {
      throw new UnauthorizedError("Cannot update another user's profile");
    }

    const body = await request.json();
    const input = updateUserSchema.parse(body);
    const user = await updateUser(Number(id), input);
    return Response.json({ success: true, data: user });
  } catch (error) {
    return handleError(error);
  }
}
