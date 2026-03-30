"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Play,
  Undo2,
  Redo2,
  LayoutTemplate,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkflowStore } from "@/stores/workflow-store";
import { apiFetch } from "@/lib/api";
import type { Workflow } from "@shared/types";

interface WorkflowToolbarProps {
  onAutoLayout: () => void;
}

export function WorkflowToolbar({ onAutoLayout }: WorkflowToolbarProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const {
    workflowId,
    workflowName,
    setWorkflowName,
    nodes,
    edges,
    isDirty,
    setDirty,
    setWorkflowId,
    undo,
    redo,
    past,
    future,
  } = useWorkflowStore();

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const canvas = { nodes, edges };

      if (workflowId) {
        await apiFetch(`/workflows/${workflowId}`, {
          method: "PUT",
          body: JSON.stringify({ name: workflowName, canvas }),
        });
      } else {
        const res = await apiFetch<Workflow>("/workflows", {
          method: "POST",
          body: JSON.stringify({ name: workflowName, canvas }),
        });
        const data = res as unknown as { data: Workflow };
        if (data.data?.id) {
          setWorkflowId(data.data.id);
          router.replace(`/workflows/${data.data.id}`);
        }
      }
      setDirty(false);
    } catch (err) {
      console.error("Failed to save workflow:", err);
    } finally {
      setSaving(false);
    }
  }, [workflowId, workflowName, nodes, edges, router, setDirty, setWorkflowId]);

  const handleRun = useCallback(async () => {
    if (!workflowId) return;
    setRunning(true);
    try {
      await apiFetch(`/workflows/${workflowId}/run`, {
        method: "POST",
        body: JSON.stringify({ triggerType: "manual" }),
      });
      router.push(`/workflows/${workflowId}/runs`);
    } catch (err) {
      console.error("Failed to run workflow:", err);
    } finally {
      setRunning(false);
    }
  }, [workflowId, router]);

  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/workflows")}
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <Input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="h-8 w-64 border-transparent bg-transparent text-[15px] font-semibold text-slate-900 hover:border-slate-200 focus:border-slate-300"
        />

        {isDirty && (
          <span className="text-[11px] text-slate-400">Unsaved changes</span>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={past.length === 0}
          className="h-8 w-8 p-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={future.length === 0}
          className="h-8 w-8 p-0"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onAutoLayout}
          className="h-8 gap-1.5 text-[13px]"
          title="Auto Layout"
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          Layout
        </Button>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="h-8 gap-1.5 text-[13px]"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save
        </Button>

        <Button
          size="sm"
          onClick={handleRun}
          disabled={running || !workflowId}
          className="h-8 gap-1.5 text-[13px]"
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Run
        </Button>
      </div>
    </div>
  );
}
