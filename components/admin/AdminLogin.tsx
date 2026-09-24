"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function AdminLogin({configured}:{configured:boolean}) {
  const router=useRouter();
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy)return;
    const form=new FormData(event.currentTarget); setBusy(true);setError("");
    try {
      const response=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:form.get("email"),password:form.get("password")})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error || "Unable to sign in.");
      router.replace("/admin");router.refresh();
    } catch(error){setError(error instanceof Error?error.message:"Unable to sign in.");setBusy(false);}
  }
  return <section className="admin-login admin-panel"><p className="admin-eyebrow">RESTAURANT MANAGEMENT</p><h1>Welcome back</h1><p>Sign in to view feedback across your outlets.</p>
    {!configured && <p className="admin-notice" role="status">Admin access is not configured yet. Connect Supabase Auth and configure the administrator email allowlist on the server.</p>}
    <form onSubmit={submit}><label>Email<input name="email" type="email" required autoComplete="username" maxLength={180}/></label><label>Password<input name="password" type="password" required autoComplete="current-password" maxLength={256}/></label>
    {error && <p role="alert" className="admin-error">{error}</p>}<button type="submit" disabled={!configured || busy}>{busy?"Signing in…":"Sign in"}</button></form>
  </section>;
}
