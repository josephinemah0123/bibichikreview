import { z } from "zod";
import { feedbackSchema } from "./feedback";

export const FORMSUBMIT_ENDPOINT = "https://formsubmit.co/feedback@bibichik.com";
export const FEEDBACK_SUBJECT = "BiBiChik SS2 Customer Feedback";
export type EmailConfig = { recipient: string; pageUrl: string };

export function emailPayload(input: z.infer<typeof feedbackSchema>, pageUrl: string, outlet?: {id:string;brand:string;outletName:string}, createdAt?:string) {
  return {
    Branch: outlet?.outletName || "BiBiChik SS2",
    Rating: input.rating + " / 5",
    "Areas to Improve": input.categories.join(", ") || "Not provided",
    Comment: input.comment || "Not provided",
    "Customer Name": input.name || "Not provided",
    "Customer Contact": input.contact || "Not provided",
    ...(outlet ? { outletId:outlet.id, brand:outlet.brand, outletName:outlet.outletName, overallRating:input.rating, feedback:input.comment, createdAt:createdAt || new Date().toISOString() } : {}),
    _subject: outlet ? `${outlet.outletName} Customer Feedback` : FEEDBACK_SUBJECT,
    _template: "table",
    _captcha: "false",
    _honey: input.website,
    _url: pageUrl,
  };
}

export async function sendFeedback(
  input: z.infer<typeof feedbackSchema>,
  config: EmailConfig,
  transport: typeof fetch = fetch,
) {
  // The AJAX variant of the supplied endpoint keeps customers on our own page.
  const recipient = z.string().email().parse(config.recipient);
  const endpoint = new URL(FORMSUBMIT_ENDPOINT);
  endpoint.pathname = "/ajax/" + recipient;
  const response = await transport(endpoint.href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: config.pageUrl,
    },
    body: JSON.stringify(emailPayload(input, config.pageUrl)),
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Feedback provider rejected the submission");
  const result: unknown = await response.json();
  // FormSubmit may return a string instead of a boolean. Never treat "false"
  // or a generic HTTP 200 response as a successful submission.
  if (!result || typeof result !== "object" || !("success" in result) ||
      (result.success !== true && result.success !== "true")) {
    throw new Error("Feedback provider did not confirm acceptance");
  }
}

