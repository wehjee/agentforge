"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

interface RunListResponse {
  data: (WorkflowRun & { _count?: { steps: number } })[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function WorkflowRunsPage() {
  const params = useParams();
  const workflowId = params.id as string;
  const [runs, setRuns] = useState<(WorkflowRun & { _count?: { steps: number } })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<RunListResponse>(`/workflows/${workflowId}/runs`);
      const body = res as unknown as { success: boolean } & RunListResponse;
      setRuns(body.data || []);
    } catch {
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const handleTriggerRun = useCallback(async () => {
    try {
      await apiFetch(`/workflows/${workflowId}/run`, {
        method: "POST",
        body: JSON.stringify({ triggerType: "manual" }),
      });
      fetchRuns();
    } catch (err) {
      console.error("Failed to trigger run:", err);
    }
  }, [workflowId, fetchRuns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/workflows/${workflowId}`}
            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
              Run History
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              View execution history and trace details.
            </p>
          </div>
        </div>
        <Button onClick={handleTriggerRun}>
          <Play className="mr-2 h-4 w-4" />
          Trigger Run
        </Button>
      </div>

      {/* Run list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <Play className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mt-4 text-[15px] font-medium text-slate-900">
            No runs yet
          </h3>
          <p className="mt-1 text-[13px] text-slate-500">
            Trigger your first workflow run to see results here.
          </p>
          <Button className="mt-5" onClick={handleTriggerRun}>
            <Play className="mr-2 h-4 w-4" />
            Trigger Run
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => {
            const statusConfig = STATUS_CONFIG[run.status] || STATUS_CONFIG.QUEUED;
            const StatusIcon = statusConfig.icon;

            return (
              <Link key={run.id} href={`/workflows/${workflowId}/runs/${run.id}`}>
                <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:bg-slate-50">
                  <StatusIcon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      statusConfig.color,
                      run.status === "RUNNING" && "animate-spin"
                    )}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-900">
                        Run {run.id.slice(-8)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px] font-normal", statusConfig.bg, statusConfig.color)}
                      >
                        {statusConfig.label}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-slate-50 text-[10px] font-normal text-slate-500"
                      >
                        {run.triggerType}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[12px] text-slate-400">
                      Started {new Date(run.startedAt).toLocaleString()}
                      {run.completedAt &&
                        ` \u00b7 Completed ${new Date(run.completedAt).toLocaleString()}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[12px] text-slate-400">
                    {run._count?.steps != null && (
                      <span>{run._count.steps} steps</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
