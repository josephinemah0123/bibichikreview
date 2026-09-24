import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

test("real PostgreSQL migration, outlet filters, pagination, idempotency, rate limits and private permissions",async()=>{
  const db=new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to service_role;");
    await db.exec(readFileSync(new URL("../supabase/migrations/001_review_system.sql",import.meta.url),"utf8"));
    await db.exec("set role service_role");
    const submit=async(id,outlet,rating=5)=> (await db.query("select public.submit_review($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as result",[id,outlet,outlet==="aburii-yakiniku"?"Aburii Yakiniku":"BiBiChik",outlet,rating,rating<=3?"Needs attention":"",rating<=3?["Service"]:[],"","","test-client"])).rows[0].result;
    const id=randomUUID(); assert.equal((await submit(id,"bibichik-ss2",2)).status,"saved");
    assert.equal((await submit(id,"bibichik-ss2",2)).status,"exists");
    assert.equal((await submit(id,"aburii-yakiniku",2)).status,"conflict");
    for(let i=0;i<27;i++)await submit(randomUUID(),"bibichik-sunway-163",4);
    await submit(randomUUID(),"aburii-yakiniku",5);
    const summary=async(brand=null,outlet=null,rating=null,category=null,from=null,to=null,page=1)=>(await db.query("select public.review_dashboard($1,$2,$3,$4,$5,$6,$7) as result",[brand,outlet,rating,category,from,to,page])).rows[0].result;
    const all=await summary();assert.equal(all.total,29);assert.equal(all.positive,28);assert.equal(all.needsAttention,1);assert.equal(all.fiveStar,1);assert.equal(all.reviews.length,25);assert.equal(all.outlets.length,3);assert.equal(all.trend[0].count,29);
    assert.equal((await summary(null,null,null,null,null,null,2)).reviews.length,4);
    assert.equal((await summary("BiBiChik")).total,28);
    assert.equal((await summary(null,"aburii-yakiniku")).average,5);
    assert.equal((await summary(null,null,2,"Service")).total,1);
    assert.equal((await summary(null,null,null,null,"2099-01-01T00:00:00Z")).total,0);
    assert.equal((await summary("BiBiChik","aburii-yakiniku")).total,0);
    for(let i=0;i<2;i++)assert.equal((await db.query("select public.take_rate_limit('test',2,900) as allowed")).rows[0].allowed,true);
    assert.equal((await db.query("select public.take_rate_limit('test',2,900) as allowed")).rows[0].allowed,false);
    await db.exec("reset role;set role anon");
    await assert.rejects(db.query("select * from public.reviews"));
    await assert.rejects(db.query("select public.review_dashboard()"));
    await db.exec("reset role;set role authenticated");
    await assert.rejects(db.query("select * from public.reviews"));
    await assert.rejects(db.query("select public.review_dashboard()"));
  } finally {await db.close();}
});
