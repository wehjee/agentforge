"use client";

import { useState } from "react";
import { Copy, Check, Code2, Terminal, Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Agent } from "@shared/types";
import type { Deployment, Environment, ApiChannelConfig } from "@shared/types/deployment";

const DEFAULT_API_CONFIG: ApiChannelConfig = {
  rateLimit: 60,
  corsOrigins: [],
};

export function ApiEndpointView({
  agent,
  environment,
  deployment,
  onSave,
}: {
  agent: Agent;
  environment: Environment;
  deployment?: Deployment;
  onSave: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ApiChannelConfig>(
    (deployment?.config as unknown as ApiChannelConfig) || DEFAULT_API_CONFIG
  );

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/external/agents/${agent.id}/chat`;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (deployment) {
        await apiFetch(`/deployments/${deployment.id}`, {
          method: "PUT",
          body: JSON.stringify({ config }),
        });
      } else {
        await apiFetch(`/agents/${agent.id}/deploy`, {
          method: "POST",
          body: JSON.stringify({
            channel: "API",
            environment,
            config,
          }),
        });
      }
      toast({ title: "API deployment saved" });
      onSave();
    } catch {
      toast({ variant: "destructive", title: "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const curlExample = `curl -X POST "${apiUrl}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, how can you help me?",
    "conversation_id": null,
    "stream": true
  }'`;

  const jsExample = `const response = await fetch("${apiUrl}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: "Hello, how can you help me?",
    conversation_id: null,
    stream: true,
  }),
});

// SSE streaming
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split("\\n\\n");

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = JSON.parse(line.slice(6));
      if (data.type === "text_delta") {
        process.stdout.write(data.content);
      }
    }
  }
}`;

  const pythonExample = `import requests
import json

url = "${apiUrl}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
}

# Non-streaming
response = requests.post(url, headers=headers, json={
    "message": "Hello, how can you help me?",
    "stream": False,
})
print(response.json()["data"]["content"])

# Streaming (SSE)
response = requests.post(url, headers=headers, json={
    "message": "Hello, how can you help me?",
    "stream": True,
}, stream=True)

for line in response.iter_lines():
    if line:
        line = line.decode("utf-8")
        if line.startswith("data: "):
            data = json.loads(line[6:])
            if data["type"] == "text_delta":
                print(data["content"], end="", flush=True)`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[16px] font-semibold text-slate-900">
          API Endpoint
        </h2>
        <p className="mt-1 text-[13px] text-slate-400">
          Access your agent via REST API with SSE streaming support
        </p>
      </div>

      {/* Endpoint URL */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[13px]">Endpoint URL</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
                POST {apiUrl}
              </code>
              <CopyButton text={apiUrl} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Rate Limit (requests/min)</Label>
            <Input
              type="number"
              value={config.rateLimit}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  rateLimit: parseInt(e.target.value) || 60,
                }))
              }
              className="h-9 w-32 text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">CORS Origins</Label>
            <Input
              value={config.corsOrigins.join(", ")}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  corsOrigins: e.target.value
                    .split(",")
                    .map((d) => d.trim())
                    .filter(Boolean),
                }))
              }
              className="h-9 text-[13px]"
              placeholder="* (all origins)"
            />
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-3">
        <h3 className="text-[14px] font-semibold text-slate-900">
          Code Examples
        </h3>

        <Tabs defaultValue="curl">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="curl" className="gap-1.5 text-[12px]">
              <Terminal className="h-3.5 w-3.5" />
              cURL
            </TabsTrigger>
            <TabsTrigger value="javascript" className="gap-1.5 text-[12px]">
              <Braces className="h-3.5 w-3.5" />
              JavaScript
            </TabsTrigger>
            <TabsTrigger value="python" className="gap-1.5 text-[12px]">
              <Code2 className="h-3.5 w-3.5" />
              Python
            </TabsTrigger>
          </TabsList>

          <TabsContent value="curl">
            <CodeBlock code={curlExample} language="bash" />
          </TabsContent>
          <TabsContent value="javascript">
            <CodeBlock code={jsExample} language="javascript" />
          </TabsContent>
          <TabsContent value="python">
            <CodeBlock code={pythonExample} language="python" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Response Format */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-[14px] font-semibold text-slate-900">
          Response Format (SSE)
        </h3>
        <div className="mt-3 space-y-2 text-[13px]">
          <div className="flex items-baseline gap-3">
            <code className="rounded bg-slate-100 px-2 py-0.5 text-[12px] font-mono text-slate-600">
              text_delta
            </code>
            <span className="text-slate-400">Partial text content</span>
          </div>
          <div className="flex items-baseline gap-3">
            <code className="rounded bg-slate-100 px-2 py-0.5 text-[12px] font-mono text-slate-600">
              tool_use
            </code>
            <span className="text-slate-400">Tool invocation details</span>
          </div>
          <div className="flex items-baseline gap-3">
            <code className="rounded bg-slate-100 px-2 py-0.5 text-[12px] font-mono text-slate-600">
              tool_result
            </code>
            <span className="text-slate-400">Tool execution result</span>
          </div>
          <div className="flex items-baseline gap-3">
            <code className="rounded bg-slate-100 px-2 py-0.5 text-[12px] font-mono text-slate-600">
              message_end
            </code>
            <span className="text-slate-400">
              End of response with token usage
            </span>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving
          ? "Saving..."
          : deployment
            ? "Update API Deployment"
            : "Enable API Access"}
      </Button>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="relative mt-2">
      <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-[12px] leading-relaxed text-slate-300">
        <code>{code}</code>
      </pre>
      <CopyButton
        text={code}
        className="absolute right-3 top-3"
      />
    </div>
  );
}

function CopyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md bg-slate-800 px-2.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-300",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}
