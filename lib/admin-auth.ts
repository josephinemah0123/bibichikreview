import { cookies } from "next/headers";
import { setting } from "./runtime-env";
import { authConfigured, supabaseRequest } from "./supabase-server";
export const SESSION_COOKIE = "restaurant-admin-session";
export function allowedAdmin(email?: string) {
  return Boolean(email && setting("ADMIN_EMAILS").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase()));
}
export async function currentAdmin() {
  if (!authConfigured()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    // Ask Auth to validate the token; never trust a locally decoded JWT/user cookie.
    const response = await supabaseRequest("/auth/v1/user", {}, token);
    if (!response.ok) return null;
    const user = await response.json();
    return user.id && user.email_confirmed_at && allowedAdmin(user.email) ? {id:user.id as string,email:user.email as string} : null;
  } catch { return null; }
}
