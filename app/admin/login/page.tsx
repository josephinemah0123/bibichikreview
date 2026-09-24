import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { authConfigured } from "@/lib/supabase-server";
import { AdminLogin } from "@/components/admin/AdminLogin";
export const dynamic="force-dynamic";
export default async function LoginPage() {
  if(await currentAdmin())redirect("/admin");
  return <main><AdminLogin configured={authConfigured()}/></main>;
}
