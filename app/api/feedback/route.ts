import { createHash } from "node:crypto";
import { z } from "zod";
import { feedbackSchema } from "@/lib/feedback";
import { sendFeedback } from "@/lib/email";
import { findOutlet } from "@/config/outlets";
import { sameOrigin, readJson, allowSubmission } from "@/lib/http-security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ERROR = "Something went wrong. Please try again.";
const recent = new Map<string, {hash:string; expires:number; promise:Promise<void>}>();
function json(body: unknown, status = 200) { return Response.json(body,{status,headers:{"Cache-Control":"no-store"}}); }
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({error:ERROR},403);
  if (!allowSubmission(request)) return json({error:ERROR},429);
  let raw: unknown;
  try { raw = await readJson(request); } catch { return json({error:ERROR},400); }
  const parsed = z.object({id:z.string().uuid(),outletId:z.string().max(80),feedback:feedbackSchema}).strict().safeParse(raw);
  if (!parsed.success) return json({error:"Please check your feedback and try again."},400);
  const {id,outletId,feedback} = parsed.data;
  const outlet = findOutlet(outletId);
  if (!outlet || outlet.id !== outletId) return json({error:ERROR},400);
  const now = Date.now();
  for (const [key, item] of recent) if(item.expires <= now) recent.delete(key);
  const hash = createHash("sha256").update(JSON.stringify({outletId,feedback})).digest("hex");
  const existing = recent.get(id);
  if (existing && existing.hash !== hash) return json({error:ERROR},409);
  if (!existing && recent.size >= 1000) return json({error:ERROR},429);
  try {
    const promise = existing?.promise || sendFeedback(feedback,outlet);
    if (!existing) recent.set(id,{hash,expires:now+15*60*1000,promise});
    await promise;
    return json({success:true});
  } catch (error) {
    recent.delete(id);
    // Do not log SMTP responses, credentials, or customer information.
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "MAIL_FAILED";
    console.error("Feedback email failed", {code});
    return json({error:ERROR},502);
  }
}
