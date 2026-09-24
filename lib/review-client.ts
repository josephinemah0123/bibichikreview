import type { ReviewInput } from "./reviews";
export async function saveReview(input: ReviewInput) {
  const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input), keepalive: true, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Review could not be saved (${response.status}).`);
}
