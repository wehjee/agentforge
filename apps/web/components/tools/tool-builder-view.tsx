"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Save,
  Loader2,
  Plus,
  Trash2,
  Globe,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";

interface ParamDef {
  key: string;
  type: string;
  description: string;
  required: boolean;
}

export function ToolBuilderView() {
  const router = useRouter();
  const [mode, setMode] = useState<"API" | "CODE">("API");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // API mode state
  const [apiUrl, setApiUrl] = useState("");
  const [apiMethod, setApiMethod] = useState<string>("GET");
  const [apiHeaders, setApiHeaders] = useState("");
  const [apiBody, setApiBody] = useState("");
  const [authType, setAuthType] = useState<string>("none");
  const [authToken, setAuthToken] = useState("");
  const [authHeaderName, setAuthHeaderName] = useState("X-API-Key");

  // Code mode state
  const [code, setCode] = useState(`// Your tool handler function
// The 'input' object contains the parameters defined below
// Return the result as a value

const result = input.value * 2;
return result;`);

  // Parameters
  const [params, setParams] = useState<ParamDef[]>([]);

  // Execution config
  const [timeoutMs, setTimeoutMs] = useState(30000);
  const [retryCount, setRetryCount] = useState(0);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Test state
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const addParam = useCallback(() => {
    setParams((prev) => [
      ...prev,
      { key: `param_${prev.length + 1}`, type: "string", description: "", required: false },
    ]);
  }, []);

  const removeParam = useCallback((index: number) => {
    setParams((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateParam = useCallback((index: number, updates: Partial<ParamDef>) => {
    setParams((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  }, []);

  const buildSchema = useCallback(() => {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const p of params) {
      properties[p.key] = { type: p.type, description: p.description };
      if (p.required) required.push(p.key);
    }
    return { type: "object" as const, properties, required: required.length > 0 ? required : undefined };
  }, [params]);

  const buildConfig = useCallback(() => {
    const cfg: Record<string, any> = {
      timeout_ms: timeoutMs,
      retry_count: retryCount,
      requires_approval: requiresApproval,
    };

    if (mode === "API") {
      cfg.url = apiUrl;
      cfg.method = apiMethod;
      if (apiHeaders) cfg.headers = JSON.parse(apiHeaders || "{}");
      if (apiBody) cfg.bodyTemplate = apiBody;
      cfg.authType = authType;
      if (authType === "bearer") cfg.authConfig = { token: authToken };
      if (authType === "api_key") cfg.authConfig = { headerName: authHeaderName, apiKey: authToken };
    } else {
      cfg.code = code;
      cfg.language = "javascript";
    }

    return cfg;
  }, [mode, apiUrl, apiMethod, apiHeaders, apiBody, authType, authToken, authHeaderName, code, timeoutMs, retryCount, requiresApproval]);

  const handleSave = useCallback(async () => {
    if (!name.trim() || !description.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch<any>("/tools", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          type: mode,
          schema: buildSchema(),
          config: buildConfig(),
        }),
      });
      const tool = (res as any).data;
      router.push(`/tools/${tool.id}`);
    } catch (err) {
      console.error("Failed to save tool:", err);
    } finally {
      setSaving(false);
    }
  }, [name, description, mode, buildSchema, buildConfig, router]);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const parsedInput: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(testInputs)) {
        if (!value) continue;
        const param = params.find((p) => p.key === key);
        if (param?.type === "number") {
          parsedInput[key] = parseFloat(value);
        } else {
          parsedInput[key] = value;
        }
      }

      const res = await apiFetch<any>("/tools/test-inline", {
        method: "POST",
        body: JSON.stringify({
          type: mode,
          schema: buildSchema(),
          config: buildConfig(),
          input: parsedInput,
        }),
      });
      setTestResult((res as any).data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message, durationMs: 0 });
    } finally {
      setTesting(false);
    }
  }, [testInputs, params, mode, buildSchema, buildConfig]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/tools")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-display text-[22px] font-medium tracking-[-0.01em] text-slate-900">
              Create Custom Tool
            </h1>
            <p className="text-[13px] text-slate-500">
              Build an API connector or code function.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim() || !description.trim()}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Tool"}
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Configuration */}
        <div className="space-y-5">
          {/* Identity */}
          <Card className="rounded-xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-slate-800">
                Tool Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-[12px] text-slate-600">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Calculate Shipping"
                  className="mt-1 h-9 text-[13px]"
                />
              </div>
              <div>
                <Label className="text-[12px] text-slate-600">Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this tool do?"
                  className="mt-1 h-9 text-[13px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mode Tabs */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as "API" | "CODE")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="API" className="gap-1.5 text-[13px]">
                <Globe className="h-3.5 w-3.5" />
                API Connector
              </TabsTrigger>
              <TabsTrigger value="CODE" className="gap-1.5 text-[13px]">
                <Code className="h-3.5 w-3.5" />
                Code Function
              </TabsTrigger>
            </TabsList>

            <TabsContent value="API" className="mt-4">
              <Card className="rounded-xl border-slate-100">
                <CardContent className="space-y-4 pt-5">
                  <div className="flex gap-3">
                    <div className="w-28">
                      <Label className="text-[12px] text-slate-600">Method</Label>
                      <Select value={apiMethod} onValueChange={setApiMethod}>
                        <SelectTrigger className="mt-1 h-9 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-[12px] text-slate-600">URL</Label>
                      <Input
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        placeholder="https://api.example.com/endpoint/{{param}}"
                        className="mt-1 h-9 text-[13px]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[12px] text-slate-600">Headers (JSON)</Label>
                    <textarea
                      value={apiHeaders}
                      onChange={(e) => setApiHeaders(e.target.value)}
                      placeholder='{"Content-Type": "application/json"}'
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2.5 text-[12px] font-mono text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                      rows={3}
                    />
                  </div>

                  {["POST", "PUT", "PATCH"].includes(apiMethod) && (
                    <div>
                      <Label className="text-[12px] text-slate-600">Body Template</Label>
                      <textarea
                        value={apiBody}
                        onChange={(e) => setApiBody(e.target.value)}
                        placeholder='{"key": "{{param_value}}"}'
                        className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2.5 text-[12px] font-mono text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                        rows={4}
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-[12px] text-slate-600">Authentication</Label>
                    <Select value={authType} onValueChange={setAuthType}>
                      <SelectTrigger className="mt-1 h-9 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                      </SelectContent>
                    </Select>
                    {authType !== "none" && (
                      <div className="mt-2 space-y-2">
                        {authType === "api_key" && (
                          <Input
                            value={authHeaderName}
                            onChange={(e) => setAuthHeaderName(e.target.value)}
                            placeholder="Header name (e.g. X-API-Key)"
                            className="h-9 text-[13px]"
                          />
                        )}
                        <Input
                          value={authToken}
                          onChange={(e) => setAuthToken(e.target.value)}
                          placeholder={authType === "bearer" ? "Bearer token" : "API key value"}
                          type="password"
                          className="h-9 text-[13px]"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="CODE" className="mt-4">
              <Card className="rounded-xl border-slate-100">
                <CardContent className="pt-5">
                  <Label className="text-[12px] text-slate-600">Handler Code (JavaScript)</Label>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] font-mono text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                    rows={12}
                    spellCheck={false}
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    The <code className="rounded bg-slate-100 px-1">input</code> object contains the parameters. Use <code className="rounded bg-slate-100 px-1">return</code> to send back the result.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Parameters */}
          <Card className="rounded-xl border-slate-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[14px] font-medium text-slate-800">
                  Input Parameters
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-[12px]"
                  onClick={addParam}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {params.length === 0 ? (
                <p className="text-[13px] text-slate-400">No parameters defined yet.</p>
              ) : (
                params.map((param, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-100 p-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={param.key}
                          onChange={(e) => updateParam(i, { key: e.target.value })}
                          placeholder="param_name"
                          className="h-8 flex-1 text-[12px] font-mono"
                        />
                        <Select
                          value={param.type}
                          onValueChange={(v) => updateParam(i, { type: v })}
                        >
                          <SelectTrigger className="h-8 w-24 text-[12px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">string</SelectItem>
                            <SelectItem value="number">number</SelectItem>
                            <SelectItem value="boolean">boolean</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        value={param.description}
                        onChange={(e) => updateParam(i, { description: e.target.value })}
                        placeholder="Description"
                        className="h-8 text-[12px]"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={param.required}
                          onCheckedChange={(v) => updateParam(i, { required: v })}
                        />
                        <span className="text-[11px] text-slate-500">Required</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-500"
                      onClick={() => removeParam(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Execution Config */}
          <Card className="rounded-xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-slate-800">
                Execution Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[12px] text-slate-600">Timeout (ms)</Label>
                  <Input
                    type="number"
                    value={timeoutMs}
                    onChange={(e) => setTimeoutMs(parseInt(e.target.value) || 30000)}
                    className="mt-1 h-9 text-[13px]"
                  />
                </div>
                <div>
                  <Label className="text-[12px] text-slate-600">Retry Count</Label>
                  <Input
                    type="number"
                    value={retryCount}
                    onChange={(e) => setRetryCount(parseInt(e.target.value) || 0)}
                    min={0}
                    max={5}
                    className="mt-1 h-9 text-[13px]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={requiresApproval}
                  onCheckedChange={setRequiresApproval}
                />
                <span className="text-[12px] text-slate-600">Require human approval before execution</span>
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
            <CardContent className="space-y-3">
              {params.length === 0 ? (
                <p className="text-[13px] text-slate-400">Add parameters to test the tool.</p>
              ) : (
                params.map((param) => (
                  <div key={param.key}>
                    <Label className="text-[12px] text-slate-600">
                      {param.key}
                      {param.required && <span className="text-red-400 ml-0.5">*</span>}
                    </Label>
                    <Input
                      value={testInputs[param.key] || ""}
                      onChange={(e) =>
                        setTestInputs((prev) => ({ ...prev, [param.key]: e.target.value }))
                      }
                      placeholder={param.description || param.key}
                      className="mt-1 h-9 text-[13px]"
                    />
                  </div>
                ))
              )}

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
