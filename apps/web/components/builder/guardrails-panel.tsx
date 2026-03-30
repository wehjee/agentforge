"use client";

import { useState } from "react";
import { Shield, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfigPanel } from "./config-panel";
import { useBuilderStore } from "@/stores/builder-store";

export function GuardrailsPanel() {
  const config = useBuilderStore((s) => s.config);
  const updateConfig = useBuilderStore((s) => s.updateConfig);
  const [topicInput, setTopicInput] = useState("");

  const guardrails = config.guardrails;

  function updateGuardrails(updates: Partial<typeof guardrails>) {
    updateConfig("guardrails", { ...guardrails, ...updates });
  }

  function addBlockedTopic() {
    const topic = topicInput.trim();
    if (topic && !guardrails.blockedTopics.includes(topic)) {
      updateGuardrails({
        blockedTopics: [...guardrails.blockedTopics, topic],
      });
      setTopicInput("");
    }
  }

  function removeBlockedTopic(topic: string) {
    updateGuardrails({
      blockedTopics: guardrails.blockedTopics.filter((t) => t !== topic),
    });
  }

  return (
    <ConfigPanel
      id="guardrails"
      title="Guardrails"
      icon={<Shield className="h-3.5 w-3.5" />}
    >
      <div className="space-y-5">
        {/* PII Detection */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-slate-900">
              PII Detection
            </p>
            <p className="text-[11px] text-slate-400">
              Detect and filter personally identifiable information
            </p>
          </div>
          <Switch
            checked={guardrails.piiDetection}
            onCheckedChange={(v) => updateGuardrails({ piiDetection: v })}
          />
        </div>

        {/* Blocked Topics */}
        <div className="space-y-2">
          <Label className="text-[12px] font-medium text-slate-500">
            Blocked Topics
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addBlockedTopic();
                }
              }}
              placeholder="e.g. competitor pricing"
              className="h-8 text-[12px]"
            />
            <button
              type="button"
              onClick={addBlockedTopic}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Add
            </button>
          </div>
          {guardrails.blockedTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {guardrails.blockedTopics.map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="gap-1 bg-red-50 pr-1 text-[11px] text-red-600"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => removeBlockedTopic(topic)}
                    className="ml-0.5 rounded-sm p-0.5 hover:bg-red-100"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Max Conversation Turns */}
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">
            Max Conversation Turns
          </Label>
          <Input
            type="number"
            value={guardrails.maxConversationTurns}
            onChange={(e) =>
              updateGuardrails({
                maxConversationTurns: parseInt(e.target.value, 10) || 50,
              })
            }
            min={1}
            max={200}
            className="h-9 w-32 text-[13px]"
          />
        </div>

        {/* Escalation Rules */}
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">
            Escalation Rules
          </Label>
          <Textarea
            value={guardrails.escalationRules}
            onChange={(e) =>
              updateGuardrails({ escalationRules: e.target.value })
            }
            placeholder="Define when to hand off to a human agent. e.g. 'When customer explicitly requests a human agent'"
            rows={3}
            className="resize-none text-[12px]"
          />
        </div>
      </div>
    </ConfigPanel>
  );
}
