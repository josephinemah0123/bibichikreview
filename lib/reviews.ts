import { z } from "zod";
import { CATEGORIES, feedbackSchema } from "./feedback";
export const reviewSchema = z.object({
  id: z.string().uuid(), outletId: z.string().min(1).max(80),
  overallRating: z.number().int().min(1).max(5), feedback: z.string().trim().max(3000),
  categories: z.array(z.enum(CATEGORIES)).max(6), customerName: z.string().trim().max(100),
  customerContact: z.string().trim().max(180), website: z.string().max(0),
}).strict().superRefine((value, ctx) => {
  if (value.overallRating <= 3) {
    const result = feedbackSchema.safeParse({ rating: value.overallRating, comment: value.feedback,
      categories: value.categories, name: value.customerName, contact: value.customerContact, website: value.website });
    if (!result.success) ctx.addIssue({ code: "custom", message: "Invalid feedback." });
  } else if (value.feedback || value.categories.length || value.customerName || value.customerContact) {
    ctx.addIssue({ code: "custom", message: "Positive ratings contain only a rating." });
  }
});
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ReviewRecord = {
  id: string; outlet_id: string; brand: string; outlet_name: string; overall_rating: number;
  feedback: string; categories: string[]; customer_name: string; customer_contact: string; created_at: string;
};
export type DashboardData = {
  total: number; average: number | null; fiveStar: number; positive: number; needsAttention: number;
  distribution: { rating: number; count: number }[];
  trend: { date: string; count: number; average: number }[];
  outlets: { outletId: string; outletName: string; brand: string; total: number; average: number }[];
  reviews: ReviewRecord[];
};
export const filterSchema = z.object({
  brand: z.string().max(100).default(""), outlet: z.string().max(80).default(""),
  rating: z.coerce.number().int().min(0).max(5).default(0),
  category: z.union([z.literal(""), z.enum(CATEGORIES)]).default(""),
  period: z.enum(["all", "today", "7", "30", "custom"]).default("30"),
  from: z.string().default(""), to: z.string().default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});
export type DashboardFilters = z.infer<typeof filterSchema>;
export function filterDates(filters: DashboardFilters, now = new Date()) {
  const today = new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10);
  function validDay(day: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day;
  }
  if (filters.period === "all") return { from: null, to: null };
  let from = today, to = today;
  if (filters.period === "custom") {
    if (!validDay(filters.from) || !validDay(filters.to) || filters.from > filters.to) throw new Error("Choose a valid date range.");
    from = filters.from; to = filters.to;
  } else if (filters.period !== "today") {
    from = new Date(Date.parse(today) - (Number(filters.period) - 1) * 86400000).toISOString().slice(0, 10);
  }
  return { from: new Date(`${from}T00:00:00+08:00`).toISOString(), to: new Date(Date.parse(`${to}T00:00:00+08:00`) + 86400000).toISOString() };
}
