import { z } from "zod";
export const CATEGORIES = ["Food", "Service", "Waiting Time", "Cleanliness", "Environment", "Other"] as const;
export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(3),
  categories: z.array(z.enum(CATEGORIES)).max(6).transform(values => [...new Set(values)]),
  comment: z.string().trim().max(3000),
  name: z.string().trim().max(100),
  contact: z.string().trim().max(180).refine(value => !value || (value.includes("@") ? z.string().email().safeParse(value).success : /^[+()\d\s.-]{6,30}$/.test(value) && value.replace(/\D/g, "").length >= 6), "Enter a valid phone number or email."),
  website: z.string().max(0),
}).strict().refine(value => value.categories.length > 0 || value.comment.length > 0, {message:"Please select an improvement category or write a comment.", path:["categories"]});
export type FeedbackDraft = { categories: string[]; comment: string; name: string; contact: string; website: string };
export const EMPTY_DRAFT: FeedbackDraft = {categories:[],comment:"",name:"",contact:"",website:""};

