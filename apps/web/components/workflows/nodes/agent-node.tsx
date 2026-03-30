"use client";

import { memo } from "react";
import { type NodeProps } from "reactflow";
import { Bot } from "lucide-react";
import { BaseNode } from "./base-node";
import { Badge } from "@/components/ui/badge";
import type { WorkflowNodeData } from "@shared/types";

function AgentNodeComponent(props: NodeProps<WorkflowNodeData>) {
  const agentName = (props.data.config?.agentName as string) || "Not configured";
  const retryCount = (props.data.config?.retryCount as number) || 0;

  return (
    <BaseNode
      {...props}
      icon={<Bot className="h-3.5 w-3.5" />}
      subtitle="Agent"
    >
      <div className="flex items-center gap-1.5">
        <Badge
          variant="secondary"
          className="bg-sage-50 text-[10px] font-normal text-sage-600"
        >
          {agentName}
        </Badge>
        {retryCount > 0 && (
          <Badge
            variant="secondary"
            className="bg-slate-50 text-[10px] font-normal text-slate-500"
          >
            {retryCount}x retry
          </Badge>
        )}
      </div>
    </BaseNode>
  );
}

export const AgentNode = memo(AgentNodeComponent);
