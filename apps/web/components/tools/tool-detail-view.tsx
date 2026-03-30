"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Trash2,
  Wrench,
  Search,
  Code,
  Globe,
  Calculator,
  Mail,
  Clock,
  Database,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiFetch } from "@/lib/api";
import type { ToolDefinition, ToolTestResult } from "@shared/types";

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

function getToolIcon(name: string): React.ReactNode {
  const n = name.toLowerCase();
  if (n.includes("search") || n.includes("web")) return TOOL_ICONS.search;
  if (n.includes("code") || n.includes("execution")) return TOOL_ICONS.code;
  if (n.includes("http") || n.includes("request")) return TOOL_ICONS.globe;
  if (n.includes("calc")) return TOOL_ICONS.calculator;
  if (n.includes("email") || n.includes("mail")) return TOOL_ICONS.mail;
  if (n.includes("database") || n.includes("query")) return TOOL_ICONS.database;
  if (n.includes("file")) return TOOL_ICONS["file-text"];
  if (n.includes("date") || n.includes("time")) return TOOL_ICONS.clock;
  return <Wrench className="h-5 w-5" />;
}

export function ToolDetailView({ toolId }: { toolId: string }) {
  const router = useRouter();
  const [tool, setTool] = useState<ToolDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<ToolTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<ToolDefinition>(`/tools/${toolId}`);
        setTool((res as any).data);

        // Initialize test inputs from schema
        const schema = (res as any).data?.schema as any;
        if (schema?.properties) {
          const defaults: Record<string, string> = {};
          for (const [key, prop] of Object.entries(schema.properties)) {
            const p = prop as any;
            if (p.default !== undefined) defaults[key] = String(p.default);
            else if (p.enum?.length > 0) defaults[key] = p.enum[0];
            else defaults[key] = "";
          }
          setTestInputs(defaults);
        }
      } catch {
        // Tool not found
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toolId]);

  const handleTest = useCallback(async () => {
    if (!tool) return;
    setTesting(true);
    setTestResult(null);
    try {
      // Parse numeric values
      const parsedInput: Record<string, unknown> = {};
      const schema = tool.schema as any;
      for (const [key, value] of Object.entries(testInputs)) {
        if (!value) continue;
        const propType = schema?.properties?.[key]?.type;
        if (propType === "number") {
          parsedInput[key] = parseFloat(value);
        } else {
          parsedInput[key] = value;
        }
      }

      const res = await apiFetch<ToolTestResult>(`/tools/${toolId}/test`, {
        method: "POST",
        body: JSON.stringify({ input: parsedInput }),
      });
      setTestResult((res as any).data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Test failed",
        durationMs: 0,
      });
    } finally {
      setTesting(false);
    }
  }, [tool, testInputs, toolId]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await apiFetch(`/tools/${toolId}`, { method: "DELETE" });
      router.push("/tools");
    } catch {
      setDeleting(false);
    }
  }, [toolId, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="text-center py-20">
        <p className="text-[14px] text-slate-500">Tool not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/tools")}>
          Back to Tools
        </Button>
      </div>
    );
  }

  const schema = tool.schema as any;
  const config = tool.config as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/tools")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {getToolIcon(tool.name)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[22px] font-medium tracking-[-0.01em] text-slate-900">
              {tool.name}
            </h1>
            <Badge
              variant="outline"
              className={TYPE_BADGE_STYLES[tool.type] || ""}
            >
              {tool.type}
            </Badge>
          </div>
          <p className="text-[13px] text-slate-500">{tool.description}</p>
        </div>

        {tool.type !== "BUILTIN" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this tool?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{tool.name}" and disconnect it from all agents. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete Tool"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Two-panel layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Config & Schema */}
        <div className="space-y-5">
          {/* Input Schema */}
          <Card className="rounded-xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-slate-800">
                Input Schema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {schema?.properties && Object.keys(schema.properties).length > 0 ? (
                Object.entries(schema.properties).map(([key, prop]: [string, any]) => (
                  <div key={key} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-900">{key}</span>
                      <Badge variant="secondary" className="h-4 bg-slate-50 px-1.5 text-[10px] font-normal text-slate-500">
                        {prop.type}
                      </Badge>
                      {schema.required?.includes(key) && (
                        <Badge variant="secondary" className="h-4 bg-red-50 px-1.5 text-[10px] font-normal text-red-500">
                          required
                        </Badge>
                      )}
                    </div>
                    {prop.description && (
                      <p className="mt-1 text-[12px] text-slate-400">{prop.description}</p>
                    )}
                    {prop.enum && (
                      <div className="mt-1.5 flex gap-1">
                        {prop.enum.map((v: string) => (
                          <Badge key={v} variant="outline" className="text-[10px]">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-slate-400">No input parameters defined</p>
              )}
            </CardContent>
          </Card>

          {/* Config */}
          {(tool.type === "API" || tool.type === "CODE") && (
            <Card className="rounded-xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-medium text-slate-800">
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-slate-50 p-3 text-[12px] text-slate-700 overflow-auto max-h-60">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Execution Config */}
          <Card className="rounded-xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-slate-800">
                Execution Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] text-slate-400">Timeout</p>
                  <p className="text-[13px] font-medium text-slate-700">
                    {config?.timeout_ms ? `${config.timeout_ms / 1000}s` : "30s"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Retries</p>
                  <p className="text-[13px] font-medium text-slate-700">
                    {config?.retry_count ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Approval</p>
                  <p className="text-[13px] font-medium text-slate-700">
                    {config?.requires_approval ? "Required" : "Auto"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Test Panel */}
        <div className="space-y-5">
          <Card className="rounded-xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-slate-800">
                Test Tool
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test inputs */}
              {schema?.properties && Object.entries(schema.properties).map(([key, prop]: [string, any]) => (
                <div key={key}>
                  <Label className="text-[12px] text-slate-600">
                    {key}
                    {schema.required?.includes(key) && <span className="text-red-400 ml-0.5">*</span>}
                  </Label>
                  {prop.enum ? (
                    <select
                      value={testInputs[key] || ""}
                      onChange={(e) => setTestInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                    >
                      <option value="">Select...</option>
                      {prop.enum.map((v: string) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={testInputs[key] || ""}
                      onChange={(e) => setTestInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={prop.description || key}
                      className="mt-1 h-9 text-[13px]"
                    />
                  )}
                </div>
              ))}

              <Button
                onClick={handleTest}
                disabled={testing}
                className="w-full"
                size="sm"
              >
                {testing ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="mr-2 h-3.5 w-3.5" />
                )}
                {testing ? "Running..." : "Run Test"}
              </Button>
            </CardContent>
          </Card>

          {/* Test Result */}
          {testResult && (
            <Card className={`rounded-xl border ${testResult.success ? "border-sage-100 bg-sage-50/30" : "border-red-200 bg-red-50/30"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-[14px] font-medium ${testResult.success ? "text-sage-600" : "text-red-800"}`}>
                    {testResult.success ? "Success" : "Error"}
                  </CardTitle>
                  <Badge variant="outline" className="text-[11px]">
                    {testResult.durationMs}ms
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-white/80 p-3 text-[12px] text-slate-700 overflow-auto max-h-80 whitespace-pre-wrap">
                  {testResult.success
                    ? JSON.stringify(testResult.output, null, 2)
                    : testResult.error
                  }
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
