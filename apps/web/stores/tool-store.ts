"use client";

import { create } from "zustand";
import type { ToolDefinition } from "@shared/types";

interface ToolStoreState {
  tools: ToolDefinition[];
  total: number;
  loading: boolean;
  search: string;
  typeFilter: "ALL" | "BUILTIN" | "API" | "CODE";

  setTools: (tools: ToolDefinition[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setSearch: (search: string) => void;
  setTypeFilter: (filter: "ALL" | "BUILTIN" | "API" | "CODE") => void;
}

export const useToolStore = create<ToolStoreState>((set) => ({
  tools: [],
  total: 0,
  loading: false,
  search: "",
  typeFilter: "ALL",

  setTools: (tools, total) => set({ tools, total }),
  setLoading: (loading) => set({ loading }),
  setSearch: (search) => set({ search }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
}));
