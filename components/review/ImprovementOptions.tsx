"use client";
import { Utensils, UserRound, Clock3, Sparkles, Leaf, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES } from "@/lib/feedback";
const icons = [Utensils,UserRound,Clock3,Sparkles,Leaf,MessageSquare];
export function ImprovementOptions({value,onChange,error}:{value:string[];onChange:(value:string[])=>void;error?:string}) {
 return <fieldset className="improvements" aria-describedby={error ? "category-error" : undefined}>
  <legend>What can we improve?</legend>
  <div className="option-grid">{CATEGORIES.map((category,i)=>{const Icon=icons[i];return <label className={"category-option " + (value.includes(category) ? "checked" : "")} key={category}><Icon size={19} aria-hidden="true"/><span>{category}</span><Checkbox checked={value.includes(category)} aria-invalid={!!error} onCheckedChange={checked=>onChange(checked ? [...value,category] : value.filter(v=>v!==category))}/></label>})}</div>
  {error && <p className="field-error" id="category-error" role="alert">{error}</p>}
 </fieldset>;
}

