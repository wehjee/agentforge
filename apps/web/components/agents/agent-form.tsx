"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import {
  MODEL_OPTIONS,
  TEMPERATURE_PRESETS,
  DEFAULT_AGENT_CONFIG,
} from "@shared/types";
import type { Agent, AgentConfig } from "@shared/types";
import { cn } from "@/lib/utils";

interface AgentFormProps {
  agent?: Agent;
}

export function AgentForm({ agent }: AgentFormProps) {
  const isEditing = !!agent;
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(agent?.name || "");
  const [description, setDescription] = useState(agent?.description || "");
  const [tags, setTags] = useState<string[]>(agent?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [config, setConfig] = useState<AgentConfig>(
    (agent?.config as AgentConfig) || DEFAULT_AGENT_CONFIG
  );
  const [saving, setSaving] = useState(false);
  const [guardrailsOpen, setGuardrailsOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);

  function updateConfig<K extends keyof AgentConfig>(
    key: K,
    value: AgentConfig[K]
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSave(status: "DRAFT" | "ACTIVE") {
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
        router.push(`/agents/${res.data?.id}`);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  const tempPreset =
    TEMPERATURE_PRESETS.find((p) => p.value === config.temperature)?.label ||
    "Custom";

  return (
    <div className="space-y-8 pb-24">
      {/* Identity */}
      <section className="space-y-5">
        <h2 className="text-[16px] font-semibold text-slate-900">Identity</h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[13px] text-slate-500">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer Support Bot"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] text-slate-500">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              rows={2}
              className="resize-none text-[14px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] text-slate-500">Tags</Label>
            <div className="flex items-center gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag..."
                className="h-9 text-[13px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer bg-slate-50 text-[12px] text-slate-600 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} &times;
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Model Configuration */}
      <section className="space-y-5">
        <h2 className="text-[16px] font-semibold text-slate-900">
          Model Configuration
        </h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[13px] text-slate-500">Model</Label>
            <Select
              value={config.model}
              onValueChange={(v) => updateConfig("model", v)}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[13px] text-slate-500">Temperature</Label>
              <span className="text-[13px] text-slate-400">
                {config.temperature.toFixed(1)} ({tempPreset})
              </span>
            </div>
            <Slider
              value={[config.temperature]}
              onValueChange={([v]) => updateConfig("temperature", v)}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <div className="flex gap-2">
              {TEMPERATURE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updateConfig("temperature", preset.value)}
                  className={cn(
                    "rounded-md border px-3 py-1 text-[12px] transition-colors",
                    config.temperature === preset.value
                      ? "border-slate-300 bg-slate-50 text-slate-900"
                      : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] text-slate-500">Max Tokens</Label>
            <Input
              type="number"
              value={config.maxTokens}
              onChange={(e) =>
                updateConfig("maxTokens", parseInt(e.target.value, 10) || 4096)
              }
              min={1}
              max={32768}
              className="h-10"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* System Prompt */}
      <section className="space-y-5">
        <h2 className="text-[16px] font-semibold text-slate-900">
          System Prompt
        </h2>
        <Textarea
          value={config.systemPrompt}
          onChange={(e) => updateConfig("systemPrompt", e.target.value)}
          placeholder="Define how your agent behaves. Be specific about its role, tone, and boundaries."
          rows={8}
          className="resize-y font-mono text-[13px] leading-relaxed"
        />
      </section>

      <Separator />

      {/* Guardrails (Collapsible) */}
      <section>
        <button
          type="button"
          onClick={() => setGuardrailsOpen(!guardrailsOpen)}
          className="flex w-full items-center gap-2 text-left"
        >
          {guardrailsOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          <h2 className="text-[16px] font-semibold text-slate-900">
            Guardrails
          </h2>
        </button>
        {guardrailsOpen && (
          <div className="mt-5 space-y-5 pl-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[13px] text-slate-900">
                  PII Detection
                </Label>
                <p className="text-[12px] text-slate-400">
                  Detect and filter personally identifiable information
                </p>
              </div>
              <Switch
                checked={config.guardrails.piiDetection}
                onCheckedChange={(v) =>
                  updateConfig("guardrails", {
                    ...config.guardrails,
                    piiDetection: v,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] text-slate-500">
                Max Conversation Turns
              </Label>
              <Input
                type="number"
                value={config.guardrails.maxConversationTurns}
                onChange={(e) =>
                  updateConfig("guardrails", {
                    ...config.guardrails,
                    maxConversationTurns:
                      parseInt(e.target.value, 10) || 50,
                  })
                }
                min={1}
                max={200}
                className="h-9 w-32"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] text-slate-500">
                Blocked Topics
              </Label>
              <Textarea
                value={config.guardrails.blockedTopics.join("\n")}
                onChange={(e) =>
                  updateConfig("guardrails", {
                    ...config.guardrails,
                    blockedTopics: e.target.value
                      .split("\n")
                      .filter(Boolean),
                  })
                }
                placeholder="One topic per line"
                rows={3}
                className="resize-none text-[13px]"
              />
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* Memory (Collapsible) */}
      <section>
        <button
          type="button"
          onClick={() => setMemoryOpen(!memoryOpen)}
          className="flex w-full items-center gap-2 text-left"
        >
          {memoryOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          <h2 className="text-[16px] font-semibold text-slate-900">Memory</h2>
        </button>
        {memoryOpen && (
          <div className="mt-5 space-y-5 pl-6">
            <div className="space-y-2">
              <Label className="text-[13px] text-slate-500">
                Max Messages in Context
              </Label>
              <Input
                type="number"
                value={config.memory.maxMessages}
                onChange={(e) =>
                  updateConfig("memory", {
                    ...config.memory,
                    maxMessages: parseInt(e.target.value, 10) || 20,
                  })
                }
                min={1}
                max={100}
                className="h-9 w-32"
              />
              <p className="text-[12px] text-slate-400">
                Number of recent messages to include in the conversation context.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1200px] items-center justify-end gap-3 px-6 py-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={() => handleSave("ACTIVE")} disabled={saving}>
            {saving ? "Saving..." : "Save & Activate"}
          </Button>
        </div>
      </div>
    </div>
  );
}
