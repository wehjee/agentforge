"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Pause,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RunTrace } from "@/components/workflows/run-trace";
import { RunTimeline } from "@/components/workflows/run-timeline";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { WorkflowRun } from "@shared/types";

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  COMPLETED: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Completed" },
  FAILED: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Failed" },
  RUNNING: { icon: Loader2, color: "text-yellow-600", bg: "bg-yellow-50", label: "Running" },
  QUEUED: { icon: Clock, color: "text-slate-400", bg: "bg-slate-50", label: "Queued" },
  PAUSED: { icon: Pause, color: "text-sage-600", bg: "bg-sage-50", label: "Paused" },
};

export default function RunDetailPage() {
  const params = useParams();
  const workflowId = params.id as string;
  const runId = params.runId as string;
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<WorkflowRun>(
          `/workflows/${workflowId}/runs/${runId}`
        );
        const data = (res as unknown as { data: WorkflowRun }).data;
        setRun(data);
      } catch (err) {
        console.error("Failed to load run:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [workflowId, runId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="py-16 text-center">
        <p className="text-[14px] text-slate-500">Run not found.</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[run.status] || STATUS_CONFIG.QUEUED;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Link
            href={`/workflows/${workflowId}/runs`}
            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
              Run {run.id.slice(-8)}
            </h1>
            <Badge
              variant="secondary"
              className={cn("text-[11px]", statusConfig.bg, statusConfig.color)}
            >
              <StatusIcon
                className={cn(
                  "mr-1 h-3 w-3",
                  run.status === "RUNNING" && "animate-spin"
                )}
              />
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <div className="ml-10 mt-1 flex items-center gap-4 text-[13px] text-slate-500">
          <span>Trigger: {run.triggerType}</span>
          <span>Started: {new Date(run.startedAt).toLocaleString()}</span>
          {run.completedAt && (
            <span>
              Completed: {new Date(run.completedAt).toLocaleString()}
            </span>
          )}
          {run.steps && <span>{run.steps.length} steps</span>}
        </div>
      </div>

      {/* Error banner */}
      {run.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-[13px] font-medium text-red-700">Error</p>
          <p className="mt-1 text-[12px] text-red-600">{run.error}</p>
        </div>
      )}

      {/* Tabs: Trace vs Timeline */}
      <Tabs defaultValue="trace" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="trace" className="text-[13px]">
            Step Trace
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-[13px]">
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trace">
          <RunTrace steps={run.steps || []} />
        </TabsContent>

        <TabsContent value="timeline">
          <RunTimeline steps={run.steps || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
