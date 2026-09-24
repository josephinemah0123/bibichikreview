import { reviewSchema } from "@/lib/reviews";
import { findOutlet } from "@/config/outlets";
import { databaseConfigured, rpc } from "@/lib/supabase-server";
import { readJson, sameOrigin, clientHash } from "@/lib/http-security";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"Forbidden"}, {status:403});
  if (!databaseConfigured()) return Response.json({error:"Database not configured"}, {status:503});
  let raw: unknown;
  try { raw = await readJson(request); } catch { return Response.json({error:"Invalid request"}, {status:400}); }
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return Response.json({error:"Invalid feedback"}, {status:400});
  const input = parsed.data, outlet = findOutlet(input.outletId);
  if (!outlet || outlet.id !== input.outletId) return Response.json({error:"Unknown outlet"}, {status:400});
  try {
    const result = await rpc<{ status: string }>("submit_review", {
      p_id: input.id, p_outlet_id: outlet.id, p_brand: outlet.brand, p_outlet_name: outlet.outletName,
      p_rating: input.overallRating, p_feedback: input.feedback, p_categories: [...new Set(input.categories)],
      p_customer_name: input.customerName, p_customer_contact: input.customerContact, p_client_hash: clientHash(request),
    });
    if (result.status === "limited") return Response.json({error:"Please try again later."}, {status:429});
    if (result.status === "conflict") return Response.json({error:"Submission conflict"}, {status:409});
    if (result.status !== "saved" && result.status !== "exists") throw new Error("Unexpected database response.");
    return Response.json({success:true}, {headers:{"Cache-Control":"no-store"}});
  } catch { return Response.json({error:"Unable to save feedback. Please try again."}, {status:503}); }
}
