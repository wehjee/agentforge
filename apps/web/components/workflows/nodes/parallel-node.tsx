"use client";

import { memo } from "react";
import { type NodeProps } from "reactflow";
import { Layers } from "lucide-react";
import { BaseNode } from "./base-node";
import { Badge } from "@/components/ui/badge";
import type { WorkflowNodeData } from "@shared/types";

function ParallelNodeComponent(props: NodeProps<WorkflowNodeData>) {
  const mergeStrategy = (props.data.config?.mergeStrategy as string) || "wait_all";

  return (
    <BaseNode
      {...props}
      icon={<Layers className="h-3.5 w-3.5" />}
      subtitle="Parallel"
    >
      <Badge
        variant="secondary"
        className="bg-cyan-50 text-[10px] font-normal text-cyan-600"
      >
        {mergeStrategy === "wait_first" ? "Wait first" : "Wait all"}
      </Badge>
    </BaseNode>
  );
}

export const ParallelNode = memo(ParallelNodeComponent);
