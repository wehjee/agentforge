"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Users,
  Settings,
  GitBranch,
  BookOpen,
  Wrench,
  Key,
  Filter,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMockAuditLog,
  AUDIT_ACTION_LABELS,
  type AuditLogEntry,
  type AuditAction,
} from "@/lib/audit-data";

const ENTITY_ICONS: Record<string, React.ElementType> = {
  agent: Bot,
  member: Users,
  settings: Settings,
  workflow: GitBranch,
  knowledge: BookOpen,
  tool: Wrench,
  secret: Key,
};

const ACTION_BADGE_STYLES: Record<string, string> = {
  created: "bg-sage-50 text-sage-600 border-sage-100",
  updated: "bg-sage-50 text-sage-600 border-sage-100",
  deployed: "bg-violet-50 text-violet-700 border-violet-200",
  deleted: "bg-red-50 text-red-700 border-red-200",
  invited: "bg-sky-50 text-sky-700 border-sky-200",
  removed: "bg-red-50 text-red-700 border-red-200",
  role_changed: "bg-amber-50 text-amber-700 border-amber-200",
  changed: "bg-sage-50 text-sage-600 border-sage-100",
};

function getActionVerb(action: AuditAction): string {
  return action.split(".")[1];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTimestamp(iso: string): { date: string; time: string; relative: string } {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  let relative = "";
  if (diffHours < 1) {
    relative = `${Math.floor(diffMs / (1000 * 60))}m ago`;
  } else if (diffHours < 24) {
    relative = `${Math.floor(diffHours)}h ago`;
  } else {
    relative = `${Math.floor(diffHours / 24)}d ago`;
  }

  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
    relative,
  };
}

function AuditEntry({ entry }: { entry: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ENTITY_ICONS[entry.entityType] || Settings;
  const verb = getActionVerb(entry.action);
  const ts = formatTimestamp(entry.createdAt);

  return (
    <div className="group flex gap-4 py-3 first:pt-0">
      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
          <Icon className="h-3.5 w-3.5 text-slate-500" />
        </div>
        <div className="mt-2 flex-1 w-px bg-slate-100" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-slate-100 text-[9px] font-medium text-slate-500">
              {getInitials(entry.userName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[13px] font-medium text-slate-900">
            {entry.userName}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] ${ACTION_BADGE_STYLES[verb] || "bg-slate-50 text-slate-600 border-slate-200"}`}
          >
            {verb}
          </Badge>
          <span className="text-[13px] text-slate-500">
            {AUDIT_ACTION_LABELS[entry.action]?.replace(/^\w+\s/, "")}
          </span>
          <span className="text-[13px] font-medium text-slate-700">
            {entry.entityName}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-[12px] text-slate-400" title={ts.date + " " + ts.time}>
            {ts.relative}
          </span>
          <span className="text-[12px] text-slate-300">
            {ts.date} {ts.time}
          </span>
          {entry.metadata && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-0.5 text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Details
            </button>
          )}
        </div>
        {expanded && entry.metadata && (
          <pre className="mt-2 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600 overflow-x-auto">
            {JSON.stringify(entry.metadata, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setEntries(getMockAuditLog());
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const users = useMemo(
    () =>
      Array.from(new Set(entries.map((e) => e.userName))).sort(),
    [entries]
  );

  const entityTypes = useMemo(
    () =>
      Array.from(new Set(entries.map((e) => e.entityType))).sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (typeFilter !== "all" && e.entityType !== typeFilter) return false;
      if (userFilter !== "all" && e.userName !== userFilter) return false;
      return true;
    });
  }, [entries, typeFilter, userFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/settings"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
        <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
          Audit Log
        </h1>
        <p className="mt-1 text-[14px] text-slate-500">
          A chronological record of all workspace events.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] text-[13px]">
            <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {entityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[180px] text-[13px]">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user} value={user}>
                {user}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-[13px] text-slate-400">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      <Card className="rounded-xl border-slate-100 shadow-card">
        <CardContent className="p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <Settings className="h-10 w-10 text-slate-200" />
              <p className="mt-3 text-[14px] text-slate-400">
                No events match your filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((entry) => (
                <AuditEntry key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
