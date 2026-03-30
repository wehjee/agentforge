"use client";

import { create } from "zustand";
import type { KnowledgeBase } from "@shared/types";

interface KBStoreState {
  kbs: KnowledgeBase[];
  total: number;
  loading: boolean;
  search: string;

  setKBs: (kbs: KnowledgeBase[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setSearch: (search: string) => void;
}

export const useKBStore = create<KBStoreState>((set) => ({
  kbs: [],
  total: 0,
  loading: false,
  search: "",

  setKBs: (kbs, total) => set({ kbs, total }),
  setLoading: (loading) => set({ loading }),
  setSearch: (search) => set({ search }),
}));
