import { type NextRequest } from "next/server";
import { registerSchema } from "@/modules/auth/auth.schemas";
import { register } from "@/modules/auth/auth.service";
import { handleError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);
    const result = await register(input);

    return Response.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
