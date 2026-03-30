"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AGENT_STATUS_LABELS } from "@shared/types";
import type { Agent } from "@shared/types";
import { STATUS_BADGE_STYLES } from "@/lib/constants";

export function AgentCard({ agent }: { agent: Agent }) {
  const config = agent.config as { model?: string };

  return (
    <Link href={`/agents/${agent.id}`}>
      <Card className="group rounded-xl border-slate-100 shadow-card transition-all duration-fast hover:border-sage-400 hover:shadow-card-hover">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 transition-colors group-hover:bg-sage-50">
              <Bot className="h-5 w-5 text-slate-500" />
            </div>
            <Badge variant="outline" className={STATUS_BADGE_STYLES[agent.status]}>
              {AGENT_STATUS_LABELS[agent.status] || agent.status}
            </Badge>
          </div>

          <div className="mt-4">
            <h3 className="text-[14px] font-medium text-slate-900">
              {agent.name}
            </h3>
            {agent.description && (
              <p className="mt-1 text-[13px] leading-relaxed text-slate-400 line-clamp-2">
                {agent.description}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {config.model && (
              <Badge
                variant="secondary"
                className="bg-slate-50 text-[11px] font-normal text-slate-500"
              >
                {config.model.includes("opus") ? "Opus" : "Sonnet"}
              </Badge>
            )}
            {agent.tags?.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-slate-50 text-[11px] font-normal text-slate-500"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <p className="mt-4 text-[12px] text-slate-300">
            v{agent.currentVersion}
            {" \u00b7 "}
            {new Date(agent.updatedAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
