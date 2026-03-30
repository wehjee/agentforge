"use client";

import Link from "next/link";
import { Bot, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AgentEmptyState() {
  return (
    <Card className="rounded-xl border-dashed border-slate-200">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
          <Bot className="h-7 w-7 text-slate-300" />
        </div>
        <h3 className="mt-4 text-[15px] font-medium text-slate-900">
          No agents yet
        </h3>
        <p className="mt-1.5 max-w-[280px] text-center text-[13px] leading-relaxed text-slate-400">
          Create your first AI agent to get started. Agents can handle support,
          generate content, and more.
        </p>
        <Button asChild className="mt-5">
          <Link href="/agents/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
