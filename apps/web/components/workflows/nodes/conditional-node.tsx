"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { GitBranch } from "lucide-react";
import { BaseNode } from "./base-node";
import type { WorkflowNodeData } from "@shared/types";

function ConditionalNodeComponent(props: NodeProps<WorkflowNodeData>) {
  const expression = (props.data.config?.expression as string) || "";
  const trueLabel = (props.data.config?.trueLabel as string) || "True";
  const falseLabel = (props.data.config?.falseLabel as string) || "False";

  return (
    <BaseNode
      {...props}
      icon={<GitBranch className="h-3.5 w-3.5" />}
      subtitle="If / Else"
      hasOutput={false}
      extraHandles={
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-white !bg-green-400"
            style={{ left: "30%" }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-white !bg-red-400"
            style={{ left: "70%" }}
          />
        </>
      }
    >
      {expression && (
        <p className="truncate text-[10px] font-mono text-slate-400">
          {expression}
        </p>
      )}
      <div className="mt-1.5 flex items-center gap-3 text-[10px]">
        <span className="text-green-600">{trueLabel}</span>
        <span className="text-red-500">{falseLabel}</span>
      </div>
    </BaseNode>
  );
}

export const ConditionalNode = memo(ConditionalNodeComponent);
