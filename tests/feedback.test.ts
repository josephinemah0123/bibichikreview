import test from "node:test";
import assert from "node:assert/strict";
import { feedbackSchema, EMPTY_DRAFT } from "../lib/feedback";
import { emailPayload, sendFeedback } from "../lib/email";

const config = { recipient: "josephinemah0419@gmail.com", pageUrl: "https://example.com/review/ss2" };
const validFeedback = () => feedbackSchema.parse({
  ...EMPTY_DRAFT, rating: 2, categories: ["Food", "Waiting Time"],
  comment: "Please serve together.", name: "Test Customer", contact: "customer@example.com",
});

test("requires a category or meaningful comment and only accepts ratings 1–3", () => {
  for (const rating of [0, 4, 5]) assert.equal(feedbackSchema.safeParse({...EMPTY_DRAFT, rating, categories:["Food"]}).success, false);
  assert.equal(feedbackSchema.safeParse({...EMPTY_DRAFT, rating:2, comment:"   "}).success, false);
  assert.equal(feedbackSchema.safeParse({...EMPTY_DRAFT, rating:2, categories:["Food"]}).success, true);
  assert.equal(feedbackSchema.safeParse({...EMPTY_DRAFT, rating:2, comment:"Too slow"}).success, true);
  assert.equal(feedbackSchema.safeParse({...EMPTY_DRAFT, rating:2, categories:["Unexpected"]}).success, false);
  assert.equal(feedbackSchema.safeParse({...EMPTY_DRAFT, rating:2, categories:["Food"], website:"bot"}).success, false);
});

test("validates optional contact and deduplicates categories", () => {
  assert.equal(feedbackSchema.safeParse({...EMPTY_DRAFT, rating:2, categories:["Food"], contact:"bad@"}).success, false);
  for (const contact of ["", "+60 12-345 6789", "customer@example.com"])
    assert.equal(feedbackSchema.safeParse({...EMPTY_DRAFT, rating:2, categories:["Food"], contact}).success, true);
  assert.deepEqual(feedbackSchema.parse({...EMPTY_DRAFT, rating:2, categories:["Food", "Food"]}).categories, ["Food"]);
});

test("maps the six requested fields and exact subject to FormSubmit", () => {
  const payload = emailPayload(validFeedback(), config.pageUrl);
  assert.deepEqual(Object.fromEntries(Object.entries(payload).filter(([key]) => !key.startsWith("_"))), {
    Branch: "BiBiChik SS2", Rating: "2 / 5", "Areas to Improve": "Food, Waiting Time",
    Comment: "Please serve together.", "Customer Name": "Test Customer", "Customer Contact": "customer@example.com",
  });
  assert.equal(payload._subject, "BiBiChik SS2 Customer Feedback");
  assert.equal(payload._captcha, "false");
  assert.equal(payload._url, config.pageUrl);
});

test("uses the recipient AJAX endpoint and accepts both success response formats", async () => {
  for (const success of [true, "true"]) {
    let calls = 0;
    const transport = (async (url: unknown, init: RequestInit) => {
      calls++;
      assert.equal(url, "https://formsubmit.co/ajax/josephinemah0419@gmail.com");
      assert.equal(init.method, "POST");
      assert.equal(init.redirect, "error");
      assert.deepEqual(JSON.parse(init.body as string), emailPayload(validFeedback(), config.pageUrl));
      return Response.json({success});
    }) as typeof fetch;
    await sendFeedback(validFeedback(), config, transport);
    assert.equal(calls, 1);
  }
});

test("rejects failed, malformed, and network-error responses without automatic retries", async () => {
  for (const result of [{success:false}, {success:"false"}, {}, {success:1}])
    await assert.rejects(sendFeedback(validFeedback(), config, (async () => Response.json(result)) as typeof fetch));
  await assert.rejects(sendFeedback(validFeedback(), config, (async () => new Response("fail", {status:500})) as typeof fetch));
  await assert.rejects(sendFeedback(validFeedback(), config, (async () => new Response("<html>thanks</html>")) as typeof fetch));
  let calls = 0;
  await assert.rejects(sendFeedback(validFeedback(), config, (async () => { calls++; throw new Error("network unavailable"); }) as typeof fetch));
  assert.equal(calls, 1);
});

test("keeps optional fields explicit when omitted", () => {
  const payload = emailPayload(feedbackSchema.parse({...EMPTY_DRAFT, rating:1, categories:["Service"]}), config.pageUrl);
  assert.equal(payload.Comment, "Not provided");
  assert.equal(payload["Customer Name"], "Not provided");
  assert.equal(payload["Customer Contact"], "Not provided");
});

