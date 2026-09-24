"use client";
import { useRef, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { ImprovementOptions } from "./ImprovementOptions";
import { feedbackSchema, type FeedbackDraft } from "@/lib/feedback";
import type { Outlet } from "@/config/outlets";
export function FeedbackForm({rating,draft,onChange,onSuccess,onBusy,outlet}:{rating:number;draft:FeedbackDraft;onChange:(draft:FeedbackDraft)=>void;onSuccess:()=>void;onBusy:(value:boolean)=>void;outlet:Outlet}) {
 const [sending,setSending]=useState(false);
 const [errors,setErrors]=useState<Record<string,string>>({});
 const [serverError,setServerError]=useState("");
 const guard=useRef(false);
 const formRef=useRef<HTMLFormElement>(null);
 const submission=useRef<{key:string;id:string}|null>(null);
 function update(field:keyof FeedbackDraft,value:string|string[]) { onChange({...draft,[field]:value}); setErrors(current=>({...current,[field]:"",...(field==="comment" ? {categories:""} : {})})); setServerError(""); }
 async function submit(event:React.FormEvent) {
  event.preventDefault();
  if(guard.current) return;
  const parsed=feedbackSchema.safeParse({...draft,rating});
  if(!parsed.success) { const next:Record<string,string>={}; for(const issue of parsed.error.issues) next[String(issue.path[0])]=issue.message; setErrors(next); requestAnimationFrame(()=>formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
  guard.current=true;setSending(true);onBusy(true);setServerError("");setErrors({});
  try {
   const key=JSON.stringify({outletId:outlet.id,...parsed.data});
   if(submission.current?.key!==key)submission.current={key,id:crypto.randomUUID()};
   const response=await fetch("/api/feedback",{
    method:"POST",
    headers:{"Content-Type":"application/json",Accept:"application/json"},
    body:JSON.stringify({id:submission.current.id,outletId:outlet.id,feedback:parsed.data}),
    signal:AbortSignal.timeout(60000),
   });
   const responseBody=await response.text();
   let result:unknown;
   try { result=JSON.parse(responseBody); }
   catch { throw {message:"Feedback service returned a non-JSON response",status:response.status}; }
   const accepted=result!==null && typeof result==="object" && "success" in result && result.success===true;
   if(!response.ok || !accepted) throw {message:"Feedback service could not send the email",status:response.status};
   onSuccess();
  } catch(error) {
   const details=error instanceof Error ? {name:error.name,message:error.message,stack:error.stack} : error;
   console.error("BiBiChik feedback submission failed: " + JSON.stringify(details));
   setServerError("Something went wrong. Please try again.");
  }
  finally {guard.current=false;setSending(false);onBusy(false);}
 }
 return <section className="response-card reveal" aria-labelledby="improve-title">
  <h2 id="improve-title">Help Us Improve</h2>
  <p className="card-description">We’re sorry your experience wasn’t perfect. Let us know what we can do better.</p>
  <form ref={formRef} onSubmit={submit} noValidate aria-busy={sending}>
   <fieldset disabled={sending} className="form-fields">
    <ImprovementOptions value={draft.categories} onChange={value=>update("categories",value)} error={errors.categories}/>
    <div className="form-group"><label htmlFor="comment">Tell us more <span>(optional)</span></label><textarea id="comment" name="comment" rows={4} maxLength={3000} placeholder="Share your feedback with us…" value={draft.comment} onChange={e=>update("comment",e.target.value)} aria-invalid={!!errors.comment} aria-describedby={errors.comment ? "comment-error" : undefined}/>{errors.comment && <p id="comment-error" className="field-error" role="alert">{errors.comment}</p>}</div>
    <fieldset className="details"><legend>Your details <span>(optional)</span></legend><div className="detail-inputs">
      <div><label htmlFor="customer-name" className="sr-only">Name</label><input id="customer-name" name="name" autoComplete="name" maxLength={100} placeholder="Name" value={draft.name} onChange={e=>update("name",e.target.value)} aria-invalid={!!errors.name}/></div>
      <div><label htmlFor="contact" className="sr-only">Phone / Email</label><input id="contact" name="contact" type="text" autoComplete="off" maxLength={180} placeholder="Phone / Email" value={draft.contact} onChange={e=>update("contact",e.target.value)} aria-invalid={!!errors.contact} aria-describedby={errors.contact ? "contact-error" : undefined}/></div>
    </div>{errors.contact && <p id="contact-error" className="field-error" role="alert">{errors.contact}</p>}</fieldset>
    <div className="honey" aria-hidden="true"><label htmlFor="company-website">Leave this field empty</label><input id="company-website" name="website" tabIndex={-1} autoComplete="off" value={draft.website} onChange={e=>update("website",e.target.value)}/></div>
    {serverError && <p className="server-error" role="alert">{serverError}</p>}
    <button className="primary-button" type="submit" disabled={sending}>{sending ? <LoaderCircle className="spin" size={18} aria-hidden="true"/> : <Send size={17} aria-hidden="true"/>}{sending ? "Sending feedback…" : "Submit Feedback"}</button>
   </fieldset>
  </form>
 </section>;
}

