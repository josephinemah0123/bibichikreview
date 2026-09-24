import { rpc } from "./supabase-server";
import { filterDates, type DashboardData, type DashboardFilters } from "./reviews";
export async function loadDashboard(filters: DashboardFilters) {
  const dates=filterDates(filters);
  return rpc<DashboardData>("review_dashboard",{
    p_brand:filters.brand || null,p_outlet:filters.outlet || null,p_rating:filters.rating || null,
    p_category:filters.category || null,p_from:dates.from,p_to:dates.to,p_page:filters.page,
  });
}
