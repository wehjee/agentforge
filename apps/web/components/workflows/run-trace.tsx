"use client";

import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Pause,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { WorkflowStep, RunStatus } from "@shared/types";

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  COMPLETED: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Completed",
  },
  FAILED: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Failed",
  },
  RUNNING: {
    icon: Loader2,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    label: "Running",
  },
  QUEUED: {
    icon: Clock,
    color: "text-slate-400",
    bg: "bg-slate-50",
    label: "Queued",
  },
  PAUSED: {
    icon: Pause,
    color: "text-sage-600",
    bg: "bg-sage-50",
    label: "Paused",
  },
};

const NODE_TYPE_COLORS: Record<string, string> = {
  trigger: "bg-violet-50 text-violet-600",
  agent: "bg-sage-50 text-sage-600",
  router: "bg-amber-50 text-amber-600",
  conditional: "bg-orange-50 text-orange-600",
  parallel: "bg-cyan-50 text-cyan-600",
  human: "bg-green-50 text-green-600",
  transform: "bg-indigo-50 text-indigo-600",
  output: "bg-rose-50 text-rose-600",
};

interface RunTraceProps {
  steps: WorkflowStep[];
}

export function RunTrace({ steps }: RunTraceProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <StepItem key={step.id} step={step} index={index} />
      ))}

      {steps.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-[14px] text-slate-500">No steps recorded yet.</p>
        </div>
      )}
    </div>
  );
}

function StepItem({ step, index }: { step: WorkflowStep; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[step.status] || STATUS_CONFIG.QUEUED;
  const StatusIcon = statusConfig.icon;
  const nodeColor = NODE_TYPE_COLORS[step.nodeType] || "bg-slate-50 text-slate-600";

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-500">
          {index + 1}
        </span>

        <StatusIcon
          className={cn(
            "h-4 w-4 shrink-0",
            statusConfig.color,
            step.status === "RUNNING" && "animate-spin"
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-medium text-slate-900">
              {step.nodeName}
            </span>
            <Badge variant="secondary" className={cn("text-[10px] font-normal", nodeColor)}>
              {step.nodeType}
            </Badge>
          </div>
        </div>

        {step.duration_ms != null && (
          <span className="shrink-0 text-[12px] text-slate-400">
            {step.duration_ms}ms
          </span>
        )}

        <Badge
          variant="secondary"
          className={cn("shrink-0 text-[10px] font-normal", statusConfig.bg, statusConfig.color)}
        >
          {statusConfig.label}
        </Badge>

        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {step.input != null && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Input
              </p>
              <pre className="rounded-md bg-slate-50 p-2 text-[11px] font-mono text-slate-700 overflow-x-auto max-h-40">
                {JSON.stringify(step.input, null, 2)}
              </pre>
            </div>
          )}

          {step.output != null && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Output
              </p>
              <pre className="rounded-md bg-slate-50 p-2 text-[11px] font-mono text-slate-700 overflow-x-auto max-h-40">
                {JSON.stringify(step.output, null, 2)}
              </pre>
            </div>
          )}

          {step.error != null && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-400 mb-1">
                Error
              </p>
              <pre className="rounded-md bg-red-50 p-2 text-[11px] font-mono text-red-700">
                {step.error}
              </pre>
            </div>
          )}

          {step.tokenUsage && (
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span>
                Tokens: {(step.tokenUsage as { input: number }).input} in /{" "}
                {(step.tokenUsage as { output: number }).output} out
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Started: {new Date(step.startedAt).toLocaleTimeString()}</span>
            {step.completedAt && (
              <span>
                Completed: {new Date(step.completedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
