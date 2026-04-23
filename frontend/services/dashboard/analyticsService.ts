import { apiClient } from "@/lib/apiClient";
import type { AnalyticsOverviewResponse } from "@/types/dashboard/analytics-overview.types";

export async function getAnalyticsOverview(forceRefresh = false): Promise<AnalyticsOverviewResponse> {
  const response = await apiClient.get<AnalyticsOverviewResponse>("/admin/analytics/overview", {
    params: { force_refresh: forceRefresh },
  });
  return response.data;
}
