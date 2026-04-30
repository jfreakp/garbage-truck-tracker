import { type NextRequest } from "next/server";
import { verifyToken, type JwtPayload } from "./jwt";
import { UnauthorizedError } from "./errors";

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Returns the decoded payload.
 * Throws UnauthorizedError when the token is missing or invalid.
 */
export async function requireAuth(request: NextRequest): Promise<JwtPayload> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = authHeader.slice(7);

  try {
    return await verifyToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

/**
 * Like requireAuth, but additionally enforces that the caller has the ADMIN role.
 * Throws UnauthorizedError (403-ish) when the user is authenticated but not admin.
 */
export async function requireAdmin(request: NextRequest): Promise<JwtPayload> {
  const payload = await requireAuth(request);
  if (payload.role !== "ADMIN") {
    throw new UnauthorizedError("Se requiere rol de administrador");
  }
  return payload;
}
