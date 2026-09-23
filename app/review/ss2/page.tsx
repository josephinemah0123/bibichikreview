import { ReviewPage } from "@/components/review/ReviewPage";
import { safeHttpsUrl, setting } from "@/lib/runtime-env";
export const dynamic = "force-dynamic";
export default function SS2Review() { return <ReviewPage googleUrl={safeHttpsUrl(setting("NEXT_PUBLIC_GOOGLE_REVIEW_URL"))} websiteUrl={safeHttpsUrl(setting("NEXT_PUBLIC_WEBSITE_URL"))}/>; }

