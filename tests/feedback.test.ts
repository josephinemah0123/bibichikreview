import test from "node:test";
import assert from "node:assert/strict";
import { feedbackSchema, EMPTY_DRAFT } from "../lib/feedback";
import { feedbackMessage } from "../lib/email";
import { outlets, findOutlet } from "../config/outlets";
import { sameOrigin, readJson, allowSubmission } from "../lib/http-security";

test("only low ratings, legitimate categories, and a comment or category are accepted", () => {
 for (const rating of [0,4,5]) assert.equal(feedbackSchema.safeParse({...EMPTY_DRAFT,rating,categories:["Food"]}).success,false);
 for(const extra of [{comment:" "},{categories:["Bogus"]},{categories:["Food"],website:"bot"},{categories:["Food"],contact:"bad@"}])
  assert.equal(feedbackSchema.safeParse({...EMPTY_DRAFT,rating:2,...extra}).success,false);
 assert.equal(feedbackSchema.safeParse({...EMPTY_DRAFT,rating:2,comment:"Slow"}).success,true);
});
test("all three emails have the correct subject and escaped customer details", () => {
 for(const outlet of outlets){
  const input=feedbackSchema.parse({...EMPTY_DRAFT,rating:2,categories:["Food"],comment:'<script>alert("x")</script>',name:"Local test",contact:"tester@example.com"});
  const mail=feedbackMessage(input,outlet,new Date("2026-09-24T00:00:00Z"));
  assert.equal(mail.subject,`[Review Alert] ${outlet.outletName} - 2 Star Feedback`);
  assert.ok(mail.text.includes(`Brand: ${outlet.brand}`));
  assert.ok(mail.text.includes(`Outlet: ${outlet.outletName}`));
  assert.ok(mail.text.includes("08:00:00"));
  assert.ok(mail.html.includes("&lt;script&gt;"));
  assert.ok(!mail.html.includes("<script>"));
  assert.equal(mail.replyTo,"tester@example.com");
  assert.ok(!("notificationEmail" in outlet));
 }
});
test("optional fields remain optional and phone is not used as reply-to",()=>{
 const mail=feedbackMessage(feedbackSchema.parse({...EMPTY_DRAFT,rating:1,categories:["Service"],contact:"+60123456789"}),outlets[0]);
 assert.ok(mail.text.includes("Customer Phone: +60123456789"));
 assert.ok(!mail.text.includes("Customer Name:"));
 assert.equal(mail.replyTo,undefined);
 assert.equal(findOutlet("ss2")?.id,"bibichik-ss2");
});
test("origin, body limits, and submission throttle",async()=>{
 assert.equal(sameOrigin(new Request("http://localhost/api/feedback",{headers:{origin:"https://evil.example"}})),false);
 await assert.rejects(readJson(new Request("http://localhost",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({a:"x".repeat(25000)})})));
 const req=new Request("http://localhost");
 for(let i=0;i<30;i++) assert.equal(allowSubmission(req),true);
 assert.equal(allowSubmission(req),false);
});
