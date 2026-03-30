"use client";

import { memo } from "react";
import { type NodeProps } from "reactflow";
import { Zap } from "lucide-react";
import { BaseNode } from "./base-node";
import { Badge } from "@/components/ui/badge";
import type { WorkflowNodeData } from "@shared/types";

function TriggerNodeComponent(props: NodeProps<WorkflowNodeData>) {
  const triggerType = (props.data.config?.triggerType as string) || "manual";

  const triggerLabels: Record<string, string> = {
    webhook: "Webhook",
    schedule: "Schedule",
    manual: "Manual",
    event: "Event",
  };

  return (
    <BaseNode
      {...props}
      icon={<Zap className="h-3.5 w-3.5" />}
      subtitle="Trigger"
      hasInput={false}
    >
      <Badge
        variant="secondary"
        className="bg-violet-50 text-[10px] font-normal text-violet-600"
      >
        {triggerLabels[triggerType] || triggerType}
      </Badge>
      {triggerType === "schedule" && props.data.config?.cron ? (
        <p className="mt-1 text-[10px] font-mono text-slate-400">
          {String(props.data.config.cron)}
        </p>
      ) : null}
    </BaseNode>
  );
}

export const TriggerNode = memo(TriggerNodeComponent);
