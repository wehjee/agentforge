"use client";

import { useCallback } from "react";
import {
  Zap,
  Bot,
  GitFork,
  GitBranch,
  Layers,
  UserCheck,
  Code2,
  ArrowRightCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeType } from "@shared/types";

interface PaletteItem {
  type: NodeType;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: "trigger",
    label: "Trigger",
    icon: Zap,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    type: "agent",
    label: "Agent",
    icon: Bot,
    color: "text-sage-600",
    bgColor: "bg-sage-50",
  },
  {
    type: "router",
    label: "Router",
    icon: GitFork,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    type: "conditional",
    label: "Conditional",
    icon: GitBranch,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    type: "parallel",
    label: "Parallel",
    icon: Layers,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  {
    type: "human",
    label: "Human",
    icon: UserCheck,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    type: "transform",
    label: "Transform",
    icon: Code2,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    type: "output",
    label: "Output",
    icon: ArrowRightCircle,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
];

export function NodePalette() {
  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: NodeType, label: string) => {
      event.dataTransfer.setData("application/reactflow-type", nodeType);
      event.dataTransfer.setData("application/reactflow-label", label);
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  return (
    <div className="flex w-[180px] flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Nodes
        </p>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {PALETTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item.type, item.label)}
              className={cn(
                "flex cursor-grab items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                "hover:bg-slate-50 active:cursor-grabbing active:bg-slate-100"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  item.bgColor,
                  item.color
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-[13px] font-medium text-slate-700">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
