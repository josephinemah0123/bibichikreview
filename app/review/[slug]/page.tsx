import { notFound } from "next/navigation";
import { ReviewPage } from "@/components/review/ReviewPage";
import { resolveOutlet } from "@/lib/outlet-settings";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const outlet = resolveOutlet((await params).slug);
  return outlet ? { title: `Share your experience | ${outlet.outletName}`, description: `Tell us about your visit to ${outlet.outletName}. Your feedback helps us serve you better.` } : { title: "Outlet not found" };
}
export default async function OutletReview({ params }: Props) {
  const outlet = resolveOutlet((await params).slug);
  if (!outlet) notFound();
  return <ReviewPage key={outlet.id} outlet={outlet}/>;
}
