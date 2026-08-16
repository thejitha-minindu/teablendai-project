"use client";

import { useEffect, useRef, useState } from "react";
import { getAnalyticsPurchases } from "@/services/dashboard/analyticsService";
import type { AnalyticsPurchasesResponse } from "@/types/dashboard/analytics-purchases.types";

const configuredMs = Number(process.env.NEXT_PUBLIC_ANALYTICS_REFRESH_MS ?? 30000);
const DEFAULT_REFRESH_MS = Number.isFinite(configuredMs) && configuredMs >= 5000 ? configuredMs : 30000;

export function useAnalyticsPurchases(refreshMs: number = DEFAULT_REFRESH_MS) {
  const [data, setData] = useState<AnalyticsPurchasesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const hasForcedInitialRefresh = useRef(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const forceRefresh = !hasForcedInitialRefresh.current;
        const payload = await getAnalyticsPurchases(forceRefresh);
        if (!mounted) return;
        hasForcedInitialRefresh.current = true;
        setData(payload);
        setLastUpdated(payload.generatedAt);
        setError(null);
        setIsStale(false);
      } catch (err) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load purchase analytics";
        setError(msg);
        setIsStale(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, refreshMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [refreshMs]);

  return { data, loading, error, isStale, lastUpdated };
}
