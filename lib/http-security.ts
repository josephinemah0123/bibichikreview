import { createHmac } from "node:crypto";
import { setting } from "./runtime-env";
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && (origin === new URL(request.url).origin || origin === setting("SITE_URL")));
}
export async function readJson(request: Request, maximum = 24000): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("Expected JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const part = await reader.read(); if (part.done) break;
    size += part.value.length;
    if (size > maximum) { await reader.cancel(); throw new Error("Request too large."); }
    chunks.push(part.value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function clientHash(request: Request) {
  // Set only to an IP header overwritten by your trusted reverse proxy.
  // No forwarded headers are trusted by default.
  const header = setting("TRUSTED_CLIENT_IP_HEADER");
  const address = header ? request.headers.get(header)?.split(",")[0].trim() || "unknown" : "shared";
  const secret = setting("RATE_LIMIT_SECRET");
  if (!secret || secret.length < 32) throw new Error("RATE_LIMIT_SECRET must contain at least 32 characters.");
  return createHmac("sha256", secret).update(address).digest("hex");
}
