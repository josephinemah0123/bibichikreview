import Link from "next/link";
import { outlets } from "@/config/outlets";
import { CATEGORIES } from "@/lib/feedback";
import type { DashboardData, DashboardFilters } from "@/lib/reviews";
const formatRating=(value:number|null)=>value===null?"—":Number(value).toFixed(1);
export function FeedbackDashboard({data,filters,error,email}:{data:DashboardData|null;filters:DashboardFilters;error:string;email:string}) {
  const brands=[...new Set(outlets.map(o=>o.brand))];
  const pages=data?Math.max(1,Math.ceil(data.total/25)):1;
  function pageLink(page:number) {return `/admin?${new URLSearchParams({...Object.fromEntries(Object.entries(filters).map(([key,value])=>[key,String(value)])),page:String(page)})}`;}
  return <main className="admin-container"><header className="admin-header"><div><p className="admin-eyebrow">RESTAURANT MANAGEMENT</p><h1>Guest feedback</h1><p>One view of every outlet.</p></div><div className="admin-account"><span>{email}</span><form action="/api/admin/logout" method="post"><button className="admin-secondary">Sign out</button></form></div></header>
    <form key={JSON.stringify(filters)} action="/admin" method="get" className="admin-panel admin-filters">
      <label>Brand<select name="brand" defaultValue={filters.brand}><option value="">All Brands</option>{brands.map(brand=><option key={brand}>{brand}</option>)}</select></label>
      <label>Outlet<select name="outlet" defaultValue={filters.outlet}><option value="">All Outlets</option>{outlets.filter(o=>o.active).map(o=><option key={o.id} value={o.id}>{o.outletName}</option>)}</select></label>
      <label>Date range<select name="period" defaultValue={filters.period}><option value="today">Today</option><option value="7">Last 7 Days</option><option value="30">Last 30 Days</option><option value="custom">Custom Range</option><option value="all">All Time</option></select></label>
      <label>From<input type="date" name="from" defaultValue={filters.from}/></label><label>To<input type="date" name="to" defaultValue={filters.to}/></label>
      <label>Rating<select name="rating" defaultValue={filters.rating}><option value="0">All Ratings</option>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} star{n===1?"":"s"}</option>)}</select></label>
      <label>Category<select name="category" defaultValue={filters.category}><option value="">All Categories</option>{CATEGORIES.map(category=><option key={category}>{category}</option>)}</select></label>
      <button type="submit">Apply filters</button><Link href="/admin">Reset filters</Link><p className="admin-filter-help">Dates use Malaysia time (UTC+8). From/To apply to Custom Range.</p>
    </form>
    {error && <section className="admin-panel admin-error" role="alert">{error}</section>}
    {data && <>
      <section className="admin-metrics" aria-label="Review summary">{[
        ["Total Reviews",data.total],["Average Rating",formatRating(data.average)],["5 Star Reviews",data.fiveStar],["Positive Reviews",data.positive],["Needs Attention",data.needsAttention],
      ].map(([label,value])=><article className="admin-panel metric" key={label}><h2>{label}</h2><strong>{value}</strong></article>)}</section>
      <p className="admin-explainer">These are ratings submitted on this website, not verified Google reviews. Positive = 4–5 stars; needs attention = 1–3 stars. Email delivery is handled separately by FormSubmit.</p>
      <div className="admin-charts"><section className="admin-panel"><h2>Rating distribution</h2>{[5,4,3,2,1].map(n=>{const count=data.distribution.find(d=>d.rating===n)?.count||0;return <div className="distribution-row" key={n}><span>{n} stars</span><meter min="0" max={Math.max(1,data.total)} value={count} aria-label={`${n} stars: ${count}`}/><b>{count}</b></div>;})}</section>
      <section className="admin-panel"><h2>Review trend</h2>{data.trend.length===0?<p>No reviews in this period.</p>:<div className="trend-scroll"><div className="trend-chart">{data.trend.map(point=><div className="trend-column" key={point.date}><span>{point.count}</span><div className="trend-bar" style={{height:`${Math.max(3,point.count/Math.max(...data.trend.map(p=>p.count))*95)}px`}}/><time dateTime={point.date}>{point.date.slice(5)}</time><span className="sr-only">Average {formatRating(point.average)}</span></div>)}</div></div>}<p className="admin-small">Daily totals for recent ranges; monthly totals for long ranges.</p></section></div>
      <section className="admin-panel"><h2>Outlet performance</h2><div className="outlet-summary">{outlets.filter(o=>(!filters.brand||o.brand===filters.brand)&&(!filters.outlet||o.id===filters.outlet)).map(o=>{const row=data.outlets.find(r=>r.outletId===o.id);return <article key={o.id}><span className="admin-small">{o.brand}</span><h3>{o.outletName}</h3><p><strong>{formatRating(row?.average??null)}</strong> average · <strong>{row?.total||0}</strong> reviews</p><Link href={`/review/${o.slug}`}>Open review page</Link></article>;})}</div></section>
      <section className="admin-panel"><div className="review-list-heading"><h2>Reviews</h2><span>{data.total} matching reviews</span></div>
      {data.reviews.length===0?<p className="admin-empty">No reviews match these filters.</p>:<div className="admin-reviews">{data.reviews.map(review=><article key={review.id} className="admin-review"><div className="review-top"><div><span className="admin-small">{review.brand}</span><h3>{review.outlet_name}</h3></div><span className={`rating-badge ${review.overall_rating<=3?"attention":""}`} aria-label={`${review.overall_rating} out of 5 stars`}>{"★".repeat(review.overall_rating)}{"☆".repeat(5-review.overall_rating)}</span></div>
        <p className="review-comment">{review.feedback || "Rating only — no written feedback."}</p>{review.categories.length>0&&<p className="review-categories">{review.categories.join(" · ")}</p>}
        {(review.customer_name||review.customer_contact)&&<p className="admin-small">{[review.customer_name,review.customer_contact].filter(Boolean).join(" · ")}</p>}
        <time className="admin-small" dateTime={review.created_at}>{new Intl.DateTimeFormat("en-MY",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kuala_Lumpur"}).format(new Date(review.created_at))} MYT</time>
      </article>)}</div>}
      <nav className="admin-pagination" aria-label="Review pages">{filters.page>1?<Link href={pageLink(filters.page-1)}>← Previous</Link>:<span/>}<span>Page {filters.page} of {pages}</span>{filters.page<pages?<Link href={pageLink(filters.page+1)}>Next →</Link>:<span/>}</nav></section>
    </>}
  </main>;
}
