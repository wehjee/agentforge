"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  GitBranch,
  RotateCcw,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { useAgent } from "@/lib/hooks/use-agent";
import type { AgentVersion, AgentConfig } from "@shared/types";
import { cn } from "@/lib/utils";

export default function AgentVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { agent, loading: agentLoading } = useAgent(id);

  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<AgentVersion | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AgentVersion[]>(`/agents/${id}/versions`);
      setVersions((res.data as unknown as AgentVersion[]) || []);
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to load versions",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  async function handleRestore(versionId: string) {
    setRestoring(versionId);
    try {
      await apiFetch(`/agents/${id}/versions/${versionId}/restore`, {
        method: "POST",
      });
      toast({ title: "Version restored" });
      fetchVersions();
    } catch {
      toast({ variant: "destructive", title: "Failed to restore version" });
    } finally {
      setRestoring(null);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (agentLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.push(`/agents/${id}`)}
          className="mb-4 flex items-center gap-1 text-[13px] text-slate-400 transition-colors hover:text-slate-600"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {agent?.name || "Agent"}
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <GitBranch className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <h1 className="font-display text-[22px] font-medium tracking-[-0.01em] text-slate-900">
              Version History
            </h1>
            <p className="text-[13px] text-slate-500">
              {agent?.name} — {versions.length} version
              {versions.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute bottom-0 left-6 top-0 w-px bg-slate-200" />

        <div className="space-y-4">
          {versions.map((version, index) => {
            const isCurrent = agent && version.version === agent.currentVersion;

            return (
              <div key={version.id} className="relative flex gap-4 pl-12">
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute left-[18px] top-4 h-4 w-4 rounded-full border-2",
                    isCurrent
                      ? "border-sage-500 bg-sage-500"
                      : "border-slate-300 bg-white"
                  )}
                />

                {/* Version card */}
                <div
                  className={cn(
                    "flex-1 rounded-xl border p-4 transition-all",
                    isCurrent
                      ? "border-sage-100 bg-sage-50/50"
                      : "border-slate-150 bg-white hover:shadow-card"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-slate-900">
                        Version {version.version}
                      </span>
                      {isCurrent && (
                        <Badge className="bg-sage-50 text-[10px] text-sage-600 border-0">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-[11px] text-slate-400"
                        onClick={() =>
                          setPreviewVersion(
                            previewVersion?.id === version.id ? null : version
                          )
                        }
                      >
                        <Eye className="h-3 w-3" />
                        {previewVersion?.id === version.id ? "Hide" : "View"}
                      </Button>
                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-[11px]"
                          onClick={() => handleRestore(version.id)}
                          disabled={restoring === version.id}
                        >
                          <RotateCcw className="h-3 w-3" />
                          {restoring === version.id
                            ? "Restoring..."
                            : "Restore"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(version.createdAt)}
                    </span>
                    {version.changelog && (
                      <span className="text-slate-500">
                        {version.changelog}
                      </span>
                    )}
                  </div>

                  {/* Config preview */}
                  {previewVersion?.id === version.id && (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-slate-600">
                          Configuration Snapshot
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewVersion(null)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-md bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-300 font-mono">
                        {JSON.stringify(version.config, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
