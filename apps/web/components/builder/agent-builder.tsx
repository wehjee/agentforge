"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Monitor, Save, ChevronLeft, Eye, Code, PanelRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBuilderStore, type BuilderTab } from "@/stores/builder-store";
import { IdentityPanel } from "./identity-panel";
import { InstructionsPanel } from "./instructions-panel";
import { ModelPanel } from "./model-panel";
import { ToolsPanel } from "./tools-panel";
import { KnowledgePanel } from "./knowledge-panel";
import { GuardrailsPanel } from "./guardrails-panel";
import { VariablesPanel } from "./variables-panel";
import { CodeEditor } from "./code-editor";
import { Playground } from "./playground";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Agent, AgentConfig } from "@shared/types";

interface AgentBuilderProps {
  agent?: Agent;
}

export function AgentBuilder({ agent }: AgentBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!agent;

  const {
    name,
    description,
    tags,
    config,
    activeTab,
    isDirty,
    saving,
    showPlayground,
    setActiveTab,
    setSaving,
    markClean,
    initFromAgent,
    reset,
    setShowPlayground,
  } = useBuilderStore();

  // Initialize store from agent data
  useEffect(() => {
    if (agent) {
      initFromAgent(agent);
    } else {
      reset();
    }
  }, [agent?.id]);

  const handleSave = useCallback(
    async (status: "DRAFT" | "ACTIVE") => {
      if (!name.trim()) {
        toast({
          variant: "destructive",
          title: "Name is required",
          description: "Please enter a name for your agent.",
        });
        return;
      }

      setSaving(true);
      try {
        if (isEditing) {
          await apiFetch(`/agents/${agent.id}`, {
            method: "PUT",
            body: JSON.stringify({
              name,
              description: description || null,
              tags,
              config,
              status,
            }),
          });
          toast({ title: "Agent updated" });
          markClean();
          router.refresh();
        } else {
          const res = await apiFetch<Agent>("/agents", {
            method: "POST",
            body: JSON.stringify({
              name,
              description: description || undefined,
              tags,
              config,
              status,
            }),
          });
          toast({ title: "Agent created" });
          markClean();
          router.push(`/agents/${res.data?.id}`);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to save",
          description:
            error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setSaving(false);
      }
    },
    [name, description, tags, config, isEditing, agent, router, toast, setSaving, markClean]
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Mobile notice */}
      <div className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 lg:hidden">
        <Monitor className="h-4 w-4 text-amber-600" />
        <span className="text-[12px] text-amber-700">
          Use desktop for the best builder experience
        </span>
      </div>

      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/agents")}
            className="flex items-center gap-1 text-[13px] text-slate-400 transition-colors hover:text-slate-600"
          >
            <ChevronLeft className="h-4 w-4" />
            Agents
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-slate-900 truncate max-w-[200px]">
              {name || "Untitled Agent"}
            </span>
            {isDirty && (
              <Badge
                variant="secondary"
                className="bg-amber-50 text-[10px] text-amber-600"
              >
                Unsaved
              </Badge>
            )}
            {agent && (
              <Badge
                variant="outline"
                className="text-[10px]"
              >
                v{agent.currentVersion}
              </Badge>
            )}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-150",
              activeTab === "visual"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-150",
              activeTab === "code"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Code className="h-3.5 w-3.5" />
            Code
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {agent && (
            <Link href={`/agents/${agent.id}/versions`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-[12px] text-slate-400"
              >
                <History className="h-3.5 w-3.5" />
                v{agent.currentVersion}
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400"
            onClick={() => setShowPlayground(!showPlayground)}
          >
            <PanelRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="h-8 text-[12px]"
          >
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave("ACTIVE")}
            disabled={saving}
            className="h-8 gap-1.5 text-[12px]"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save & Activate"}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel — Config */}
        <div
          className={cn(
            "shrink-0 overflow-y-auto border-r border-slate-100 bg-white transition-all duration-200",
            activeTab === "code" ? "w-0 border-r-0 overflow-hidden" : "w-[400px]"
          )}
        >
          <IdentityPanel />
          <InstructionsPanel />
          <ModelPanel />
          <ToolsPanel />
          <KnowledgePanel />
          <GuardrailsPanel />
          <VariablesPanel />
        </div>

        {/* Center panel — Code editor (shown when code tab active) */}
        {activeTab === "code" && (
          <div className="flex-1 min-w-0 p-3 bg-slate-900">
            <CodeEditor />
          </div>
        )}

        {/* Right panel — Playground */}
        <div
          className={cn(
            "border-l border-slate-100 bg-white transition-all duration-200 overflow-hidden",
            showPlayground
              ? activeTab === "code"
                ? "w-[420px] shrink-0"
                : "flex-1 min-w-[360px]"
              : "w-0 border-l-0"
          )}
        >
          <Playground agentId={agent?.id} />
        </div>

        {/* Visual mode center spacer — when playground is hidden in visual mode */}
        {activeTab === "visual" && !showPlayground && (
          <div className="flex flex-1 items-center justify-center bg-slate-50/50">
            <div className="text-center">
              <PanelRight className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-[13px] text-slate-400">
                Click the panel icon to open the playground
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
