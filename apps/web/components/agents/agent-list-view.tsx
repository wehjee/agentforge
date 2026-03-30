"use client";

import Link from "next/link";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentCard } from "./agent-card";
import { AgentTable } from "./agent-table";
import { AgentEmptyState } from "./agent-empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgents } from "@/lib/hooks/use-agents";
import { useAgentStore } from "@/stores/agent-store";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@shared/types";

export function AgentListView() {
  const { agents, loading } = useAgents();
  const { viewMode, search, statusFilter, setViewMode, setSearch, setStatusFilter } =
    useAgentStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
            Agents
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Create and manage your AI agents.
          </p>
        </div>
        <Button asChild>
          <Link href="/agents/new">
            <Plus className="mr-2 h-4 w-4" />
            New Agent
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-[13px]"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as AgentStatus | "ALL")}
        >
          <SelectTrigger className="h-9 w-[130px] text-[13px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "grid"
                ? "bg-slate-50 text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "list"
                ? "bg-slate-50 text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <AgentEmptyState />
      ) : viewMode === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <AgentTable agents={agents} />
      )}
    </div>
  );
}
