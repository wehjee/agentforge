"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { WorkflowStep } from "@shared/types";

const NODE_TYPE_COLORS: Record<string, string> = {
  trigger: "bg-violet-400",
  agent: "bg-sage-400",
  router: "bg-amber-400",
  conditional: "bg-orange-400",
  parallel: "bg-cyan-400",
  human: "bg-green-400",
  transform: "bg-indigo-400",
  output: "bg-rose-400",
};

const STATUS_OPACITY: Record<string, string> = {
  COMPLETED: "opacity-100",
  RUNNING: "opacity-80 animate-pulse",
  FAILED: "opacity-60",
  QUEUED: "opacity-30",
  PAUSED: "opacity-50",
};

interface RunTimelineProps {
  steps: WorkflowStep[];
}

export function RunTimeline({ steps }: RunTimelineProps) {
  const { timelineData, totalDuration } = useMemo(() => {
    if (steps.length === 0) return { timelineData: [], totalDuration: 0 };

    const earliest = Math.min(
      ...steps.map((s) => new Date(s.startedAt).getTime())
    );
    const latest = Math.max(
      ...steps.map((s) =>
        s.completedAt
          ? new Date(s.completedAt).getTime()
          : new Date(s.startedAt).getTime() + (s.duration_ms || 0)
      )
    );
    const total = Math.max(latest - earliest, 1);

    const data = steps.map((step) => {
      const start = new Date(step.startedAt).getTime() - earliest;
      const duration = step.duration_ms || (step.completedAt
        ? new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()
        : 0);

      return {
        ...step,
        startOffset: (start / total) * 100,
        widthPercent: Math.max((duration / total) * 100, 2), // min 2% width for visibility
        durationMs: duration,
      };
    });

    return { timelineData: data, totalDuration: total };
  }, [steps]);

  if (steps.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-[14px] text-slate-500">No steps to display.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="text-[12px] font-semibold text-slate-500">
          Timeline
        </p>
        <p className="text-[11px] text-slate-400">
          Total: {(totalDuration / 1000).toFixed(2)}s
        </p>
      </div>

      {/* Gantt rows */}
      <div className="divide-y divide-slate-50">
        {timelineData.map((step) => {
          const barColor = NODE_TYPE_COLORS[step.nodeType] || "bg-slate-400";
          const opacity = STATUS_OPACITY[step.status] || "opacity-100";

          return (
            <div key={step.id} className="flex items-center gap-3 px-4 py-2">
              {/* Label */}
              <div className="w-32 shrink-0">
                <p className="truncate text-[12px] font-medium text-slate-700">
                  {step.nodeName}
                </p>
                <p className="text-[10px] text-slate-400">{step.nodeType}</p>
              </div>

              {/* Bar */}
              <div className="relative h-6 flex-1 rounded bg-slate-50">
                <div
                  className={cn(
                    "absolute top-0.5 bottom-0.5 rounded",
                    barColor,
                    opacity
                  )}
                  style={{
                    left: `${step.startOffset}%`,
                    width: `${step.widthPercent}%`,
                  }}
                  title={`${step.nodeName}: ${step.durationMs}ms`}
                />
              </div>

              {/* Duration */}
              <span className="w-16 shrink-0 text-right text-[11px] text-slate-400">
                {step.durationMs}ms
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 border-t border-slate-100 px-4 py-2.5">
        {Object.entries(NODE_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn("h-2.5 w-2.5 rounded-sm", color)} />
            <span className="text-[10px] capitalize text-slate-500">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
