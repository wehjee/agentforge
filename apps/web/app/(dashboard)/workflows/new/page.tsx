"use client";

import { useEffect } from "react";
import { WorkflowCanvas } from "@/components/workflows/workflow-canvas";
import { useWorkflowStore } from "@/stores/workflow-store";

export default function NewWorkflowPage() {
  const reset = useWorkflowStore((s) => s.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <div className="h-[calc(100vh-0px)]">
      <WorkflowCanvas />
    </div>
  );
}
