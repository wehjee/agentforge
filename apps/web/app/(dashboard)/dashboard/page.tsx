"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Users, FileText, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { AGENT_STATUS_LABELS } from "@shared/types";
import type { Agent } from "@shared/types";
import { STATUS_BADGE_STYLES } from "@/lib/constants";

interface DashboardData {
  totalAgents: number;
  activeAgents: number;
  draftAgents: number;
  members: number;
  recentAgents: Agent[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const agentsRes = await apiFetch<{
          data: Agent[];
          pagination: { total: number };
        }>("/agents", { params: { limit: 5 } });
        const body = agentsRes as unknown as {
          success: boolean;
          data: Agent[];
          pagination: { total: number };
        };

        const agents = body.data || [];
        const total = body.pagination?.total || agents.length;
        const active = agents.filter((a) => a.status === "ACTIVE").length;
        const draft = agents.filter((a) => a.status === "DRAFT").length;

        setData({
          totalAgents: total,
          activeAgents: active,
          draftAgents: draft,
          members: 1,
          recentAgents: agents.slice(0, 3),
        });
      } catch {
        setData({
          totalAgents: 0,
          activeAgents: 0,
          draftAgents: 0,
          members: 0,
          recentAgents: [],
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Agents",
      value: data?.totalAgents ?? 0,
      icon: Bot,
      color: "text-slate-900",
    },
    {
      label: "Active",
      value: data?.activeAgents ?? 0,
      icon: Bot,
      color: "text-sage-600",
    },
    {
      label: "Drafts",
      value: data?.draftAgents ?? 0,
      icon: FileText,
      color: "text-slate-500",
    },
    {
      label: "Members",
      value: data?.members ?? 0,
      icon: Users,
      color: "text-sage-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Here is what is happening with your agents.
          </p>
        </div>
        <Button asChild>
          <Link href="/agents/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="rounded-xl border-slate-100 shadow-card transition-shadow duration-fast hover:shadow-card-hover"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-500">
                    {stat.label}
                  </span>
                  <Icon className="h-4 w-4 text-slate-300" />
                </div>
                <p
                  className={`mt-2 text-[36px] font-bold leading-none tracking-tight ${stat.color}`}
                >
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Agents */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-slate-900">
            Recent Agents
          </h2>
          <Link
            href="/agents"
            className="flex items-center gap-1 text-[13px] text-slate-400 transition-colors hover:text-slate-600"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {data?.recentAgents.length === 0 ? (
          <Card className="rounded-xl border-dashed border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-10 w-10 text-slate-200" />
              <p className="mt-3 text-[14px] text-slate-400">
                No agents created yet
              </p>
              <Button asChild variant="outline" className="mt-4" size="sm">
                <Link href="/agents/new">Create your first agent</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {data?.recentAgents.map((agent) => (
              <Link key={agent.id} href={`/agents/${agent.id}`}>
                <Card className="rounded-xl border-slate-100 shadow-card transition-all duration-fast hover:shadow-card-hover">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                      <Bot className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-slate-900">
                        {agent.name}
                      </p>
                      {agent.description && (
                        <p className="mt-0.5 text-[13px] text-slate-400 line-clamp-1">
                          {agent.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={STATUS_BADGE_STYLES[agent.status]}
                    >
                      {AGENT_STATUS_LABELS[agent.status] || agent.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
