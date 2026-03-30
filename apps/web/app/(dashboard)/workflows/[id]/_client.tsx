"use client";


import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorkflowCanvas } from "@/components/workflows/workflow-canvas";
import { useWorkflowStore } from "@/stores/workflow-store";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Workflow, WorkflowNodeData } from "@shared/types";
import type { Node, Edge } from "reactflow";

export default function EditWorkflowPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);

  const { setWorkflowId, setWorkflowName, setWorkflowDescription, loadCanvas } =
    useWorkflowStore();

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<Workflow>(`/workflows/${id}`);
        const data = (res as unknown as { data: Workflow }).data;

        setWorkflowId(data.id);
        setWorkflowName(data.name);
        setWorkflowDescription(data.description || "");

        const canvas = data.canvas as {
          nodes?: Node<WorkflowNodeData>[];
          edges?: Edge[];
        } | null;

        loadCanvas(canvas?.nodes || [], canvas?.edges || []);
      } catch (err) {
        console.error("Failed to load workflow:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, setWorkflowId, setWorkflowName, setWorkflowDescription, loadCanvas]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-0px)]">
      <WorkflowCanvas />
    </div>
  );
}
