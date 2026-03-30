"use client";

import { useState } from "react";
import {
  MessageSquare,
  Copy,
  Check,
  Send,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Agent } from "@shared/types";
import type { Deployment, Environment, WidgetConfig } from "@shared/types/deployment";

const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  primaryColor: "#2563eb",
  position: "bottom-right",
  welcomeMessage: "Hi there! How can I help you today?",
  windowWidth: 380,
  windowHeight: 560,
  showPreChatForm: false,
  preChatFields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
  ],
  allowedDomains: [],
};

export function WidgetConfigurator({
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
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>(
    (deployment?.config as unknown as WidgetConfig) || DEFAULT_WIDGET_CONFIG
  );

  const updateConfig = (updates: Partial<WidgetConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

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
            channel: "WIDGET",
            environment,
            config,
          }),
        });
      }
      toast({ title: "Widget configuration saved" });
      onSave();
    } catch {
      toast({ variant: "destructive", title: "Failed to save configuration" });
    } finally {
      setSaving(false);
    }
  };

  const embedCode = `<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://app.agentforge.io"}/widget/${agent.id}.js"></script>
<script>
  AgentForge.init({
    agentId: "${agent.id}",
    position: "${config.position}",
    primaryColor: "${config.primaryColor}",
    welcomeMessage: "${config.welcomeMessage}"
  });
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Configuration */}
      <div className="space-y-6">
        <div>
          <h2 className="text-[16px] font-semibold text-slate-900">
            Widget Configuration
          </h2>
          <p className="mt-1 text-[13px] text-slate-400">
            Customize the appearance and behavior of the chat widget
          </p>
        </div>

        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label className="text-[13px]">Primary Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) =>
                  updateConfig({ primaryColor: e.target.value })
                }
                className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200"
              />
              <Input
                value={config.primaryColor}
                onChange={(e) =>
                  updateConfig({ primaryColor: e.target.value })
                }
                className="h-9 w-32 font-mono text-[13px]"
              />
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label className="text-[13px]">Position</Label>
            <Select
              value={config.position}
              onValueChange={(v) =>
                updateConfig({
                  position: v as "bottom-right" | "bottom-left",
                })
              }
            >
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <Label className="text-[13px]">Welcome Message</Label>
            <Textarea
              value={config.welcomeMessage}
              onChange={(e) =>
                updateConfig({ welcomeMessage: e.target.value })
              }
              className="min-h-[80px] text-[13px]"
              placeholder="Hi there! How can I help you today?"
            />
          </div>

          {/* Pre-chat Form */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[13px]">Pre-chat Form</Label>
              <p className="text-[12px] text-slate-400">
                Collect name and email before conversation
              </p>
            </div>
            <Switch
              checked={config.showPreChatForm}
              onCheckedChange={(v) =>
                updateConfig({ showPreChatForm: v })
              }
            />
          </div>

          {/* Allowed Domains */}
          <div className="space-y-2">
            <Label className="text-[13px]">Allowed Domains</Label>
            <Input
              value={config.allowedDomains.join(", ")}
              onChange={(e) =>
                updateConfig({
                  allowedDomains: e.target.value
                    .split(",")
                    .map((d) => d.trim())
                    .filter(Boolean),
                })
              }
              className="h-9 text-[13px]"
              placeholder="example.com, app.example.com"
            />
            <p className="text-[12px] text-slate-400">
              Comma-separated. Leave empty to allow all domains.
            </p>
          </div>
        </div>

        {/* Embed Code */}
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold text-slate-900">
            Embed Code
          </h3>
          <div className="relative">
            <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-[12px] leading-relaxed text-slate-300">
              <code>{embedCode}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 flex h-7 items-center gap-1.5 rounded-md bg-slate-800 px-2.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-300"
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
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving
            ? "Saving..."
            : deployment
              ? "Update Widget"
              : "Deploy Widget"}
        </Button>
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <h3 className="text-[14px] font-semibold text-slate-900">
          Preview
        </h3>
        <WidgetPreview config={config} agentName={agent.name} />
      </div>
    </div>
  );
}

function WidgetPreview({
  config,
  agentName,
}: {
  config: WidgetConfig;
  agentName: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      {/* Mock browser chrome */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        </div>
        <div className="mx-auto flex h-6 w-64 items-center rounded-md bg-slate-100 px-3">
          <span className="text-[11px] text-slate-400">yourwebsite.com</span>
        </div>
      </div>

      {/* Mock page content */}
      <div className="relative h-[480px] bg-white p-6">
        <div className="space-y-3">
          <div className="h-3 w-3/4 rounded bg-slate-100" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
          <div className="h-3 w-2/3 rounded bg-slate-100" />
          <div className="mt-4 h-24 rounded-lg bg-slate-50" />
          <div className="h-3 w-3/5 rounded bg-slate-100" />
          <div className="h-3 w-2/5 rounded bg-slate-100" />
        </div>

        {/* Widget */}
        <div
          className={cn(
            "absolute bottom-4",
            config.position === "bottom-right" ? "right-4" : "left-4"
          )}
        >
          {open ? (
            <div
              className="flex flex-col overflow-hidden rounded-2xl shadow-2xl"
              style={{ width: 280, height: 380 }}
            >
              {/* Widget header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: config.primaryColor }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                    <MessageSquare className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-white">
                      {agentName}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-sage-400" />
                      Online
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages area */}
              <div className="flex-1 space-y-3 bg-slate-50 p-3">
                {/* Welcome message */}
                <div className="flex gap-2">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <MessageSquare className="h-3 w-3 text-white" />
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                    <p className="text-[11px] text-slate-600">
                      {config.welcomeMessage}
                    </p>
                  </div>
                </div>

                {/* Sample user message */}
                <div className="flex justify-end">
                  <div
                    className="rounded-xl rounded-tr-sm px-3 py-2 text-[11px] text-white"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Can you help me?
                  </div>
                </div>

                {/* Typing indicator */}
                <div className="flex gap-2">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <MessageSquare className="h-3 w-3 text-white" />
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Input area */}
              <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2.5">
                <input
                  readOnly
                  placeholder="Type a message..."
                  className="flex-1 text-[11px] text-slate-400 outline-none"
                />
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: config.primaryColor }}
            >
              <MessageSquare className="h-5 w-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
