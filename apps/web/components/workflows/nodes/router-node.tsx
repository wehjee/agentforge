"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { GitFork } from "lucide-react";
import { BaseNode } from "./base-node";
import { Badge } from "@/components/ui/badge";
import type { WorkflowNodeData } from "@shared/types";

function RouterNodeComponent(props: NodeProps<WorkflowNodeData>) {
  const mode = (props.data.config?.mode as string) || "rules";
  const conditions = (props.data.config?.conditions as unknown[]) || [];

  return (
    <BaseNode
      {...props}
      icon={<GitFork className="h-3.5 w-3.5" />}
      subtitle="Router"
      hasOutput={false}
      extraHandles={
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="default"
            className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-white !bg-amber-400"
            style={{ left: "30%" }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="route-1"
            className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-white !bg-amber-400"
            style={{ left: "70%" }}
          />
        </>
      }
    >
      <div className="flex items-center gap-1.5">
        <Badge
          variant="secondary"
          className="bg-amber-50 text-[10px] font-normal text-amber-600"
        >
          {mode === "llm" ? "LLM Classify" : `${conditions.length} rules`}
        </Badge>
      </div>
    </BaseNode>
  );
}

export const RouterNode = memo(RouterNodeComponent);
