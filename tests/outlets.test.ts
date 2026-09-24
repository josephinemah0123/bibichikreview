import test from "node:test";
import assert from "node:assert/strict";
import { findOutlet, outlets } from "../config/outlets";
import { reviewSchema,filterSchema,filterDates } from "../lib/reviews";
import { emailPayload } from "../lib/email";
import { feedbackSchema,EMPTY_DRAFT } from "../lib/feedback";
const base={id:"671c7455-d3ab-4c61-bc1f-4249cfb07521",outletId:"bibichik-ss2",overallRating:5,feedback:"",categories:[],customerName:"",customerContact:"",website:""};
test("canonical routes and old QR aliases resolve to the same outlet",()=>{
  for(const outlet of outlets){assert.equal(findOutlet(outlet.slug)?.id,outlet.id);for(const alias of outlet.aliases)assert.equal(findOutlet(alias)?.id,outlet.id);}
  assert.equal(findOutlet("not-a-restaurant"),undefined);
  assert.equal(new Set(outlets.map(o=>o.id)).size,outlets.length);
  assert.equal(findOutlet("sunway-163")?.googleReviewUrl,"");
  assert.equal(findOutlet("aburii")?.googleReviewUrl,"");
});
test("each outlet's email keeps existing fields and adds correct attribution",()=>{
  const feedback=feedbackSchema.parse({...EMPTY_DRAFT,rating:2,categories:["Service"]});
  for(const outlet of outlets){const result=emailPayload(feedback,`https://example.com/review/${outlet.slug}`,outlet,"2026-09-24T00:00:00.000Z");
    assert.equal(result.Branch,outlet.outletName);assert.equal(result.outletId,outlet.id);assert.equal(result.brand,outlet.brand);
    assert.equal(result._subject,`${outlet.outletName} Customer Feedback`);assert.equal(result.Rating,"2 / 5");assert.equal(result.createdAt,"2026-09-24T00:00:00.000Z");}
});
test("review validation rejects forged metadata, malformed ratings and invalid feedback",()=>{
  assert.equal(reviewSchema.safeParse(base).success,true);
  for(const extra of [{brand:"forged"},{createdAt:"2020-01-01"},{overallRating:6},{id:"123"},{website:"spam"},{feedback:"unsolicited",overallRating:5},{overallRating:1}])
    assert.equal(reviewSchema.safeParse({...base,...extra}).success,false);
  assert.equal(reviewSchema.safeParse({...base,overallRating:2,feedback:"Slow service"}).success,true);
});
test("date filters use inclusive Malaysian calendar days and reject impossible dates",()=>{
  const now=new Date("2026-09-23T18:00:00Z");
  assert.deepEqual(filterDates(filterSchema.parse({period:"today"}),now),{from:"2026-09-23T16:00:00.000Z",to:"2026-09-24T16:00:00.000Z"});
  assert.deepEqual(filterDates(filterSchema.parse({period:"7"}),now),{from:"2026-09-17T16:00:00.000Z",to:"2026-09-24T16:00:00.000Z"});
  assert.throws(()=>filterDates(filterSchema.parse({period:"custom",from:"2026-02-30",to:"2026-03-01"})));
  assert.throws(()=>filterDates(filterSchema.parse({period:"custom",from:"2026-10-01",to:"2026-09-01"})));
});
