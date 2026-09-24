import { Smile, ArrowUpRight } from "lucide-react";
export function GoogleReviewLink({url,primary=false}:{url:string;primary?:boolean}) {
 return url ? <a href={url} target="_blank" rel="noopener noreferrer" className={primary ? "primary-button google-button" : "secondary-google"}>{primary && <span className="google-letter" aria-hidden="true">G</span>}{primary ? "Leave a Google Review" : "You can also leave a Google Review"}<ArrowUpRight size={primary ? 18 : 15} aria-hidden="true"/></a> : null;
}
export function PositiveReviewCard({googleUrl,websiteUrl,outletName,brand}:{googleUrl:string;websiteUrl:string;outletName:string;brand:string}) {
 return <section className="response-card positive reveal" aria-labelledby="positive-title"><div className="mood-icon"><Smile size={33} strokeWidth={1.5} aria-hidden="true"/></div><h2 id="positive-title">Thank You!</h2><p>We’re glad you enjoyed your experience at {outletName}.</p><GoogleReviewLink url={googleUrl} primary/>{websiteUrl && <a className="website-link" href={websiteUrl}>Continue to {brand} Website</a>}</section>;
}

