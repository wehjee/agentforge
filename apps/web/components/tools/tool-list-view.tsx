"use client";

import Link from "next/link";
import {
  Plus,
  Search,
  Wrench,
  Globe,
  Code,
  Calculator,
  Mail,
  Clock,
  Database,
  FileText,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTools } from "@/lib/hooks/use-tools";
import { useToolStore } from "@/stores/tool-store";

const TOOL_ICONS: Record<string, React.ReactNode> = {
  search: <Search className="h-5 w-5" />,
  code: <Code className="h-5 w-5" />,
  globe: <Globe className="h-5 w-5" />,
  calculator: <Calculator className="h-5 w-5" />,
  mail: <Mail className="h-5 w-5" />,
  database: <Database className="h-5 w-5" />,
  "file-text": <FileText className="h-5 w-5" />,
  clock: <Clock className="h-5 w-5" />,
};

const TYPE_BADGE_STYLES: Record<string, string> = {
  BUILTIN: "bg-violet-50 text-violet-700 border-violet-200",
  API: "bg-sky-50 text-sky-700 border-sky-200",
  CODE: "bg-amber-50 text-amber-700 border-amber-200",
};

function getToolIcon(tool: { name: string }): React.ReactNode {
  const name = tool.name.toLowerCase();
  if (name.includes("search") || name.includes("web")) return TOOL_ICONS.search;
  if (name.includes("code") || name.includes("execution")) return TOOL_ICONS.code;
  if (name.includes("http") || name.includes("request") || name.includes("api")) return TOOL_ICONS.globe;
  if (name.includes("calc")) return TOOL_ICONS.calculator;
  if (name.includes("email") || name.includes("mail")) return TOOL_ICONS.mail;
  if (name.includes("database") || name.includes("sql") || name.includes("query")) return TOOL_ICONS.database;
  if (name.includes("file")) return TOOL_ICONS["file-text"];
  if (name.includes("date") || name.includes("time")) return TOOL_ICONS.clock;
  return <Wrench className="h-5 w-5" />;
}

export function ToolListView() {
  const { tools, loading } = useTools();
  const { search, typeFilter, setSearch, setTypeFilter } = useToolStore();

  const filteredTools = tools.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
            Tools
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Built-in and custom tools your agents can use.
          </p>
        </div>
        <Button asChild>
          <Link href="/tools/new">
            <Plus className="mr-2 h-4 w-4" />
            New Tool
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-[13px]"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as "ALL" | "BUILTIN" | "API" | "CODE")}
        >
          <SelectTrigger className="h-9 w-[130px] text-[13px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="BUILTIN">Built-in</SelectItem>
            <SelectItem value="API">API</SelectItem>
            <SelectItem value="CODE">Code</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tool Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <Wrench className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-[14px] font-medium text-slate-600">No tools found</p>
          <p className="mt-1 text-[13px] text-slate-400">
            Create a custom tool or adjust your search.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/tools/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create Tool
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <Link key={tool.id} href={`/tools/${tool.id}`}>
              <Card className="group rounded-xl border-slate-100 shadow-card transition-all duration-200 hover:shadow-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-200/70">
                      {getToolIcon(tool)}
                    </div>
                    <Badge
                      variant="outline"
                      className={TYPE_BADGE_STYLES[tool.type] || TYPE_BADGE_STYLES.CODE}
                    >
                      {tool.type}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-[14px] font-medium text-slate-900">
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-400 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {tool.schema?.required?.slice(0, 3).map((param: string) => (
                      <Badge
                        key={param}
                        variant="secondary"
                        className="bg-slate-50 text-[11px] font-normal text-slate-500"
                      >
                        {param}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
