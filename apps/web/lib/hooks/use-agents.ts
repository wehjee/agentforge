"use client";

import { useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAgentStore } from "@/stores/agent-store";
import type { Agent } from "@shared/types";

interface AgentListResponse {
  data: Agent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useAgents() {
  const {
    agents,
    total,
    loading,
    search,
    statusFilter,
    page,
    setAgents,
    setLoading,
  } = useAgentStore();

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await apiFetch<AgentListResponse>("/agents", { params });
      const body = res as unknown as { success: boolean } & AgentListResponse;
      setAgents(body.data || [], body.pagination?.total || 0);
    } catch {
      setAgents([], 0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, setAgents, setLoading]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, total, loading, refetch: fetchAgents };
}
