"use client";

import { create } from "zustand";

interface WorkspaceState {
  workspaceId: string | null;
  workspaceName: string | null;
  setWorkspace: (id: string, name: string) => void;
  clear: () => void;
}

function getStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("workspaceId");
  } catch {
    return null;
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaceId: getStoredWorkspaceId(),
  workspaceName: null,
  setWorkspace: (id, name) => {
    localStorage.setItem("workspaceId", id);
    set({ workspaceId: id, workspaceName: name });
  },
  clear: () => {
    localStorage.removeItem("workspaceId");
    set({ workspaceId: null, workspaceName: null });
  },
}));
