"use client";

import { useState } from "react";
import { Clock, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import type { Agent } from "@shared/types";
import type { Deployment, Environment, ScheduledConfig } from "@shared/types/deployment";

const DEFAULT_SCHEDULED_CONFIG: ScheduledConfig = {
  cronExpr: "0 9 * * *",
  timezone: "UTC",
  outputRouting: "database",
};

const CRON_PRESETS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at 9am", value: "0 9 * * *" },
  { label: "Every Monday at 9am", value: "0 9 * * 1" },
  { label: "Every 1st of month", value: "0 9 1 * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
];

export function ScheduledConfigView({
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
  const [config, setConfig] = useState<ScheduledConfig>(
    (deployment?.config as unknown as ScheduledConfig) || DEFAULT_SCHEDULED_CONFIG
  );

  const updateConfig = (updates: Partial<ScheduledConfig>) => {
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
            channel: "SCHEDULED",
            environment,
            config,
          }),
        });
      }
      toast({ title: "Schedule configuration saved" });
      onSave();
    } catch {
      toast({ variant: "destructive", title: "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[16px] font-semibold text-slate-900">
          Scheduled Jobs
        </h2>
        <p className="mt-1 text-[13px] text-slate-400">
          Run this agent on a recurring schedule
        </p>
      </div>

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        {/* Cron Expression */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-[13px]">Cron Expression</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-[12px]">
                  <p>Format: minute hour day-of-month month day-of-week</p>
                  <p className="mt-1 text-slate-400">
                    Example: &quot;0 9 * * *&quot; = Every day at 9:00 AM
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            value={config.cronExpr}
            onChange={(e) => updateConfig({ cronExpr: e.target.value })}
            className="h-9 font-mono text-[13px]"
            placeholder="0 9 * * *"
          />
          <div className="flex flex-wrap gap-1.5">
            {CRON_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => updateConfig({ cronExpr: preset.value })}
                className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label className="text-[13px]">Timezone</Label>
          <Select
            value={config.timezone}
            onValueChange={(v) => updateConfig({ timezone: v })}
          >
            <SelectTrigger className="h-9 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Output Routing */}
        <div className="space-y-2">
          <Label className="text-[13px]">Output Routing</Label>
          <Select
            value={config.outputRouting}
            onValueChange={(v) =>
              updateConfig({
                outputRouting: v as "database" | "webhook" | "email",
              })
            }
          >
            <SelectTrigger className="h-9 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="database">Store in Database</SelectItem>
              <SelectItem value="webhook">Send to Webhook</SelectItem>
              <SelectItem value="email">Send via Email</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conditional fields */}
        {config.outputRouting === "webhook" && (
          <div className="space-y-2">
            <Label className="text-[13px]">Webhook URL</Label>
            <Input
              value={config.webhookUrl || ""}
              onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
              className="h-9 text-[13px]"
              placeholder="https://your-service.com/webhook"
            />
          </div>
        )}

        {config.outputRouting === "email" && (
          <div className="space-y-2">
            <Label className="text-[13px]">Email To</Label>
            <Input
              value={config.emailTo || ""}
              onChange={(e) => updateConfig({ emailTo: e.target.value })}
              className="h-9 text-[13px]"
              placeholder="team@company.com"
            />
          </div>
        )}
      </div>

      {/* Schedule Preview */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <h3 className="text-[14px] font-medium text-slate-900">
            Schedule Preview
          </h3>
        </div>
        <p className="mt-2 text-[13px] text-slate-500">
          {describeCron(config.cronExpr)} ({config.timezone})
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving
          ? "Saving..."
          : deployment
            ? "Update Schedule"
            : "Create Schedule"}
      </Button>
    </div>
  );
}

function describeCron(expr: string): string {
  const parts = expr.split(" ");
  if (parts.length !== 5) return `Runs on schedule: ${expr}`;

  const [min, hour, dom, month, dow] = parts;

  if (min === "0" && hour !== "*" && dom === "*" && month === "*" && dow === "*") {
    return `Every day at ${hour}:00`;
  }
  if (min === "0" && hour !== "*" && dom === "*" && month === "*" && dow !== "*") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayNum = parseInt(dow);
    const dayName = days[dayNum] || dow;
    return `Every ${dayName} at ${hour}:00`;
  }
  if (min.startsWith("*/")) {
    return `Every ${min.slice(2)} minutes`;
  }
  if (hour === "*" && min === "0") {
    return "Every hour";
  }
  if (dom !== "*" && month === "*") {
    return `On day ${dom} of every month at ${hour}:${min.padStart(2, "0")}`;
  }
  return `Runs on schedule: ${expr}`;
}
