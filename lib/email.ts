import nodemailer from "nodemailer";
import { z } from "zod";
import { feedbackSchema } from "./feedback";
import { setting } from "./runtime-env";
import type { Outlet } from "../config/outlets";

const clean = (value: string) => value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
const escape = (value: string) => clean(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]!);
export function feedbackMessage(input: z.infer<typeof feedbackSchema>, outlet: Outlet, date = new Date()) {
  const rows = [
    ["Brand", outlet.brand], ["Outlet", outlet.outletName], ["Overall Rating", `${input.rating} / 5`],
    ["Areas to Improve", input.categories.join(", ") || "Not provided"],
    ["Customer Feedback", input.comment || "Not provided"],
    ...(input.name ? [["Customer Name", input.name]] : []),
    ...(input.contact ? [[input.contact.includes("@") ? "Customer Email" : "Customer Phone", input.contact]] : []),
    ["Submission Date", date.toLocaleDateString("en-MY", {timeZone:"Asia/Kuala_Lumpur",year:"numeric",month:"long",day:"numeric"})],
    ["Submission Time", date.toLocaleTimeString("en-MY", {timeZone:"Asia/Kuala_Lumpur",hour12:false}) + " (Asia/Kuala_Lumpur, UTC+08:00)"],
  ];
  return {
    subject: `[Review Alert] ${outlet.outletName} - ${input.rating} Star Feedback`,
    text: rows.map(([label, value]) => `${label}: ${clean(value)}`).join("\n\n"),
    html: `<h2>Customer feedback</h2><table cellpadding="10" style="border-collapse:collapse;font-family:Arial,sans-serif">${rows.map(([label,value]) => `<tr><th align="left" valign="top">${label}</th><td style="white-space:pre-wrap">${escape(value)}</td></tr>`).join("")}</table>`,
    ...(input.contact.includes("@") ? {replyTo: z.string().email().parse(input.contact)} : {}),
  };
}

export async function sendFeedback(input: z.infer<typeof feedbackSchema>, outlet: Outlet) {
  const host = setting("SMTP_HOST");
  const port = z.coerce.number().int().min(1).max(65535).parse(setting("SMTP_PORT"));
  const user = setting("SMTP_USER");
  const pass = process.env.SMTP_PASS || "";
  if (!host || !user || !pass) throw new Error("SMTP configuration missing");
  const from = z.string().email().parse(setting("FEEDBACK_FROM_EMAIL"));
  const to = z.string().email().parse(setting("FEEDBACK_TO_EMAIL"));
  const transporter = nodemailer.createTransport({
    host, port, secure: port === 465, requireTLS: port !== 465,
    auth: {user, pass}, connectionTimeout:10000, greetingTimeout:10000, socketTimeout:20000,
    disableFileAccess:true, disableUrlAccess:true,
  });
  try {
    const result = await transporter.sendMail({from,to,...feedbackMessage(input,outlet)});
    if (!result.accepted?.length || result.rejected?.length) throw new Error("SMTP recipient rejected");
  } finally { transporter.close(); }
}
