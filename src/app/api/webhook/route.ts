import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sseManager } from "@/lib/sse-manager";
import { fetchAllIssues } from "@/actions/github";

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";
  const event = req.headers.get("x-github-event");

  const secret = process.env.WEBHOOK_SECRET;
  if (secret && !verifySignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event === "issues" || event === "issue_comment" || event === "label") {
    try {
      const tasks = await fetchAllIssues();
      sseManager.broadcast("tasks-update", { tasks });
    } catch (error) {
      console.error("[Webhook] Failed to fetch tasks:", error);
    }
  }

  return NextResponse.json({ received: true });
}
