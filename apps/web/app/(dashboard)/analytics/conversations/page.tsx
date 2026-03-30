"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMockConversations, type ConversationLog } from "@/lib/analytics-data";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-sage-50 text-sage-600 border-sage-100",
  completed: "bg-sage-50 text-sage-600 border-sage-100",
  escalated: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

const CHANNEL_STYLES: Record<string, string> = {
  widget: "bg-violet-50 text-violet-700 border-violet-200",
  api: "bg-slate-100 text-slate-700 border-slate-200",
  slack: "bg-sky-50 text-sky-700 border-sky-200",
  web: "bg-sage-50 text-sage-600 border-sage-100",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return `${mins}m ago`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PAGE_SIZE = 10;

export default function ConversationLogsPage() {
  const [conversations, setConversations] = useState<ConversationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConversations(getMockConversations(40));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (channelFilter !== "all" && c.channel !== channelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.agentName.toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [conversations, statusFilter, channelFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/analytics"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Analytics
        </Link>
        <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
          Conversation Logs
        </h1>
        <p className="mt-1 text-[14px] text-slate-500">
          Browse and search all conversations across your agents.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search conversations..."
            className="pl-9 text-[13px]"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] text-[13px]">
            <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={channelFilter}
          onValueChange={(v) => {
            setChannelFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] text-[13px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="widget">Widget</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="slack">Slack</SelectItem>
            <SelectItem value="web">Web</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[13px] text-slate-400">
          {filtered.length} conversation{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <Card className="rounded-xl border-dashed border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-10 w-10 text-slate-200" />
            <p className="mt-3 text-[14px] text-slate-400">
              No conversations match your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {paginated.map((conv) => (
            <Link
              key={conv.id}
              href={`/analytics/conversations/${conv.id}`}
            >
              <Card className="rounded-xl border-slate-100 shadow-card transition-all duration-200 hover:shadow-card-hover">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <MessageSquare className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-slate-900 truncate">
                        {conv.agentName}
                      </span>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-[10px] ${CHANNEL_STYLES[conv.channel] || ""}`}
                      >
                        {conv.channel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-[10px] ${STATUS_STYLES[conv.status] || ""}`}
                      >
                        {conv.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[13px] text-slate-400 truncate">
                      {conv.preview}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-[12px] text-slate-400">
                      {conv.messageCount} msgs
                    </p>
                    <p className="mt-0.5 text-[12px] text-slate-300">
                      {conv.duration}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[12px] text-slate-400">
                      {formatDate(conv.createdAt)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-300">
                      {conv.id}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[13px] text-slate-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
