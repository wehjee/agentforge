"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Zap,
  Coins,
  Timer,
  Wrench,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMockOverview,
  getMockTokenUsage,
  getMockPerformance,
  getMockToolUsage,
  type AnalyticsOverview,
  type TokenUsagePoint,
  type PerformancePoint,
  type ToolUsageStat,
} from "@/lib/analytics-data";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function TrendBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[12px] font-medium ${
        isPositive ? "text-sage-600" : "text-red-500"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {Math.abs(value)}%
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend: number;
  icon: React.ElementType;
}

function StatCard({ label, value, subValue, trend, icon: Icon }: StatCardProps) {
  return (
    <Card className="rounded-xl border-slate-100 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-slate-500">{label}</span>
          <Icon className="h-4 w-4 text-slate-300" />
        </div>
        <div className="mt-2 flex items-end gap-2">
          <p className="text-[28px] font-bold leading-none tracking-tight text-slate-900">
            {value}
          </p>
          {subValue && (
            <span className="mb-0.5 text-[13px] text-slate-400">{subValue}</span>
          )}
        </div>
        <div className="mt-2">
          <TrendBadge value={trend} />
          <span className="ml-1.5 text-[12px] text-slate-400">vs last 30d</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TokenChart({ data }: { data: TokenUsagePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="inputGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="outputGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickFormatter={(v: number) => formatNumber(v)}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e4e4e7",
            boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
          }}
          formatter={(value: number, name: string) => [
            formatNumber(value),
            name === "input" ? "Input tokens" : "Output tokens",
          ]}
          labelFormatter={(label: string) => {
            const d = new Date(label);
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }}
        />
        <Area
          type="monotone"
          dataKey="input"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#inputGradient)"
        />
        <Area
          type="monotone"
          dataKey="output"
          stroke="#8b5cf6"
          strokeWidth={2}
          fill="url(#outputGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CostChart({ data }: { data: TokenUsagePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e4e4e7",
            boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
          }}
          formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
          labelFormatter={(label: string) => {
            const d = new Date(label);
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }}
        />
        <Area
          type="monotone"
          dataKey="cost"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#costGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PerformanceChart({ data }: { data: PerformancePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickFormatter={(v: number) => `${v}ms`}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e4e4e7",
            boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
          }}
          formatter={(value: number, name: string) => [`${value}ms`, name.toUpperCase()]}
          labelFormatter={(label: string) => {
            const d = new Date(label);
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }}
        />
        <Line type="monotone" dataKey="p50" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ToolsChart({ data }: { data: ToolUsageStat[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e4e4e7",
            boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
          }}
          formatter={(value: number) => [formatNumber(value), "Calls"]}
        />
        <Bar dataKey="calls" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [tokenData, setTokenData] = useState<TokenUsagePoint[]>([]);
  const [perfData, setPerfData] = useState<PerformancePoint[]>([]);
  const [toolData, setToolData] = useState<ToolUsageStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setOverview(getMockOverview());
      setTokenData(getMockTokenUsage());
      setPerfData(getMockPerformance());
      setToolData(getMockToolUsage());
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const stats = overview!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
            Analytics
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Monitor performance, usage, and costs across all agents.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/analytics/conversations">
              View Logs
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/analytics#alerts">
              <Bell className="mr-1.5 h-3.5 w-3.5" />
              Alerts
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Conversations"
          value={formatNumber(stats.conversations.total)}
          subValue={`${stats.conversations.active} active`}
          trend={stats.conversations.trend}
          icon={MessageSquare}
        />
        <StatCard
          label="Messages"
          value={formatNumber(stats.messages.total)}
          subValue={`${stats.messages.avgPerConversation} avg/conv`}
          trend={stats.messages.trend}
          icon={Zap}
        />
        <StatCard
          label="Token Cost"
          value={`$${stats.tokens.cost.toFixed(2)}`}
          subValue={`${formatNumber(stats.tokens.input + stats.tokens.output)} tokens`}
          trend={stats.tokens.trend}
          icon={Coins}
        />
        <StatCard
          label="Avg Response (p50)"
          value={`${stats.performance.p50}ms`}
          subValue={`p95: ${stats.performance.p95}ms`}
          trend={stats.performance.trend}
          icon={Timer}
        />
        <StatCard
          label="Tool Calls"
          value={formatNumber(stats.tools.totalCalls)}
          subValue={`${stats.tools.successRate}% success`}
          trend={stats.tools.trend}
          icon={Wrench}
        />
        <StatCard
          label="Knowledge Hit Rate"
          value={`${stats.knowledge.hitRate}%`}
          subValue={`${stats.knowledge.avgRelevanceScore} avg score`}
          trend={stats.knowledge.trend}
          icon={BookOpen}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="tokens" className="space-y-4">
        <TabsList className="bg-slate-100/80">
          <TabsTrigger value="tokens" className="text-[13px]">
            Token Usage
          </TabsTrigger>
          <TabsTrigger value="cost" className="text-[13px]">
            Cost
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-[13px]">
            Response Time
          </TabsTrigger>
          <TabsTrigger value="tools" className="text-[13px]">
            Tool Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens">
          <Card className="rounded-xl border-slate-100 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-semibold text-slate-900">
                Token Usage — Last 30 Days
              </CardTitle>
              <div className="flex gap-4 pt-1">
                <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-sage-500" />
                  Input
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  Output
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <TokenChart data={tokenData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost">
          <Card className="rounded-xl border-slate-100 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-semibold text-slate-900">
                Daily Cost — Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CostChart data={tokenData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="rounded-xl border-slate-100 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-semibold text-slate-900">
                Response Time — Last 30 Days
              </CardTitle>
              <div className="flex gap-4 pt-1">
                <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-sage-500" />
                  p50
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  p95
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  p99
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <PerformanceChart data={perfData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card className="rounded-xl border-slate-100 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-semibold text-slate-900">
                Tool Call Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ToolsChart data={toolData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tool performance table */}
      <Card className="rounded-xl border-slate-100 shadow-card">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold text-slate-900">
            Tool Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-left text-[12px] font-medium uppercase tracking-wider text-slate-400">
                    Tool
                  </th>
                  <th className="pb-3 text-right text-[12px] font-medium uppercase tracking-wider text-slate-400">
                    Calls
                  </th>
                  <th className="pb-3 text-right text-[12px] font-medium uppercase tracking-wider text-slate-400">
                    Success Rate
                  </th>
                  <th className="pb-3 text-right text-[12px] font-medium uppercase tracking-wider text-slate-400">
                    Avg Latency
                  </th>
                </tr>
              </thead>
              <tbody>
                {toolData.map((tool) => (
                  <tr
                    key={tool.name}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-3 text-[13px] font-medium text-slate-900">
                      {tool.name}
                    </td>
                    <td className="py-3 text-right text-[13px] text-slate-600">
                      {formatNumber(tool.calls)}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`text-[13px] font-medium ${
                          tool.successRate >= 98
                            ? "text-sage-600"
                            : tool.successRate >= 95
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {tool.successRate}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-[13px] text-slate-600">
                      {tool.avgLatency}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
