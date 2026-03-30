"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
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
import { useWorkflowStore } from "@/stores/workflow-store";
import type { WorkflowNodeData } from "@shared/types";

export function NodeConfigPanel() {
  const { nodes, selectedNodeId, setSelectedNodeId, updateNodeData, removeNode } =
    useWorkflowStore();

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node || !selectedNodeId) return null;

  return (
    <div className="flex w-[320px] flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-[14px] font-semibold text-slate-900">
          Configure Node
        </h3>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Common: Label */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-slate-500">Node Name</Label>
            <Input
              value={node.data.label}
              onChange={(e) =>
                updateNodeData(selectedNodeId, { label: e.target.value })
              }
              className="h-8 text-[13px]"
            />
          </div>

          {/* Type-specific config */}
          <NodeTypeConfig
            nodeId={selectedNodeId}
            data={node.data}
            onUpdate={(config) =>
              updateNodeData(selectedNodeId, {
                config: { ...node.data.config, ...config },
              })
            }
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 p-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => {
            removeNode(selectedNodeId);
            setSelectedNodeId(null);
          }}
        >
          Delete Node
        </Button>
      </div>
    </div>
  );
}

function NodeTypeConfig({
  nodeId,
  data,
  onUpdate,
}: {
  nodeId: string;
  data: WorkflowNodeData;
  onUpdate: (config: Record<string, unknown>) => void;
}) {
  switch (data.nodeType) {
    case "trigger":
      return <TriggerConfig config={data.config} onUpdate={onUpdate} />;
    case "agent":
      return <AgentConfig config={data.config} onUpdate={onUpdate} />;
    case "router":
      return <RouterConfig config={data.config} onUpdate={onUpdate} />;
    case "conditional":
      return <ConditionalConfig config={data.config} onUpdate={onUpdate} />;
    case "parallel":
      return <ParallelConfig config={data.config} onUpdate={onUpdate} />;
    case "human":
      return <HumanConfig config={data.config} onUpdate={onUpdate} />;
    case "transform":
      return <TransformConfig config={data.config} onUpdate={onUpdate} />;
    case "output":
      return <OutputConfig config={data.config} onUpdate={onUpdate} />;
    default:
      return null;
  }
}

interface ConfigProps {
  config: Record<string, unknown>;
  onUpdate: (config: Record<string, unknown>) => void;
}

function TriggerConfig({ config, onUpdate }: ConfigProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">Trigger Type</Label>
        <Select
          value={(config.triggerType as string) || "manual"}
          onValueChange={(v) => onUpdate({ triggerType: v })}
        >
          <SelectTrigger className="h-8 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="schedule">Schedule (Cron)</SelectItem>
            <SelectItem value="event">Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.triggerType === "schedule" && (
        <div className="space-y-1.5">
          <Label className="text-[12px] text-slate-500">Cron Expression</Label>
          <Input
            value={(config.cron as string) || ""}
            onChange={(e) => onUpdate({ cron: e.target.value })}
            placeholder="0 */5 * * *"
            className="h-8 font-mono text-[13px]"
          />
        </div>
      )}

      {config.triggerType === "webhook" && (
        <div className="space-y-1.5">
          <Label className="text-[12px] text-slate-500">Webhook URL</Label>
          <Input
            value={(config.webhookUrl as string) || ""}
            readOnly
            placeholder="Generated on save"
            className="h-8 text-[13px] bg-slate-50"
          />
        </div>
      )}

      {config.triggerType === "event" && (
        <div className="space-y-1.5">
          <Label className="text-[12px] text-slate-500">Event Name</Label>
          <Input
            value={(config.eventName as string) || ""}
            onChange={(e) => onUpdate({ eventName: e.target.value })}
            placeholder="e.g. order.created"
            className="h-8 text-[13px]"
          />
        </div>
      )}
    </>
  );
}

function AgentConfig({ config, onUpdate }: ConfigProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">Agent</Label>
        <Input
          value={(config.agentName as string) || ""}
          onChange={(e) => onUpdate({ agentName: e.target.value })}
          placeholder="Select or type agent name"
          className="h-8 text-[13px]"
        />
        <p className="text-[11px] text-slate-400">
          Agent ID: {(config.agentId as string) || "Not set"}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">Retry Count</Label>
        <Input
          type="number"
          min={0}
          max={5}
          value={(config.retryCount as number) ?? 0}
          onChange={(e) => onUpdate({ retryCount: parseInt(e.target.value) || 0 })}
          className="h-8 text-[13px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">Timeout (ms)</Label>
        <Input
          type="number"
          min={1000}
          step={1000}
          value={(config.timeoutMs as number) ?? 30000}
          onChange={(e) =>
            onUpdate({ timeoutMs: parseInt(e.target.value) || 30000 })
          }
          className="h-8 text-[13px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">
          Input Mappings (JSON)
        </Label>
        <Textarea
          value={JSON.stringify(config.inputMappings || {}, null, 2)}
          onChange={(e) => {
            try {
              onUpdate({ inputMappings: JSON.parse(e.target.value) });
            } catch {}
          }}
          placeholder='{"query": "nodeOutputs.trigger.data"}'
          className="h-20 font-mono text-[12px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">
          Output Mappings (JSON)
        </Label>
        <Textarea
          value={JSON.stringify(config.outputMappings || {}, null, 2)}
          onChange={(e) => {
            try {
              onUpdate({ outputMappings: JSON.parse(e.target.value) });
            } catch {}
          }}
          placeholder='{"result": "response.content"}'
          className="h-20 font-mono text-[12px]"
        />
      </div>
    </>
  );
}

function RouterConfig({ config, onUpdate }: ConfigProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">Routing Mode</Label>
        <Select
          value={(config.mode as string) || "rules"}
          onValueChange={(v) => onUpdate({ mode: v })}
        >
          <SelectTrigger className="h-8 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rules">Rule-based</SelectItem>
            <SelectItem value="llm">LLM Classification</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.mode === "llm" ? (
        <div className="space-y-1.5">
          <Label className="text-[12px] text-slate-500">LLM Prompt</Label>
          <Textarea
            value={(config.llmPrompt as string) || ""}
            onChange={(e) => onUpdate({ llmPrompt: e.target.value })}
            placeholder="Classify the input into one of the following categories..."
            className="h-24 text-[12px]"
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-[12px] text-slate-500">
            Conditions (JSON Array)
          </Label>
          <Textarea
            value={JSON.stringify(config.conditions || [], null, 2)}
            onChange={(e) => {
              try {
                onUpdate({ conditions: JSON.parse(e.target.value) });
              } catch {}
            }}
            placeholder='[{"field":"status","operator":"equals","value":"urgent","targetHandle":"route-1"}]'
            className="h-32 font-mono text-[11px]"
          />
        </div>
      )}
    </>
  );
}

function ConditionalConfig({ config, onUpdate }: ConfigProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">Expression</Label>
        <Textarea
          value={(config.expression as string) || ""}
          onChange={(e) => onUpdate({ expression: e.target.value })}
          placeholder='ctx.nodeOutputs.agent1.score > 0.8'
          className="h-20 font-mono text-[12px]"
        />
        <p className="text-[11px] text-slate-400">
          Access context via <code className="bg-slate-100 px-1 rounded text-[10px]">ctx</code>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[12px] text-slate-500">True Label</Label>
          <Input
            value={(config.trueLabel as string) || "True"}
            onChange={(e) => onUpdate({ trueLabel: e.target.value })}
            className="h-8 text-[13px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] text-slate-500">False Label</Label>
          <Input
            value={(config.falseLabel as string) || "False"}
            onChange={(e) => onUpdate({ falseLabel: e.target.value })}
            className="h-8 text-[13px]"
          />
        </div>
      </div>
    </>
  );
}

function ParallelConfig({ config, onUpdate }: ConfigProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] text-slate-500">Merge Strategy</Label>
      <Select
        value={(config.mergeStrategy as string) || "wait_all"}
        onValueChange={(v) => onUpdate({ mergeStrategy: v })}
      >
        <SelectTrigger className="h-8 text-[13px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="wait_all">Wait for all branches</SelectItem>
          <SelectItem value="wait_first">Wait for first branch</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-[11px] text-slate-400">
        Connect multiple downstream nodes to create parallel branches.
      </p>
    </div>
  );
}

function HumanConfig({ config, onUpdate }: ConfigProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">Message</Label>
        <Textarea
          value={(config.message as string) || ""}
          onChange={(e) => onUpdate({ message: e.target.value })}
          placeholder="Please review and approve this action..."
          className="h-20 text-[12px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">
          Approval Buttons (JSON)
        </Label>
        <Textarea
          value={JSON.stringify(
            config.approvalButtons || [
              { label: "Approve", value: "approved" },
              { label: "Reject", value: "rejected" },
            ],
            null,
            2
          )}
          onChange={(e) => {
            try {
              onUpdate({ approvalButtons: JSON.parse(e.target.value) });
            } catch {}
          }}
          className="h-24 font-mono text-[11px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">Notify Email</Label>
        <Input
          type="email"
          value={(config.notifyEmail as string) || ""}
          onChange={(e) => onUpdate({ notifyEmail: e.target.value })}
          placeholder="admin@example.com"
          className="h-8 text-[13px]"
        />
      </div>
    </>
  );
}

function TransformConfig({ config, onUpdate }: ConfigProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">Description</Label>
        <Input
          value={(config.description as string) || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="What this transform does..."
          className="h-8 text-[13px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">JavaScript Code</Label>
        <Textarea
          value={(config.code as string) || ""}
          onChange={(e) => onUpdate({ code: e.target.value })}
          placeholder={`// Access context and nodeOutputs\nconst result = context.name;\nreturn { transformed: result };`}
          className="h-40 font-mono text-[12px]"
        />
        <p className="text-[11px] text-slate-400">
          Variables: <code className="bg-slate-100 px-1 rounded text-[10px]">context</code>,{" "}
          <code className="bg-slate-100 px-1 rounded text-[10px]">nodeOutputs</code>
        </p>
      </div>
    </>
  );
}

function OutputConfig({ config, onUpdate }: ConfigProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-[12px] text-slate-500">Output Type</Label>
        <Select
          value={(config.outputType as string) || "return"}
          onValueChange={(v) => onUpdate({ outputType: v })}
        >
          <SelectTrigger className="h-8 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="return">Return Response</SelectItem>
            <SelectItem value="email">Send Email</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="store">Store Data</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.outputType === "email" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-slate-500">Email To</Label>
            <Input
              type="email"
              value={(config.emailTo as string) || ""}
              onChange={(e) => onUpdate({ emailTo: e.target.value })}
              className="h-8 text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-slate-500">Subject</Label>
            <Input
              value={(config.emailSubject as string) || ""}
              onChange={(e) => onUpdate({ emailSubject: e.target.value })}
              className="h-8 text-[13px]"
            />
          </div>
        </>
      )}

      {config.outputType === "webhook" && (
        <div className="space-y-1.5">
          <Label className="text-[12px] text-slate-500">Webhook URL</Label>
          <Input
            value={(config.webhookUrl as string) || ""}
            onChange={(e) => onUpdate({ webhookUrl: e.target.value })}
            placeholder="https://..."
            className="h-8 text-[13px]"
          />
        </div>
      )}

      {config.outputType === "store" && (
        <div className="space-y-1.5">
          <Label className="text-[12px] text-slate-500">Store Key</Label>
          <Input
            value={(config.storeKey as string) || ""}
            onChange={(e) => onUpdate({ storeKey: e.target.value })}
            placeholder="result_key"
            className="h-8 text-[13px]"
          />
        </div>
      )}
    </>
  );
}
