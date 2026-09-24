import { z } from "zod";
import { feedbackSchema } from "@/lib/feedback";
import { sendFeedback } from "@/lib/email";
import { setting } from "@/lib/runtime-env";
export const dynamic = "force-dynamic";
const ERROR = "Something went wrong. Please try again.";
function json(body: unknown, status = 200) { return Response.json(body,{status,headers:{"Cache-Control":"no-store"}}); }
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin === new URL(request.url).origin || origin === setting("SITE_URL");
  return request.headers.get("sec-fetch-site") === "same-origin";
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({error:ERROR},403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({error:ERROR},415);
  if (Number(request.headers.get("content-length") || 0) > 24000) return json({error:ERROR},413);
  let raw: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({error:ERROR},400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > 24000) { await reader.cancel(); return json({error:ERROR},413); } chunks.push(value); }
    const body = new Uint8Array(size); let offset = 0; for (const part of chunks) { body.set(part,offset); offset += part.length; }
    raw = JSON.parse(new TextDecoder().decode(body));
  } catch { return json({error:ERROR},400); }
  const parsed = z.object({feedback:feedbackSchema}).strict().safeParse(raw);
  if (!parsed.success) return json({error:"Please check your feedback and try again.",issues:parsed.error.flatten()},400);
  try {
    const recipient = setting("FEEDBACK_EMAIL") || "feedback@bibichik.com";
    const pageUrl = new URL("/review/ss2", setting("SITE_URL") || request.url).href;
    await sendFeedback(parsed.data.feedback, {recipient, pageUrl});
    return json({success:true});
  } catch {
    // Never log customer feedback or provider credentials.
    console.error("BiBiChik feedback email could not be accepted by the email provider.");
    return json({error:ERROR},502);
  }
}

