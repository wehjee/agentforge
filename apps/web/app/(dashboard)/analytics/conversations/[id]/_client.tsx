"use client";


import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  User,
  Clock,
  Coins,
  ChevronDown,
  ChevronRight,
  Wrench,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMockConversationDetail,
  type ConversationDetail,
  type ConversationMessage,
  type ToolCallDetail,
} from "@/lib/analytics-data";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ToolCallExpander({ tool }: { tool: ToolCallDetail }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/50">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        )}
        <Wrench className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-[12px] font-medium text-slate-700">
          {tool.name}
        </span>
        {tool.status === "success" ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-sage-500" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-red-500" />
        )}
        <span className="ml-auto text-[11px] text-slate-400">
          {tool.durationMs}ms
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-3 py-2 space-y-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Input
            </p>
            <pre className="mt-1 rounded-md bg-slate-900 p-2.5 text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Output
            </p>
            <pre className="mt-1 rounded-md bg-slate-900 p-2.5 text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
              {JSON.stringify(tool.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-sage-500" : "bg-slate-900"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>
      <div className={`max-w-[75%] space-y-1 ${isUser ? "items-end" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isUser
              ? "rounded-tr-md bg-sage-500 text-white"
              : "rounded-tl-md bg-slate-100 text-slate-900"
          }`}
        >
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Tool calls */}
        {message.toolCalls?.map((tool) => (
          <ToolCallExpander key={tool.id} tool={tool} />
        ))}

        {/* Meta line */}
        <div
          className={`flex items-center gap-3 px-1 ${
            isUser ? "justify-end" : ""
          }`}
        >
          <span className="text-[11px] text-slate-400">
            {formatTime(message.createdAt)}
          </span>
          {message.latencyMs && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-300">
              <Clock className="h-3 w-3" />
              {message.latencyMs}ms
            </span>
          )}
          {message.tokenUsage && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-300">
              <Coins className="h-3 w-3" />
              {message.tokenUsage.input + message.tokenUsage.output} tokens
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDetail(getMockConversationDetail(id));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center py-20">
        <p className="text-[14px] text-slate-400">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/analytics/conversations"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Conversations
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[22px] font-medium tracking-[-0.01em] text-slate-900">
            {detail.agentName}
          </h1>
          <Badge variant="outline" className="bg-sage-50 text-sage-600 border-sage-100 text-[11px]">
            {detail.status}
          </Badge>
        </div>
        <p className="mt-1 text-[13px] text-slate-400">
          {detail.id} &middot; {detail.channel} &middot;{" "}
          {new Date(detail.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="p-4">
            <p className="text-[12px] text-slate-400">Duration</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              {detail.duration}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-100">
          <CardContent className="p-4">
            <p className="text-[12px] text-slate-400">Messages</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              {detail.messages.length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-100">
          <CardContent className="p-4">
            <p className="text-[12px] text-slate-400">Total Tokens</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              {(detail.totalTokens.input + detail.totalTokens.output).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-100">
          <CardContent className="p-4">
            <p className="text-[12px] text-slate-400">Cost</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-900">
              ${detail.totalCost.toFixed(3)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transcript */}
      <Card className="rounded-xl border-slate-100 shadow-card">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold text-slate-900">
            Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {detail.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timing waterfall */}
      <Card className="rounded-xl border-slate-100 shadow-card">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold text-slate-900">
            Timing Waterfall
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {detail.messages
              .filter((m) => m.role === "assistant" && m.latencyMs)
              .map((msg, idx) => {
                const maxLatency = Math.max(
                  ...detail.messages
                    .filter((m) => m.latencyMs)
                    .map((m) => m.latencyMs!)
                );
                const width = Math.max(
                  8,
                  ((msg.latencyMs || 0) / maxLatency) * 100
                );
                return (
                  <div key={msg.id} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-[12px] text-slate-400 text-right">
                      Response {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div
                        className="h-6 rounded bg-sage-50 flex items-center px-2"
                        style={{ width: `${width}%` }}
                      >
                        <span className="text-[11px] font-medium text-sage-600">
                          {msg.latencyMs}ms
                        </span>
                      </div>
                    </div>
                    {msg.tokenUsage && (
                      <span className="w-20 shrink-0 text-right text-[11px] text-slate-400">
                        {msg.tokenUsage.input + msg.tokenUsage.output} tok
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
