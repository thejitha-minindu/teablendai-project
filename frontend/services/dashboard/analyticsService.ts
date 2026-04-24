import { apiClient } from "@/lib/apiClient";
import type { AnalyticsOverviewResponse } from "@/types/dashboard/analytics-overview.types";
import type { AnalyticsPurchasesResponse } from "@/types/dashboard/analytics-purchases.types";
import type { AnalyticsSalesResponse } from "@/types/dashboard/analytics-sales.types";
import type { AnalyticsBlendsResponse } from "@/types/dashboard/analytics-blends.types";

export async function getAnalyticsOverview(forceRefresh = false): Promise<AnalyticsOverviewResponse> {
  const response = await apiClient.get<AnalyticsOverviewResponse>("/dashboard/analytics/overview", {
    params: { force_refresh: forceRefresh },
  });
  return response.data;
}

export async function getAnalyticsPurchases(forceRefresh = false): Promise<AnalyticsPurchasesResponse> {
  const response = await apiClient.get<AnalyticsPurchasesResponse>("/dashboard/analytics/purchases", {
    params: { force_refresh: forceRefresh },
  });
  return response.data;
}

export async function getAnalyticsSales(forceRefresh = false): Promise<AnalyticsSalesResponse> {
  const response = await apiClient.get<AnalyticsSalesResponse>("/dashboard/analytics/sales", {
    params: { force_refresh: forceRefresh },
  });
  return response.data;
}

export async function getAnalyticsBlends(forceRefresh = false): Promise<AnalyticsBlendsResponse> {
  const response = await apiClient.get<AnalyticsBlendsResponse>("/dashboard/analytics/blends", {
    params: { force_refresh: forceRefresh },
  });
  return response.data;
}
