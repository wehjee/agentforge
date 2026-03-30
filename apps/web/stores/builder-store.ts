"use client";

import { create } from "zustand";
import type { AgentConfig, AgentTool, AgentVariable } from "@shared/types";
import { DEFAULT_AGENT_CONFIG, BUILTIN_TOOLS } from "@shared/types";

export type BuilderTab = "visual" | "code";

export interface PlaygroundMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tokenUsage?: { input: number; output: number };
  latencyMs?: number;
  isStreaming?: boolean;
}

interface BuilderState {
  // Agent identity
  name: string;
  description: string;
  tags: string[];

  // Config
  config: AgentConfig;

  // Builder mode
  activeTab: BuilderTab;

  // Config panel state
  expandedPanel: string | null;

  // Playground
  playgroundMessages: PlaygroundMessage[];
  playgroundStreaming: boolean;
  testVariables: Record<string, string>;
  showPlayground: boolean;

  // Dirty state
  isDirty: boolean;
  saving: boolean;

  // Actions
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setTags: (tags: string[]) => void;
  setConfig: (config: AgentConfig) => void;
  updateConfig: <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => void;
  setActiveTab: (tab: BuilderTab) => void;
  setExpandedPanel: (panel: string | null) => void;
  togglePanel: (panel: string) => void;

  // Tool actions
  toggleTool: (toolId: string) => void;

  // Variable actions
  addVariable: (variable: AgentVariable) => void;
  removeVariable: (id: string) => void;
  updateVariable: (id: string, updates: Partial<AgentVariable>) => void;

  // Playground actions
  addPlaygroundMessage: (message: PlaygroundMessage) => void;
  updatePlaygroundMessage: (id: string, content: string) => void;
  clearPlayground: () => void;
  setPlaygroundStreaming: (streaming: boolean) => void;
  setTestVariable: (key: string, value: string) => void;
  setShowPlayground: (show: boolean) => void;

  // Save actions
  setSaving: (saving: boolean) => void;
  markClean: () => void;

  // Initialize from agent data
  initFromAgent: (agent: { name: string; description: string | null; tags: string[]; config: AgentConfig }) => void;
  reset: () => void;
}

function getInitialConfig(): AgentConfig {
  return {
    ...DEFAULT_AGENT_CONFIG,
    tools: BUILTIN_TOOLS.map((t) => ({ ...t })),
  };
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  name: "",
  description: "",
  tags: [],
  config: getInitialConfig(),
  activeTab: "visual",
  expandedPanel: "identity",
  playgroundMessages: [],
  playgroundStreaming: false,
  testVariables: {},
  showPlayground: true,
  isDirty: false,
  saving: false,

  setName: (name) => set({ name, isDirty: true }),
  setDescription: (description) => set({ description, isDirty: true }),
  setTags: (tags) => set({ tags, isDirty: true }),

  setConfig: (config) => set({ config, isDirty: true }),

  updateConfig: (key, value) =>
    set((state) => ({
      config: { ...state.config, [key]: value },
      isDirty: true,
    })),

  setActiveTab: (activeTab) => set({ activeTab }),
  setExpandedPanel: (expandedPanel) => set({ expandedPanel }),
  togglePanel: (panel) =>
    set((state) => ({
      expandedPanel: state.expandedPanel === panel ? null : panel,
    })),

  toggleTool: (toolId) =>
    set((state) => ({
      config: {
        ...state.config,
        tools: state.config.tools.map((t) =>
          t.id === toolId ? { ...t, enabled: !t.enabled } : t
        ),
      },
      isDirty: true,
    })),

  addVariable: (variable) =>
    set((state) => ({
      config: {
        ...state.config,
        variables: [...state.config.variables, variable],
      },
      isDirty: true,
    })),

  removeVariable: (id) =>
    set((state) => ({
      config: {
        ...state.config,
        variables: state.config.variables.filter((v) => v.id !== id),
      },
      isDirty: true,
    })),

  updateVariable: (id, updates) =>
    set((state) => ({
      config: {
        ...state.config,
        variables: state.config.variables.map((v) =>
          v.id === id ? { ...v, ...updates } : v
        ),
      },
      isDirty: true,
    })),

  addPlaygroundMessage: (message) =>
    set((state) => ({
      playgroundMessages: [...state.playgroundMessages, message],
    })),

  updatePlaygroundMessage: (id, content) =>
    set((state) => ({
      playgroundMessages: state.playgroundMessages.map((m) =>
        m.id === id ? { ...m, content, isStreaming: false } : m
      ),
    })),

  clearPlayground: () => set({ playgroundMessages: [], testVariables: {} }),

  setPlaygroundStreaming: (playgroundStreaming) => set({ playgroundStreaming }),

  setTestVariable: (key, value) =>
    set((state) => ({
      testVariables: { ...state.testVariables, [key]: value },
    })),

  setShowPlayground: (showPlayground) => set({ showPlayground }),

  setSaving: (saving) => set({ saving }),
  markClean: () => set({ isDirty: false }),

  initFromAgent: (agent) =>
    set({
      name: agent.name,
      description: agent.description || "",
      tags: agent.tags || [],
      config: {
        ...getInitialConfig(),
        ...(agent.config as AgentConfig),
        tools:
          (agent.config as AgentConfig).tools?.length > 0
            ? (agent.config as AgentConfig).tools
            : BUILTIN_TOOLS.map((t) => ({ ...t })),
      },
      isDirty: false,
    }),

  reset: () =>
    set({
      name: "",
      description: "",
      tags: [],
      config: getInitialConfig(),
      activeTab: "visual",
      expandedPanel: "identity",
      playgroundMessages: [],
      playgroundStreaming: false,
      testVariables: {},
      showPlayground: true,
      isDirty: false,
      saving: false,
    }),
}));
