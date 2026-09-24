import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE, allowedAdmin } from "@/lib/admin-auth";
import { authConfigured, rpc, supabaseRequest } from "@/lib/supabase-server";
import { readJson, sameOrigin, clientHash } from "@/lib/http-security";
import { setting } from "@/lib/runtime-env";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"Forbidden"}, {status:403});
  if (!authConfigured()) return Response.json({error:"Admin access has not been configured."}, {status:503});
  try {
    const input = z.object({email:z.string().email().max(180),password:z.string().min(1).max(256)}).strict().safeParse(await readJson(request, 4000));
    if (!input.success) return Response.json({error:"Check your email and password."}, {status:400});
    const permitted = await rpc<boolean>("take_rate_limit", {p_key:`login:${clientHash(request)}`,p_limit:10,p_window:900});
    if (!permitted) return Response.json({error:"Too many attempts. Try again in 15 minutes."}, {status:429});
    const response = await supabaseRequest("/auth/v1/token?grant_type=password", {method:"POST",body:JSON.stringify(input.data)}, setting("SUPABASE_ANON_KEY"));
    const data = await response.json();
    if (!response.ok || !data.access_token || !data.user?.email_confirmed_at || !allowedAdmin(data.user.email))
      return Response.json({error:"Unable to sign in with these credentials."}, {status:401});
    (await cookies()).set(SESSION_COOKIE, data.access_token, {httpOnly:true,secure:process.env.NODE_ENV === "production",sameSite:"strict",path:"/",maxAge:Math.min(data.expires_in || 3600,3600)});
    return Response.json({success:true}, {headers:{"Cache-Control":"no-store"}});
  } catch { return Response.json({error:"Sign-in is unavailable. Please try again."}, {status:503}); }
}
