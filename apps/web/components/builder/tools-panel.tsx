"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Wrench,
  Search,
  Code,
  Globe,
  Calculator,
  Mail,
  Clock,
  Database,
  FileText,
  Plus,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfigPanel } from "./config-panel";
import { useBuilderStore } from "@/stores/builder-store";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

const TOOL_ICONS: Record<string, React.ReactNode> = {
  search: <Search className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  globe: <Globe className="h-4 w-4" />,
  calculator: <Calculator className="h-4 w-4" />,
  mail: <Mail className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  "file-text": <FileText className="h-4 w-4" />,
  clock: <Clock className="h-4 w-4" />,
};

function getIconForTool(name: string): React.ReactNode {
  const n = name.toLowerCase();
  if (n.includes("search") || n.includes("web")) return TOOL_ICONS.search;
  if (n.includes("code") || n.includes("execution")) return TOOL_ICONS.code;
  if (n.includes("http") || n.includes("request")) return TOOL_ICONS.globe;
  if (n.includes("calc")) return TOOL_ICONS.calculator;
  if (n.includes("email") || n.includes("mail")) return TOOL_ICONS.mail;
  if (n.includes("database") || n.includes("query")) return TOOL_ICONS.database;
  if (n.includes("file")) return TOOL_ICONS["file-text"];
  if (n.includes("date") || n.includes("time")) return TOOL_ICONS.clock;
  return <Wrench className="h-4 w-4" />;
}

export function ToolsPanel() {
  const tools = useBuilderStore((s) => s.config.tools);
  const toggleTool = useBuilderStore((s) => s.toggleTool);
  const [search, setSearch] = useState("");

  const enabledCount = tools.filter((t) => t.enabled).length;

  const filteredTools = search
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase())
      )
    : tools;

  return (
    <ConfigPanel
      id="tools"
      title="Tools"
      icon={<Wrench className="h-3.5 w-3.5" />}
      badge={enabledCount > 0 ? `${enabledCount} active` : undefined}
    >
      <div className="space-y-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="h-8 text-[12px]"
        />

        <div className="space-y-2">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-150 ${
                tool.enabled
                  ? "border-sage-100 bg-sage-50/50"
                  : "border-slate-150 bg-white hover:border-slate-200"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  tool.enabled
                    ? "bg-sage-50 text-sage-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {TOOL_ICONS[tool.icon] || getIconForTool(tool.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-900">
                  {tool.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {tool.description}
                </p>
              </div>
              <Switch
                checked={tool.enabled}
                onCheckedChange={() => toggleTool(tool.id)}
              />
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 gap-1.5 text-[12px]"
          asChild
        >
          <Link href="/tools/new">
            <Plus className="h-3.5 w-3.5" />
            Create Custom Tool
          </Link>
        </Button>
      </div>
    </ConfigPanel>
  );
}
