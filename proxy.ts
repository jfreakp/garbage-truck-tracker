import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { logger } from "@/lib/logger";

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/trucks/location", // truck device sends without user auth
  "/api/trucks/stream",   // SSE auth handled inside the route via ?token= param
  "/api/docs",            // Scalar UI — pública para facilitar integración
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log every API request
  if (pathname.startsWith("/api/")) {
    logger.info("API request", {
      method: request.method,
      path: pathname,
    });
  }

  // Allow public routes through
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Only protect API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json(
      { success: false, error: "Missing Authorization header" },
      { status: 401 }
    );
  }

  try {
    await verifyToken(authHeader.slice(7));
    return NextResponse.next();
  } catch {
    return Response.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
