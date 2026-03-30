"use client";

import { memo } from "react";
import { type NodeProps } from "reactflow";
import { ArrowRightCircle } from "lucide-react";
import { BaseNode } from "./base-node";
import { Badge } from "@/components/ui/badge";
import type { WorkflowNodeData } from "@shared/types";

function OutputNodeComponent(props: NodeProps<WorkflowNodeData>) {
  const outputType = (props.data.config?.outputType as string) || "return";

  const outputLabels: Record<string, string> = {
    return: "Return",
    email: "Email",
    webhook: "Webhook",
    store: "Store",
  };

  return (
    <BaseNode
      {...props}
      icon={<ArrowRightCircle className="h-3.5 w-3.5" />}
      subtitle="Output"
      hasOutput={false}
    >
      <Badge
        variant="secondary"
        className="bg-rose-50 text-[10px] font-normal text-rose-600"
      >
        {outputLabels[outputType] || outputType}
      </Badge>
    </BaseNode>
  );
}

export const OutputNode = memo(OutputNodeComponent);
