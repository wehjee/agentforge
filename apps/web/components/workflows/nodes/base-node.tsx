"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@shared/types";

const NODE_TYPE_COLORS: Record<string, string> = {
  trigger: "border-l-violet-500",
  agent: "border-l-sage-500",
  router: "border-l-amber-500",
  conditional: "border-l-orange-500",
  parallel: "border-l-cyan-500",
  human: "border-l-green-500",
  transform: "border-l-indigo-500",
  output: "border-l-rose-500",
};

const NODE_TYPE_ICON_BG: Record<string, string> = {
  trigger: "bg-violet-50 text-violet-600",
  agent: "bg-sage-50 text-sage-600",
  router: "bg-amber-50 text-amber-600",
  conditional: "bg-orange-50 text-orange-600",
  parallel: "bg-cyan-50 text-cyan-600",
  human: "bg-green-50 text-green-600",
  transform: "bg-indigo-50 text-indigo-600",
  output: "bg-rose-50 text-rose-600",
};

interface BaseNodeProps extends NodeProps<WorkflowNodeData> {
  icon: React.ReactNode;
  subtitle?: string;
  hasInput?: boolean;
  hasOutput?: boolean;
  extraHandles?: React.ReactNode;
  children?: React.ReactNode;
}

function BaseNodeComponent({
  data,
  selected,
  icon,
  subtitle,
  hasInput = true,
  hasOutput = true,
  extraHandles,
  children,
}: BaseNodeProps) {
  const colorClass = NODE_TYPE_COLORS[data.nodeType] || "border-l-slate-400";
  const iconBgClass = NODE_TYPE_ICON_BG[data.nodeType] || "bg-slate-50 text-slate-600";

  return (
    <div
      className={cn(
        "min-w-[200px] rounded-xl border border-slate-200 border-l-4 bg-white shadow-sm transition-shadow",
        colorClass,
        selected && "ring-2 ring-sage-500 shadow-md"
      )}
    >
      {hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-white !bg-slate-300"
        />
      )}

      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
              iconBgClass
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-slate-900">
              {data.label}
            </p>
            {subtitle && (
              <p className="truncate text-[11px] text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
        {children && <div className="mt-2">{children}</div>}
      </div>

      {hasOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-white !bg-slate-300"
        />
      )}

      {extraHandles}
    </div>
  );
}

export const BaseNode = memo(BaseNodeComponent);
export { NODE_TYPE_COLORS, NODE_TYPE_ICON_BG };
