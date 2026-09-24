import { SMTPServer } from 'smtp-server';
import selfsigned from 'selfsigned';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';

const pems=await selfsigned.generate([{name:'commonName',value:'localhost'}],{days:1,keySize:2048,extensions:[{name:'subjectAltName',altNames:[{type:2,value:'localhost'},{type:7,ip:'127.0.0.1'}]}]});
mkdirSync('.test-runtime',{recursive:true});
const ca=path.resolve('.test-runtime/smtp-local-ca.pem');writeFileSync(ca,pems.cert);
const messages=[];let reject=false;
const smtp=new SMTPServer({key:pems.private,cert:pems.cert,logger:false,
 onAuth(auth,session,callback){callback(auth.username==='local-test'&&auth.password==='local-only'?null:new Error('Bad credentials'),{user:'local-test'});},
 onRcptTo(address,session,callback){callback(reject?Object.assign(new Error('Local rejection test'),{responseCode:550}):null);},
 onData(stream,session,callback){let raw='';stream.on('data',chunk=>raw+=chunk);stream.on('end',()=>{messages.push({to:session.envelope.rcptTo.map(x=>x.address),raw});callback();});}
});
await new Promise(resolve=>smtp.listen(0,'127.0.0.1',resolve));
const port=smtp.server.address().port;
const base='http://localhost:5193';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','5193'],{env:{...process.env,NODE_EXTRA_CA_CERTS:ca,SMTP_HOST:'127.0.0.1',SMTP_PORT:String(port),SMTP_USER:'local-test',SMTP_PASS:'local-only',FEEDBACK_FROM_EMAIL:'local-test@example.com',FEEDBACK_TO_EMAIL:'feedback@bibichik.com',SITE_URL:base},stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',x=>logs+=x);child.stderr.on('data',x=>logs+=x);
const outlets=[['bibichik-ss2','BiBiChik SS2'],['bibichik-sunway-163','BiBiChik Sunway 163 Mall'],['aburii-yakiniku','Aburii Yakiniku']];
const payload=(outletId,rating=2)=>({id:randomUUID(),outletId,feedback:{rating,categories:['Food'],comment:'LOCAL SMTP TEST ONLY',name:'Local test',contact:'test@example.com',website:''}});
const post=(body,origin=base)=>fetch(base+'/api/feedback',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
try{
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{} await new Promise(r=>setTimeout(r,200));}assert.ok(ready,logs);
 for(const [id,name] of outlets){
  assert.equal((await fetch(base+'/review/'+id)).status,200);
  const body=payload(id);const responses=await Promise.all([post(body),post(body)]);
  for(const response of responses){assert.equal(response.status,200);assert.equal((await response.json()).success,true);}
  const message=messages.at(-1);assert.deepEqual(message.to,['feedback@bibichik.com']);
  assert.ok(message.raw.replace(/\r\n[ \t]+/g,' ').includes(`Subject: [Review Alert] ${name} - 2 Star Feedback`));
  const decoded=message.raw.replace(/=\r\n/g,'').replace(/=([0-9A-F]{2})/g,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
  assert.ok(decoded.includes(`Outlet: ${name}`));assert.ok(decoded.includes('Submission Date:'));assert.ok(decoded.includes('Submission Time:'));
  const conflict=await post({...body,feedback:{...body.feedback,comment:'different'}});assert.equal(conflict.status,409);
  console.log('PASS local SMTP:',name,'-> feedback@bibichik.com; retry deduplicated');
 }
 assert.equal(messages.length,3);
 assert.equal((await post(payload(outlets[0][0],5))).status,400);
 assert.equal((await post({...payload(outlets[0][0]),recipient:'other@example.com'})).status,400);
 assert.equal((await post(payload('unknown'))).status,400);
 assert.equal((await post(payload(outlets[0][0]),'https://wrong.example')).status,403);
 reject=true;assert.equal((await post(payload(outlets[0][0]))).status,502);assert.equal(messages.length,3);
 for(const url of ['/admin','/admin/login','/api/admin/login','/api/reviews']) assert.equal((await fetch(base+url)).status,404);
 console.log('PASS rejection, validation, origin protection, and removed routes');
}finally{
 child.kill();await once(child,'exit');await new Promise(resolve=>smtp.close(resolve));
}
