"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MessageSquare,
  Code2,
  Hash,
  Clock,
  Check,
  X,
  ExternalLink,
  Copy,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import type { Agent } from "@shared/types";
import type { Deployment, Environment } from "@shared/types/deployment";
import { cn } from "@/lib/utils";
import { WidgetConfigurator } from "./widget-configurator";
import { ApiEndpointView } from "./api-endpoint-view";
import { SlackConfigView } from "./slack-config-view";
import { ScheduledConfigView } from "./scheduled-config-view";
import { EnvironmentBadge } from "./environment-badge";
import { VersionManager } from "./version-manager";

const CHANNELS = [
  {
    id: "WIDGET" as const,
    label: "Chat Widget",
    description: "Embeddable chat widget for your website",
    icon: MessageSquare,
  },
  {
    id: "API" as const,
    label: "API Endpoint",
    description: "REST API with SSE streaming support",
    icon: Code2,
  },
  {
    id: "SLACK" as const,
    label: "Slack Bot",
    description: "Deploy as a Slack bot in your workspace",
    icon: Hash,
  },
  {
    id: "SCHEDULED" as const,
    label: "Scheduled Jobs",
    description: "Run agent on a cron schedule",
    icon: Clock,
  },
];

export function DeployView({ agent }: { agent: Agent }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<Environment>("DEV");

  const fetchDeployments = useCallback(async () => {
    try {
      const res = await apiFetch<Deployment[]>(
        `/agents/${agent.id}/deployments`
      );
      setDeployments((res.data as unknown as Deployment[]) || []);
    } catch {
      toast({ variant: "destructive", title: "Failed to load deployments" });
    } finally {
      setLoading(false);
    }
  }, [agent.id, toast]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const getDeploymentForChannel = (
    channelId: string,
    env: Environment
  ): Deployment | undefined => {
    return deployments.find(
      (d) => d.channel === channelId && d.environment === env
    );
  };

  const isChannelActive = (channelId: string): boolean => {
    return deployments.some(
      (d) => d.channel === channelId && d.isActive
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/agents/${agent.id}`)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-[20px] font-semibold text-slate-900">
              Deploy {agent.name}
            </h1>
            <p className="mt-0.5 text-[13px] text-slate-400">
              Version {agent.currentVersion} — Configure deployment channels and
              environments
            </p>
          </div>
        </div>
      </div>

      {/* Environment Selector */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-medium text-slate-500">
          Environment
        </span>
        <div className="flex gap-2">
          {(["DEV", "STAGING", "PROD"] as Environment[]).map((env) => (
            <button
              key={env}
              onClick={() => setEnvironment(env)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                environment === env
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              <EnvironmentBadge env={env} size="sm" />
              {env === "DEV"
                ? "Development"
                : env === "STAGING"
                  ? "Staging"
                  : "Production"}
            </button>
          ))}
        </div>
      </div>

      <Tabs
        defaultValue="channels"
        className="space-y-6"
      >
        <TabsList className="bg-slate-100">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-6">
          {/* Channel Cards */}
          {!selectedChannel ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                const active = isChannelActive(channel.id);
                const deployment = getDeploymentForChannel(
                  channel.id,
                  environment
                );

                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-slate-200/70">
                        <Icon className="h-5 w-5 text-slate-600" />
                      </div>
                      {active ? (
                        <Badge className="bg-sage-50 text-[11px] text-sage-600 hover:bg-sage-50">
                          <Check className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[11px] text-slate-400"
                        >
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-4 text-[14px] font-semibold text-slate-900">
                      {channel.label}
                    </h3>
                    <p className="mt-1 text-[13px] text-slate-400">
                      {channel.description}
                    </p>
                    {deployment && (
                      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                        <EnvironmentBadge env={deployment.environment as Environment} size="sm" />
                        <span className="text-[12px] text-slate-400">
                          v{deployment.agentVersion}
                        </span>
                      </div>
                    )}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                      <ExternalLink className="h-4 w-4 text-slate-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedChannel(null)}
                className="flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-slate-600"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back to channels
              </button>

              {selectedChannel === "WIDGET" && (
                <WidgetConfigurator
                  agent={agent}
                  environment={environment}
                  deployment={getDeploymentForChannel("WIDGET", environment)}
                  onSave={fetchDeployments}
                />
              )}
              {selectedChannel === "API" && (
                <ApiEndpointView
                  agent={agent}
                  environment={environment}
                  deployment={getDeploymentForChannel("API", environment)}
                  onSave={fetchDeployments}
                />
              )}
              {selectedChannel === "SLACK" && (
                <SlackConfigView
                  agent={agent}
                  environment={environment}
                  deployment={getDeploymentForChannel("SLACK", environment)}
                  onSave={fetchDeployments}
                />
              )}
              {selectedChannel === "SCHEDULED" && (
                <ScheduledConfigView
                  agent={agent}
                  environment={environment}
                  deployment={getDeploymentForChannel("SCHEDULED", environment)}
                  onSave={fetchDeployments}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="versions">
          <VersionManager agent={agent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
