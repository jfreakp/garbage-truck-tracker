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
