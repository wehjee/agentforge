"use client";

import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/stores/builder-store";

interface ConfigPanelProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  badge?: string;
}

export function ConfigPanel({ id, title, icon, children, badge }: ConfigPanelProps) {
  const expandedPanel = useBuilderStore((s) => s.expandedPanel);
  const togglePanel = useBuilderStore((s) => s.togglePanel);
  const isOpen = expandedPanel === id;

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => togglePanel(id)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50/80"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </span>
        <span className="flex-1 text-[13px] font-semibold text-slate-900">
          {title}
        </span>
        {badge && (
          <span className="rounded-full bg-sage-50 px-2 py-0.5 text-[11px] font-medium text-sage-600">
            {badge}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
