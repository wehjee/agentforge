"use client";

import { useState } from "react";
import {
  Hash,
  ExternalLink,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import type { Agent } from "@shared/types";
import type { Deployment, Environment, SlackConfig } from "@shared/types/deployment";

const DEFAULT_SLACK_CONFIG: SlackConfig = {
  channels: [],
  threadAware: true,
};

export function SlackConfigView({
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
  const [config, setConfig] = useState<SlackConfig>(
    (deployment?.config as unknown as SlackConfig) || DEFAULT_SLACK_CONFIG
  );

  const isConnected = Boolean(config.botToken);

  const handleOAuth = async () => {
    try {
      const res = await apiFetch<{ url: string; state: string }>(
        "/slack/oauth/start"
      );
      const data = res.data as unknown as { url: string; state: string };
      if (data?.url) {
        window.open(data.url, "_blank", "width=600,height=700");
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to start Slack OAuth flow",
      });
    }
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
            channel: "SLACK",
            environment,
            config,
          }),
        });
      }
      toast({ title: "Slack configuration saved" });
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
          Slack Bot Integration
        </h2>
        <p className="mt-1 text-[13px] text-slate-400">
          Deploy your agent as a Slack bot in your workspace
        </p>
      </div>

      {/* Connection Status */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4A154B]/10">
              <Hash className="h-5 w-5 text-[#4A154B]" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-slate-900">
                Slack Workspace
              </h3>
              <p className="text-[12px] text-slate-400">
                {isConnected
                  ? `Connected — Team: ${config.teamId || "Unknown"}`
                  : "Not connected"}
              </p>
            </div>
          </div>

          {isConnected ? (
            <Badge className="bg-sage-50 text-[11px] text-sage-600 hover:bg-sage-50">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOAuth}
              className="gap-1.5 text-[13px]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Connect to Slack
            </Button>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="space-y-2">
          <Label className="text-[13px]">Channels</Label>
          <Input
            value={config.channels.join(", ")}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                channels: e.target.value
                  .split(",")
                  .map((c) => c.trim())
                  .filter(Boolean),
              }))
            }
            className="h-9 text-[13px]"
            placeholder="general, support (leave empty for all channels)"
          />
          <p className="text-[12px] text-slate-400">
            Channel names where the bot will respond. Leave empty for DM-only.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[13px]">Thread-aware</Label>
            <p className="text-[12px] text-slate-400">
              Maintain conversation context within threads
            </p>
          </div>
          <Switch
            checked={config.threadAware}
            onCheckedChange={(v) =>
              setConfig((prev) => ({ ...prev, threadAware: v }))
            }
          />
        </div>
      </div>

      {/* Webhook URL */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-[14px] font-semibold text-slate-900">
          Event Webhook
        </h3>
        <p className="mt-1 text-[12px] text-slate-400">
          Configure this URL in your Slack app&apos;s Event Subscriptions settings
        </p>
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
          <code className="text-[12px] text-slate-600">
            {process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}
            /api/v1/slack/events
          </code>
        </div>
      </div>

      {/* Info */}
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
        <div className="text-[13px] text-amber-700">
          <p className="font-medium">Setup requirements</p>
          <ol className="mt-1 list-inside list-decimal space-y-1 text-[12px] text-amber-600">
            <li>Create a Slack app at api.slack.com/apps</li>
            <li>Enable Event Subscriptions with the webhook URL above</li>
            <li>Subscribe to <code className="rounded bg-amber-100 px-1">message.channels</code> and <code className="rounded bg-amber-100 px-1">app_mention</code> events</li>
            <li>Install the app to your workspace</li>
            <li>Connect your workspace using the button above</li>
          </ol>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving
          ? "Saving..."
          : deployment
            ? "Update Slack Bot"
            : "Deploy Slack Bot"}
      </Button>
    </div>
  );
}
