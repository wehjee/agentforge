"use client";

import { create } from "zustand";
import type { Node, Edge } from "reactflow";
import type { WorkflowNodeData } from "@shared/types";

interface HistoryEntry {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
}

interface WorkflowStoreState {
  // Canvas state
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Undo/redo
  past: HistoryEntry[];
  future: HistoryEntry[];

  // Workflow metadata
  workflowId: string | null;
  workflowName: string;
  workflowDescription: string;
  isDirty: boolean;

  // Actions
  setNodes: (nodes: Node<WorkflowNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  addNode: (node: Node<WorkflowNodeData>) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (edgeId: string) => void;

  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Metadata
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (desc: string) => void;
  setDirty: (dirty: boolean) => void;

  // Bulk load
  loadCanvas: (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowStoreState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  past: [],
  future: [],
  workflowId: null,
  workflowName: "Untitled Workflow",
  workflowDescription: "",
  isDirty: false,

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  addNode: (node) => {
    const state = get();
    state.pushHistory();
    set({ nodes: [...state.nodes, node], isDirty: true });
  },

  updateNodeData: (nodeId, data) => {
    const state = get();
    set({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
      isDirty: true,
    });
  },

  removeNode: (nodeId) => {
    const state = get();
    state.pushHistory();
    set({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeId:
        state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      isDirty: true,
    });
  },

  addEdge: (edge) => {
    const state = get();
    state.pushHistory();
    set({ edges: [...state.edges, edge], isDirty: true });
  },

  removeEdge: (edgeId) => {
    const state = get();
    state.pushHistory();
    set({
      edges: state.edges.filter((e) => e.id !== edgeId),
      isDirty: true,
    });
  },

  pushHistory: () => {
    const state = get();
    set({
      past: [
        ...state.past.slice(-49),
        { nodes: [...state.nodes], edges: [...state.edges] },
      ],
      future: [],
    });
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const prev = state.past[state.past.length - 1];
    set({
      past: state.past.slice(0, -1),
      future: [
        { nodes: [...state.nodes], edges: [...state.edges] },
        ...state.future,
      ],
      nodes: prev.nodes,
      edges: prev.edges,
      isDirty: true,
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    set({
      future: state.future.slice(1),
      past: [
        ...state.past,
        { nodes: [...state.nodes], edges: [...state.edges] },
      ],
      nodes: next.nodes,
      edges: next.edges,
      isDirty: true,
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  setWorkflowId: (id) => set({ workflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name, isDirty: true }),
  setWorkflowDescription: (desc) =>
    set({ workflowDescription: desc, isDirty: true }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  loadCanvas: (nodes, edges) =>
    set({ nodes, edges, past: [], future: [], isDirty: false }),

  reset: () =>
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      past: [],
      future: [],
      workflowId: null,
      workflowName: "Untitled Workflow",
      workflowDescription: "",
      isDirty: false,
    }),
}));
