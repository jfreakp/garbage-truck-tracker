import { type NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { listTrucks } from "@/modules/trucks/trucks.service";

const PUSH_INTERVAL_MS = 3000; // push every 3 s

export async function GET(request: NextRequest) {
  // Auth via query param (EventSource can't set headers)
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await verifyToken(token);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      async function push() {
        try {
          const trucks = await listTrucks();
          const payload = JSON.stringify(trucks);
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          controller.enqueue(encoder.encode(`: error\n\n`));
        }
      }

      // Send immediately, then every N seconds
      push();
      intervalId = setInterval(push, PUSH_INTERVAL_MS);

      // Heartbeat keeps the connection alive through proxies
      const hb = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 20000);

      // Cleanup on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        clearInterval(hb);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
