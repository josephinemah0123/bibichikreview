import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { filterSchema, type DashboardData } from "@/lib/reviews";
import { loadDashboard } from "@/lib/dashboard";
import { FeedbackDashboard } from "@/components/admin/FeedbackDashboard";
export const dynamic="force-dynamic";
export default async function Dashboard({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const admin=await currentAdmin();
  if(!admin)redirect("/admin/login");
  const parsed=filterSchema.safeParse(await searchParams);
  const filters=parsed.success?parsed.data:filterSchema.parse({});
  let data:DashboardData|null=null,error=parsed.success?"":"Invalid filters. Please adjust your selection.";
  if(!error){try{data=await loadDashboard(filters);}catch(e){error=e instanceof Error && e.message==="Choose a valid date range."?e.message:"Could not load reviews. Check the Supabase connection and run the database migration, then try again.";}}
  return <FeedbackDashboard data={data} filters={filters} error={error} email={admin.email}/>;
}
