import { NextRequest } from "next/server";
import { sseManager } from "@/lib/sse-manager";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = crypto.randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      sseManager.addClient(clientId, controller);
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ connected: true })}\n\n`)
      );

      req.signal.addEventListener("abort", () => {
        sseManager.removeClient(clientId);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
