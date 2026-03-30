"use client";


import { useParams } from "next/navigation";
import { useAgent } from "@/lib/hooks/use-agent";
import { DeployView } from "@/components/deploy/deploy-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentDeployPage() {
  const { id } = useParams<{ id: string }>();
  const { agent, loading, error } = useAgent(id);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <p className="text-[14px] text-slate-400">
          {error || "Agent not found"}
        </p>
      </div>
    );
  }

  return <DeployView agent={agent} />;
}
