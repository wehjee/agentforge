"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GitBranch,
  ArrowRight,
  RotateCcw,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Agent, AgentVersion, AgentConfig } from "@shared/types";
import type { Environment } from "@shared/types/deployment";
import { EnvironmentBadge } from "./environment-badge";

export function VersionManager({ agent }: { agent: Agent }) {
  const { toast } = useToast();
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [diffVersions, setDiffVersions] = useState<{
    a: AgentVersion;
    b: AgentVersion;
  } | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await apiFetch<AgentVersion[]>(
        `/agents/${agent.id}/versions`
      );
      setVersions((res.data as unknown as AgentVersion[]) || []);
    } catch {
      toast({ variant: "destructive", title: "Failed to load versions" });
    } finally {
      setLoading(false);
    }
  }, [agent.id, toast]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handlePromote = async (
    from: Environment,
    to: Environment
  ) => {
    setPromoting(true);
    try {
      await apiFetch(`/agents/${agent.id}/promote`, {
        method: "POST",
        body: JSON.stringify({
          fromEnvironment: from,
          toEnvironment: to,
        }),
      });
      toast({
        title: `Promoted from ${from} to ${to}`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to promote",
      });
    } finally {
      setPromoting(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    try {
      await apiFetch(`/agents/${agent.id}/versions/${versionId}/restore`, {
        method: "POST",
      });
      toast({ title: "Version restored" });
      fetchVersions();
    } catch {
      toast({ variant: "destructive", title: "Failed to restore version" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Promotion Pipeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-[14px] font-semibold text-slate-900">
          Environment Promotion
        </h3>
        <p className="mt-1 text-[12px] text-slate-400">
          Promote agent versions across environments
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="flex flex-col items-center gap-2 rounded-lg border border-sage-100 bg-sage-50/50 px-6 py-3">
            <EnvironmentBadge env="DEV" />
            <span className="text-[12px] text-slate-500">
              v{agent.currentVersion}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePromote("DEV", "STAGING")}
            disabled={promoting}
            className="gap-1 text-[12px]"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-6 py-3">
            <EnvironmentBadge env="STAGING" />
            <span className="text-[12px] text-slate-500">--</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePromote("STAGING", "PROD")}
            disabled={promoting}
            className="gap-1 text-[12px]"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-sage-100 bg-sage-50/50 px-6 py-3">
            <EnvironmentBadge env="PROD" />
            <span className="text-[12px] text-slate-500">--</span>
          </div>
        </div>
      </div>

      {/* Version History */}
      <div className="space-y-3">
        <h3 className="text-[14px] font-semibold text-slate-900">
          Version History
        </h3>

        <div className="space-y-2">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <GitBranch className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-slate-900">
                      v{version.version}
                    </span>
                    {version.version === agent.currentVersion && (
                      <Badge className="bg-sage-50 text-[10px] text-sage-600 hover:bg-sage-50">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-400">
                    {version.changelog ||
                      `Version ${version.version}`}{" "}
                    &middot;{" "}
                    {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {index < versions.length - 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDiffVersions({
                        a: versions[index + 1],
                        b: version,
                      })
                    }
                    className="h-7 gap-1 text-[12px] text-slate-400"
                  >
                    <Eye className="h-3 w-3" />
                    Diff
                  </Button>
                )}
                {version.version !== agent.currentVersion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(version.id)}
                    className="h-7 gap-1 text-[12px] text-slate-400"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </Button>
                )}
              </div>
            </div>
          ))}

          {versions.length === 0 && (
            <div className="py-8 text-center">
              <GitBranch className="mx-auto h-8 w-8 text-slate-200" />
              <p className="mt-2 text-[13px] text-slate-400">
                No versions yet. Versions are created when you save changes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Diff Modal */}
      {diffVersions && (
        <DiffView
          versionA={diffVersions.a}
          versionB={diffVersions.b}
          onClose={() => setDiffVersions(null)}
        />
      )}
    </div>
  );
}

function DiffView({
  versionA,
  versionB,
  onClose,
}: {
  versionA: AgentVersion;
  versionB: AgentVersion;
  onClose: () => void;
}) {
  const configA = versionA.config as AgentConfig;
  const configB = versionB.config as AgentConfig;

  const diffs = computeDiffs(configA, configB);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">
              Version Diff
            </h3>
            <p className="text-[12px] text-slate-400">
              v{versionA.version} → v{versionB.version}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {diffs.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-slate-400">
              No differences found between these versions
            </p>
          ) : (
            <div className="space-y-3">
              {diffs.map((diff, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="text-[12px] font-medium text-slate-500">
                    {diff.field}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-red-50 p-2">
                      <div className="mb-1 text-[10px] font-medium text-red-400">
                        v{versionA.version}
                      </div>
                      <pre className="whitespace-pre-wrap text-[11px] text-red-700">
                        {formatValue(diff.oldValue)}
                      </pre>
                    </div>
                    <div className="rounded-md bg-sage-50 p-2">
                      <div className="mb-1 text-[10px] font-medium text-sage-400">
                        v{versionB.version}
                      </div>
                      <pre className="whitespace-pre-wrap text-[11px] text-sage-600">
                        {formatValue(diff.newValue)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-5 py-3">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DiffEntry {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

function computeDiffs(
  configA: AgentConfig,
  configB: AgentConfig
): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  const fieldsToCompare: (keyof AgentConfig)[] = [
    "model",
    "temperature",
    "maxTokens",
    "topP",
    "systemPrompt",
  ];

  for (const field of fieldsToCompare) {
    const oldVal = configA[field];
    const newVal = configB[field];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({ field, oldValue: oldVal, newValue: newVal });
    }
  }

  // Compare guardrails
  if (
    JSON.stringify(configA.guardrails) !== JSON.stringify(configB.guardrails)
  ) {
    diffs.push({
      field: "guardrails",
      oldValue: configA.guardrails,
      newValue: configB.guardrails,
    });
  }

  // Compare tools
  const toolsA = (configA.tools || []).map((t) => t.id).sort();
  const toolsB = (configB.tools || []).map((t) => t.id).sort();
  if (JSON.stringify(toolsA) !== JSON.stringify(toolsB)) {
    diffs.push({
      field: "tools",
      oldValue: configA.tools?.map((t) => t.name) || [],
      newValue: configB.tools?.map((t) => t.name) || [],
    });
  }

  return diffs;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "(empty)";
  if (typeof value === "string") return value || "(empty)";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}
