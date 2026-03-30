"use client";


import { useParams } from "next/navigation";
import { useAgent } from "@/lib/hooks/use-agent";
import { AgentBuilder } from "@/components/builder/agent-builder";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { agent, loading, error } = useAgent(id);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
          <p className="text-[13px] text-slate-400">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center">
        <p className="text-[14px] text-slate-400">
          {error || "Agent not found"}
        </p>
      </div>
    );
  }

  return <AgentBuilder agent={agent} />;
}
