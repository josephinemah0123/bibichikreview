"use client";
import { useEffect, useState } from "react";
import { StarRating } from "./StarRating";
import { FeedbackForm } from "./FeedbackForm";
import { GoogleReviewLink, PositiveReviewCard } from "./PositiveReviewCard";
import { SuccessMessage } from "./SuccessMessage";
import { EMPTY_DRAFT } from "@/lib/feedback";
export function ReviewPage({googleUrl,websiteUrl}:{googleUrl:string;websiteUrl:string}) {
 const [rating,setRating]=useState(0);
 const [draft,setDraft]=useState(EMPTY_DRAFT);
 const [sent,setSent]=useState(false);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  const context=(document as unknown as {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>Promise<void>|void}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try{Promise.resolve(context.registerTool({name:"select_experience_rating",description:"Select a 1–5 star rating and display the matching feedback or Google Review card. Does not submit feedback.",inputSchema:{type:"object",properties:{rating:{type:"integer",minimum:1,maximum:5}},required:["rating"],additionalProperties:false},annotations:{readOnlyHint:false},execute:(input:unknown)=>{
    if(busy)throw new Error("Feedback is being sent.");
    const value=(input as {rating?:unknown})?.rating;
    if(typeof value!=="number" || !Number.isInteger(value) || value<1 || value>5)throw new Error("Rating must be an integer from 1 to 5.");
    setRating(value);setSent(false);
    return {rating:value,section:value<=3?"feedback_form":"google_review"};
  }},{signal:lifecycle.signal})).catch(()=>{});}catch{}
  return ()=>lifecycle.abort();
 },[busy]);
 function chooseRating(value:number){setRating(value);setSent(false);}
 return <div className="site-shell"><main className="review-container">
  <header className="brand-header"><div className="brand-logo" role="img" aria-label="BiBiChik"/><p className="branch-label">BiBiChik SS2</p></header>
  <section className="experience" aria-labelledby="experience-title"><h1 id="experience-title">How was your<br/>experience today?</h1><p className="intro">Your feedback helps us serve you better.</p><StarRating value={rating} onChange={chooseRating} disabled={busy}/></section>
  {rating>0 && rating<=3 && (sent ? <SuccessMessage websiteUrl={websiteUrl}/> : <FeedbackForm rating={rating} draft={draft} onChange={setDraft} onBusy={setBusy} onSuccess={()=>{setSent(true);setDraft(EMPTY_DRAFT);}}/>)}
  {rating>=4 && <PositiveReviewCard googleUrl={googleUrl} websiteUrl={websiteUrl}/>}
  {rating>0 && rating<=3 && <div className="alternative-review"><GoogleReviewLink url={googleUrl}/></div>}
  <footer><span className="footer-wordmark">BiBiChik</span><p>BiBiChik SS2</p><p className="heritage">A Taste of Nyonya Heritage</p></footer>
 </main></div>;
}

