"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, GitBranch, MoreHorizontal, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { STATUS_BADGE_STYLES } from "@/lib/constants";
import type { Workflow } from "@shared/types";

interface WorkflowListResponse {
  data: Workflow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function WorkflowListView() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (search) params.search = search;

      const res = await apiFetch<WorkflowListResponse>("/workflows", { params });
      const body = res as unknown as { success: boolean } & WorkflowListResponse;
      setWorkflows(body.data || []);
    } catch {
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await apiFetch(`/workflows/${id}?permanent=true`, { method: "DELETE" });
        fetchWorkflows();
      } catch (err) {
        console.error("Failed to delete workflow:", err);
      }
    },
    [fetchWorkflows]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
            Workflows
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Build multi-agent orchestration workflows.
          </p>
        </div>
        <Button asChild>
          <Link href="/workflows/new">
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-[13px]"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <WorkflowEmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkflowCard({
  workflow,
  onDelete,
}: {
  workflow: Workflow;
  onDelete: (id: string) => void;
}) {
  const canvas = workflow.canvas as { nodes?: unknown[] } | null;
  const nodeCount = canvas?.nodes?.length ?? 0;
  const runCount = workflow._count?.runs ?? 0;

  return (
    <Card className="group rounded-xl border-slate-100 shadow-card transition-all duration-200 hover:shadow-card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <Link href={`/workflows/${workflow.id}`} className="flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-slate-200/70">
              <GitBranch className="h-5 w-5 text-slate-500" />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={STATUS_BADGE_STYLES[workflow.status] || STATUS_BADGE_STYLES.DRAFT}
            >
              {workflow.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded p-1 text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/workflows/${workflow.id}/runs`}>
                    <Play className="mr-2 h-3.5 w-3.5" />
                    View Runs
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDelete(workflow.id)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Link href={`/workflows/${workflow.id}`}>
          <div className="mt-4">
            <h3 className="text-[14px] font-medium text-slate-900">
              {workflow.name}
            </h3>
            {workflow.description && (
              <p className="mt-1 text-[13px] leading-relaxed text-slate-400 line-clamp-2">
                {workflow.description}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-slate-50 text-[11px] font-normal text-slate-500"
            >
              {nodeCount} nodes
            </Badge>
            <Badge
              variant="secondary"
              className="bg-slate-50 text-[11px] font-normal text-slate-500"
            >
              {runCount} runs
            </Badge>
          </div>

          <p className="mt-4 text-[12px] text-slate-300">
            {new Date(workflow.updatedAt).toLocaleDateString()}
          </p>
        </Link>
      </CardContent>
    </Card>
  );
}

function WorkflowEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
        <GitBranch className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="mt-4 text-[15px] font-medium text-slate-900">
        No workflows yet
      </h3>
      <p className="mt-1 text-[13px] text-slate-500">
        Create your first multi-agent workflow to get started.
      </p>
      <Button asChild className="mt-5">
        <Link href="/workflows/new">
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Link>
      </Button>
    </div>
  );
}
