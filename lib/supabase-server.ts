// Server-only module: never import from a Client Component.
import { setting } from "./runtime-env";
export function databaseConfigured() {
  return Boolean(setting("SUPABASE_URL") && setting("SUPABASE_SERVICE_ROLE_KEY"));
}
export function authConfigured() {
  return databaseConfigured() && Boolean(setting("SUPABASE_ANON_KEY") && setting("ADMIN_EMAILS"));
}
export async function supabaseRequest(path: string, init: RequestInit = {}, accessToken?: string) {
  const base = setting("SUPABASE_URL");
  if (!base || new URL(base).protocol !== "https:") throw new Error("Supabase is not configured.");
  const key = setting(accessToken ? "SUPABASE_ANON_KEY" : "SUPABASE_SERVICE_ROLE_KEY");
  if (!key) throw new Error("Supabase key is not configured.");
  return fetch(`${base.replace(/\/$/, "")}${path}`, {
    ...init, cache: "no-store", signal: AbortSignal.timeout(10000),
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${accessToken || key}`, ...init.headers },
  });
}
export async function rpc<T>(name: string, args: unknown): Promise<T> {
  const response = await supabaseRequest(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(args) });
  if (!response.ok) {
    // Status only: customer data and credentials must never enter logs.
    console.error(`Database operation ${name} failed (${response.status}).`);
    throw new Error("The database could not complete this request.");
  }
  return response.json() as Promise<T>;
}
