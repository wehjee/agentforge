"use client";

import { memo } from "react";
import { type NodeProps } from "reactflow";
import { Code2 } from "lucide-react";
import { BaseNode } from "./base-node";
import type { WorkflowNodeData } from "@shared/types";

function TransformNodeComponent(props: NodeProps<WorkflowNodeData>) {
  const code = (props.data.config?.code as string) || "";
  const description = (props.data.config?.description as string) || "";

  return (
    <BaseNode
      {...props}
      icon={<Code2 className="h-3.5 w-3.5" />}
      subtitle="Transform"
    >
      {description ? (
        <p className="truncate text-[10px] text-slate-400">{description}</p>
      ) : code ? (
        <p className="truncate text-[10px] font-mono text-slate-400">
          {code.slice(0, 40)}
          {code.length > 40 ? "..." : ""}
        </p>
      ) : (
        <p className="text-[10px] text-slate-300">No code configured</p>
      )}
    </BaseNode>
  );
}

export const TransformNode = memo(TransformNodeComponent);
