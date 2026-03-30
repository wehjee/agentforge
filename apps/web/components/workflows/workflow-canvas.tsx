"use client";

import { useCallback, useRef, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { useWorkflowStore } from "@/stores/workflow-store";
import { NodePalette } from "./node-palette";
import { NodeConfigPanel } from "./node-config-panel";
import { WorkflowToolbar } from "./workflow-toolbar";
import { TriggerNode } from "./nodes/trigger-node";
import { AgentNode } from "./nodes/agent-node";
import { RouterNode } from "./nodes/router-node";
import { ConditionalNode } from "./nodes/conditional-node";
import { ParallelNode } from "./nodes/parallel-node";
import { HumanNode } from "./nodes/human-node";
import { TransformNode } from "./nodes/transform-node";
import { OutputNode } from "./nodes/output-node";
import type { WorkflowNodeData, NodeType } from "@shared/types";

const nodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  router: RouterNode,
  conditional: ConditionalNode,
  parallel: ParallelNode,
  human: HumanNode,
  transform: TransformNode,
  output: OutputNode,
};

const defaultEdgeOptions = {
  type: "smoothstep",
  animated: false,
  style: { stroke: "#E0D6C9", strokeWidth: 2 },
};

const DEFAULT_NODE_CONFIGS: Record<string, Record<string, unknown>> = {
  trigger: { triggerType: "manual" },
  agent: { agentId: "", agentName: "", retryCount: 0, timeoutMs: 30000, inputMappings: {}, outputMappings: {} },
  router: { mode: "rules", conditions: [] },
  conditional: { expression: "", trueLabel: "True", falseLabel: "False" },
  parallel: { mergeStrategy: "wait_all" },
  human: { message: "", approvalButtons: [{ label: "Approve", value: "approved" }, { label: "Reject", value: "rejected" }] },
  transform: { code: "", description: "" },
  output: { outputType: "return" },
};

let nodeIdCounter = 0;

function generateNodeId(): string {
  nodeIdCounter += 1;
  return `node_${Date.now()}_${nodeIdCounter}`;
}

function CanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    selectedNodeId,
    setNodes,
    setEdges,
    setSelectedNodeId,
    addNode,
    addEdge: storeAddEdge,
    pushHistory,
  } = useWorkflowStore();

  // Node changes (position, selection, removal)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const updated = applyNodeChanges(changes, nodes) as Node<WorkflowNodeData>[];
      setNodes(updated);

      // Track selection
      for (const change of changes) {
        if (change.type === "select" && change.selected) {
          setSelectedNodeId(change.id);
        }
      }
    },
    [nodes, setNodes, setSelectedNodeId]
  );

  // Edge changes
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const updated = applyEdgeChanges(changes, edges);
      setEdges(updated);
    },
    [edges, setEdges]
  );

  // New connection
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const newEdge: Edge = {
        id: `edge_${connection.source}_${connection.target}_${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
        type: "smoothstep",
        style: { stroke: "#E0D6C9", strokeWidth: 2 },
      };
      storeAddEdge(newEdge);
    },
    [storeAddEdge]
  );

  // Drop handler for palette drag
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData(
        "application/reactflow-type"
      ) as NodeType;
      const label = event.dataTransfer.getData("application/reactflow-label");

      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<WorkflowNodeData> = {
        id: generateNodeId(),
        type: nodeType,
        position,
        data: {
          label: label || nodeType,
          nodeType,
          config: { ...(DEFAULT_NODE_CONFIGS[nodeType] || {}) },
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  // Click on canvas background deselects node
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          useWorkflowStore.getState().redo();
        } else {
          useWorkflowStore.getState().undo();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Auto-layout using dagre
  const handleAutoLayout = useCallback(async () => {
    try {
      const dagreModule = await import("dagre");
      const dagre = dagreModule.default || dagreModule;
      const g = new dagre.graphlib.Graph();
      g.setDefaultEdgeLabel(() => ({}));
      g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });

      for (const node of nodes) {
        g.setNode(node.id, { width: 220, height: 80 });
      }

      for (const edge of edges) {
        g.setEdge(edge.source, edge.target);
      }

      dagre.layout(g);

      pushHistory();

      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - 110,
            y: nodeWithPosition.y - 40,
          },
        };
      });

      setNodes(layoutedNodes as Node<WorkflowNodeData>[]);
    } catch (err) {
      console.error("Auto-layout failed:", err);
    }
  }, [nodes, edges, pushHistory, setNodes]);

  // Edge styling based on selection
  const styledEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      style: {
        stroke:
          selectedNodeId &&
          (edge.source === selectedNodeId || edge.target === selectedNodeId)
            ? "#4CAF52"
            : "#d4d4d8",
        strokeWidth: 2,
      },
    }));
  }, [edges, selectedNodeId]);

  return (
    <div className="flex h-full flex-col">
      <WorkflowToolbar onAutoLayout={handleAutoLayout} />
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            deleteKeyCode={["Backspace", "Delete"]}
            className="bg-slate-50"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color="#E0D6C9"
            />
            <Controls
              showInteractive={false}
              className="!rounded-lg !border-slate-200 !bg-white !shadow-sm [&>button]:!border-slate-200 [&>button]:!bg-white [&>button:hover]:!bg-slate-50"
            />
            <MiniMap
              className="!rounded-lg !border-slate-200 !bg-white !shadow-sm"
              maskColor="rgba(0, 0, 0, 0.08)"
              nodeColor={(node) => {
                const colors: Record<string, string> = {
                  trigger: "#8b5cf6",
                  agent: "#4CAF52",
                  router: "#f59e0b",
                  conditional: "#f97316",
                  parallel: "#06b6d4",
                  human: "#22c55e",
                  transform: "#6366f1",
                  output: "#f43f5e",
                };
                return colors[node.type || ""] || "#a1a1aa";
              }}
            />
          </ReactFlow>
        </div>
        <NodeConfigPanel />
      </div>
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
