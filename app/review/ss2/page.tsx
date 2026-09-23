import { ReviewPage } from "@/components/review/ReviewPage";
import { safeHttpsUrl, setting } from "@/lib/runtime-env";
export const dynamic = "force-dynamic";
// Keep the existing business link available when deployment settings are absent.
const defaultGoogleUrl = "https://www.google.com/search?kgmid=/g/1th7kdpd&q=BiBiChik+SS2#lrd=0x31cc4955f9b96915:0xa578d5ae333aed5d,3,,,,";
export default function SS2Review() {
  const googleUrl = safeHttpsUrl(setting("NEXT_PUBLIC_GOOGLE_REVIEW_URL")) || defaultGoogleUrl;
  return <ReviewPage googleUrl={googleUrl} websiteUrl={safeHttpsUrl(setting("NEXT_PUBLIC_WEBSITE_URL"))}/>;
}


