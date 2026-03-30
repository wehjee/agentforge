"use client";

import { memo } from "react";
import { type NodeProps } from "reactflow";
import { UserCheck } from "lucide-react";
import { BaseNode } from "./base-node";
import type { WorkflowNodeData } from "@shared/types";

function HumanNodeComponent(props: NodeProps<WorkflowNodeData>) {
  const message = (props.data.config?.message as string) || "";
  const buttons =
    (props.data.config?.approvalButtons as Array<{ label: string }>) || [];

  return (
    <BaseNode
      {...props}
      icon={<UserCheck className="h-3.5 w-3.5" />}
      subtitle="Human-in-the-Loop"
    >
      {message && (
        <p className="truncate text-[10px] text-slate-400">{message}</p>
      )}
      {buttons.length > 0 && (
        <div className="mt-1 flex items-center gap-1">
          {buttons.slice(0, 3).map((btn, i) => (
            <span
              key={i}
              className="rounded bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-600"
            >
              {btn.label}
            </span>
          ))}
        </div>
      )}
    </BaseNode>
  );
}

export const HumanNode = memo(HumanNodeComponent);
