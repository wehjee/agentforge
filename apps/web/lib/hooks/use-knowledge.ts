"use client";

import { useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useKBStore } from "@/stores/kb-store";
import type { KnowledgeBase } from "@shared/types";

interface KBListResponse {
  data: KnowledgeBase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useKnowledgeBases() {
  const { kbs, total, loading, search, setKBs, setLoading } = useKBStore();

  const fetchKBs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 100 };
      if (search) params.search = search;

      const res = await apiFetch<KBListResponse>("/knowledge", { params });
      const body = res as unknown as { success: boolean } & KBListResponse;
      setKBs(body.data || [], body.pagination?.total || 0);
    } catch {
      setKBs([], 0);
    } finally {
      setLoading(false);
    }
  }, [search, setKBs, setLoading]);

  useEffect(() => {
    fetchKBs();
  }, [fetchKBs]);

  return { kbs, total, loading, refetch: fetchKBs };
}
