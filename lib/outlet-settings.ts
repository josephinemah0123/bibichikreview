import { findOutlet } from "@/config/outlets";
import { safeHttpsUrl, setting } from "./runtime-env";

export function resolveOutlet(slug: string) {
  const outlet = findOutlet(slug);
  if (!outlet) return undefined;
  // The old variables apply only to SS2, never to another outlet.
  const legacy = outlet.id === "bibichik-ss2";
  return {
    ...outlet,
    googleReviewUrl: outlet.googleReviewUrl,
    websiteUrl: safeHttpsUrl(setting(outlet.websiteEnv)) ||
      (legacy ? safeHttpsUrl(setting("NEXT_PUBLIC_WEBSITE_URL")) : "") || outlet.websiteUrl,
  };
}
