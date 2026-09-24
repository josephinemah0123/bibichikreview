import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/admin-auth";
import { sameOrigin } from "@/lib/http-security";
import { supabaseRequest } from "@/lib/supabase-server";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"Forbidden"}, {status:403});
  const jar = await cookies(), token = jar.get(SESSION_COOKIE)?.value;
  if (token) { try { await supabaseRequest("/auth/v1/logout", {method:"POST"}, token); } catch { /* Local session is still removed. */ } }
  jar.delete(SESSION_COOKIE);
  return new Response(null, {status:303,headers:{Location:new URL("/admin/login",request.url).href,"Cache-Control":"no-store"}});
}
