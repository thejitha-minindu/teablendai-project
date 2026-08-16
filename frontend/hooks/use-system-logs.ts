import { useState, useEffect, useCallback, useRef } from "react";
import { SystemLog, SystemLogFilters } from "@/types/admin/system-log.types";
import { getSystemLogs, createSSEConnection } from "@/services/admin/systemLogService";

export function useSystemLogs(initialLimit = 20) {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(true); // Default to live streaming!
  const [filters, setFilters] = useState<SystemLogFilters>({
    page: 1,
    limit: initialLimit,
    status: "",
    activity_type: "",
    date_from: "",
    date_to: "",
    search: "",
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch logs via REST
  const fetchLogs = useCallback(async (currentFilters: SystemLogFilters) => {
    setIsLoading(true);
    try {
      const response = await getSystemLogs(currentFilters);
      setLogs(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch system logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update filters helper
  const setFilter = useCallback((key: keyof SystemLogFilters, value: any) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value };
      if (key !== "page") {
        updated.page = 1; // Reset to page 1 on filter changes
      }
      return updated;
    });
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: initialLimit,
      status: "",
      activity_type: "",
      date_from: "",
      date_to: "",
      search: "",
    });
  }, [initialLimit]);

  // Connect SSE
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const source = createSSEConnection(
      (newLog) => {
        setLogs((prev) => {
          // Avoid duplicate entries
          if (prev.some((log) => log.id === newLog.id)) {
            return prev;
          }
          // Prepend new log and slice to prevent memory bloat
          const updated = [newLog, ...prev];
          return updated.slice(0, 100);
        });
        setTotal((prev) => prev + 1);
      },
      (error) => {
        console.error("SSE connection error:", error);
      }
    );

    eventSourceRef.current = source;
  }, []);

  // Handle SSE lifecycle and REST fetches
  useEffect(() => {
    if (isLive) {
      // Connect to SSE stream
      connectSSE();
    } else {
      // Close SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      // Fetch current logs via REST
      fetchLogs(filters);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isLive, filters, fetchLogs, connectSSE]);

  const toggleLive = useCallback(() => {
    setIsLive((prev) => !prev);
  }, []);

  return {
    logs,
    total,
    isLoading,
    isLive,
    filters,
    setFilter,
    resetFilters,
    toggleLive,
    refresh: () => fetchLogs(filters),
  };
}
