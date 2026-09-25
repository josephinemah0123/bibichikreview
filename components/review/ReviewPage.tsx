"use client";
import { useCallback, useEffect, useState } from "react";
import { StarRating } from "./StarRating";
import { FeedbackForm } from "./FeedbackForm";
import { GoogleReviewLink } from "./PositiveReviewCard";
import { SuccessMessage } from "./SuccessMessage";
import { EMPTY_DRAFT } from "@/lib/feedback";
import type { Outlet } from "@/config/outlets";
export function ReviewPage({outlet}:{outlet:Outlet}) {
 const {googleReviewUrl:googleUrl,websiteUrl}=outlet;
 const [rating,setRating]=useState(0);
 const [draft,setDraft]=useState(EMPTY_DRAFT);
 const [sent,setSent]=useState(false);
 const [busy,setBusy]=useState(false);
 const chooseRating=useCallback((value:number)=>{
  if(busy)return;
  if(value>=4){window.location.assign(googleUrl);return;}
  setRating(value);setSent(false);
 },[busy,googleUrl]);
 useEffect(()=>{
  const context=(document as unknown as {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>Promise<void>|void}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try{Promise.resolve(context.registerTool({name:"select_experience_rating",description:"Select a 1–5 star rating. Ratings 1–3 open the feedback form. Ratings 4–5 immediately navigate to this outlet's Google Review page in the current tab. Does not submit feedback.",inputSchema:{type:"object",properties:{rating:{type:"integer",minimum:1,maximum:5}},required:["rating"],additionalProperties:false},annotations:{readOnlyHint:false},execute:(input:unknown)=>{
    if(busy)throw new Error("Feedback is being sent.");
    const value=(input as {rating?:unknown})?.rating;
    if(typeof value!=="number" || !Number.isInteger(value) || value<1 || value>5)throw new Error("Rating must be an integer from 1 to 5.");
    chooseRating(value);
    return {rating:value,section:value<=3?"feedback_form":"google_review"};
  }},{signal:lifecycle.signal})).catch(()=>{});}catch{}
  return ()=>lifecycle.abort();
 },[busy,chooseRating]);
 return <div className="site-shell" data-theme={outlet.theme}><main className="review-container">
  <header className="brand-header">{outlet.logo ? <div className="brand-logo" style={{backgroundImage:`url('${outlet.logo}')`}} role="img" aria-label={outlet.brand}/> : <div className="brand-wordmark">{outlet.brand}</div>}<p className="branch-label">{outlet.outletName}</p></header>
  <section className="experience" aria-labelledby="experience-title"><h1 id="experience-title">How was your<br/>experience today?</h1><p className="intro">Your feedback helps us serve you better.</p><StarRating value={rating} onChange={chooseRating} disabled={busy}/></section>
  {rating>0 && rating<=3 && (sent ? <SuccessMessage websiteUrl={websiteUrl} brand={outlet.brand}/> : <FeedbackForm outlet={outlet} rating={rating} draft={draft} onChange={setDraft} onBusy={setBusy} onSuccess={()=>{setSent(true);setDraft(EMPTY_DRAFT);}}/>)}
  {rating>0 && rating<=3 && <div className="alternative-review"><GoogleReviewLink url={googleUrl}/></div>}
  <footer><span className="footer-wordmark">{outlet.brand}</span><p>{outlet.outletName}</p>{outlet.tagline && <p className="heritage">{outlet.tagline}</p>}</footer>
 </main></div>;
}

