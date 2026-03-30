"use client";

import { useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useToolStore } from "@/stores/tool-store";
import type { ToolDefinition } from "@shared/types";

interface ToolListResponse {
  data: ToolDefinition[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useTools() {
  const { tools, total, loading, search, typeFilter, setTools, setLoading } =
    useToolStore();

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 100 };
      if (search) params.search = search;
      if (typeFilter !== "ALL") params.type = typeFilter;

      const res = await apiFetch<ToolListResponse>("/tools", { params });
      const body = res as unknown as { success: boolean } & ToolListResponse;
      setTools(body.data || [], body.pagination?.total || 0);
    } catch {
      setTools([], 0);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, setTools, setLoading]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return { tools, total, loading, refetch: fetchTools };
}
