"use client";

import { create } from "zustand";
import type { Agent, AgentStatus } from "@shared/types";

type ViewMode = "grid" | "list";

interface AgentStoreState {
  agents: Agent[];
  total: number;
  loading: boolean;
  viewMode: ViewMode;
  search: string;
  statusFilter: AgentStatus | "ALL";
  page: number;
  setAgents: (agents: Agent[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: AgentStatus | "ALL") => void;
  setPage: (page: number) => void;
}

export const useAgentStore = create<AgentStoreState>((set) => ({
  agents: [],
  total: 0,
  loading: false,
  viewMode: "grid",
  search: "",
  statusFilter: "ALL",
  page: 1,
  setAgents: (agents, total) => set({ agents, total }),
  setLoading: (loading) => set({ loading }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSearch: (search) => set({ search, page: 1 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
  setPage: (page) => set({ page }),
}));
