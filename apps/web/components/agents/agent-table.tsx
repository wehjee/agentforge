"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AGENT_STATUS_LABELS } from "@shared/types";
import type { Agent } from "@shared/types";
import { STATUS_BADGE_STYLES } from "@/lib/constants";

export function AgentTable({ agents }: { agents: Agent[] }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[13px] text-slate-500">Name</TableHead>
            <TableHead className="text-[13px] text-slate-500">Status</TableHead>
            <TableHead className="text-[13px] text-slate-500">Model</TableHead>
            <TableHead className="text-[13px] text-slate-500">
              Version
            </TableHead>
            <TableHead className="text-[13px] text-slate-500">
              Updated
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => {
            const config = agent.config as { model?: string };
            return (
              <TableRow key={agent.id} className="group">
                <TableCell>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
                      <Bot className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-slate-900 group-hover:text-sage-600 transition-colors">
                        {agent.name}
                      </p>
                      {agent.description && (
                        <p className="text-[12px] text-slate-400 line-clamp-1 max-w-[300px]">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={STATUS_BADGE_STYLES[agent.status]}
                  >
                    {AGENT_STATUS_LABELS[agent.status] || agent.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-[13px] text-slate-500">
                  {config.model?.includes("opus") ? "Opus" : "Sonnet"}
                </TableCell>
                <TableCell className="text-[13px] text-slate-500">
                  v{agent.currentVersion}
                </TableCell>
                <TableCell className="text-[13px] text-slate-400">
                  {new Date(agent.updatedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
