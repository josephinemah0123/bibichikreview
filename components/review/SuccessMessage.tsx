"use client";
import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
export function SuccessMessage({websiteUrl,brand="BiBiChik"}:{websiteUrl:string;brand?:string}) {
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[]);
 return <section className="response-card success-card reveal" role="status"><div className="success-icon"><Check size={28} aria-hidden="true"/></div><h2 ref={heading} tabIndex={-1}>Thank you for your feedback.</h2><p>We appreciate you helping us improve.</p>{websiteUrl && <a className="small-button" href={websiteUrl}>Back to {brand} Website</a>}</section>;
}

