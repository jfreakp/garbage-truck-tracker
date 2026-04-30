import { type NextRequest } from "next/server";
import { loginSchema } from "@/modules/auth/auth.schemas";
import { login } from "@/modules/auth/auth.service";
import { handleError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);
    const result = await login(input);

    return Response.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}
