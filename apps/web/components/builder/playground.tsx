"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Trash2,
  ChevronRight,
  Clock,
  Zap,
  FileText,
  Bot,
  User as UserIcon,
  AlertCircle,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBuilderStore, type PlaygroundMessage } from "@/stores/builder-store";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface PlaygroundProps {
  agentId?: string;
}

export function Playground({ agentId }: PlaygroundProps) {
  const [input, setInput] = useState("");
  const [sidePanel, setSidePanel] = useState<"prompt" | "details" | "variables" | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<PlaygroundMessage | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = useBuilderStore((s) => s.playgroundMessages);
  const streaming = useBuilderStore((s) => s.playgroundStreaming);
  const config = useBuilderStore((s) => s.config);
  const testVariables = useBuilderStore((s) => s.testVariables);
  const variables = useBuilderStore((s) => s.config.variables);
  const addPlaygroundMessage = useBuilderStore((s) => s.addPlaygroundMessage);
  const updatePlaygroundMessage = useBuilderStore((s) => s.updatePlaygroundMessage);
  const clearPlayground = useBuilderStore((s) => s.clearPlayground);
  const setPlaygroundStreaming = useBuilderStore((s) => s.setPlaygroundStreaming);
  const setTestVariable = useBuilderStore((s) => s.setTestVariable);
  const name = useBuilderStore((s) => s.name);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const userMsg: PlaygroundMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: input.trim(),
    };

    const assistantId = `msg_${Date.now()}_assistant`;
    const assistantMsg: PlaygroundMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    addPlaygroundMessage(userMsg);
    addPlaygroundMessage(assistantMsg);
    setInput("");
    setPlaygroundStreaming(true);
    setLlmError(null);

    try {
      // Build existing messages for context
      const existingMsgs = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const endpoint = agentId ? `/agents/${agentId}/test` : null;

      if (!endpoint) {
        // No agent saved yet — show message
        useBuilderStore.setState((s) => ({
          playgroundMessages: s.playgroundMessages.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Save your agent first to test it in the playground.",
                  isStreaming: false,
                }
              : m
          ),
        }));
        setPlaygroundStreaming(false);
        return;
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1${endpoint}`;

      const token = document.cookie
        .split("; ")
        .find((c) => c.startsWith("token="))
        ?.split("=")[1];
      const workspaceId = localStorage.getItem("workspaceId") || "";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(workspaceId && { "x-workspace-id": workspaceId }),
        },
        body: JSON.stringify({
          message: input.trim(),
          messages: existingMsgs,
          variables: Object.keys(testVariables).length > 0 ? testVariables : undefined,
          config,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        const errMsg =
          errBody?.error?.code === "LLM_UNAVAILABLE"
            ? "Add your Anthropic API key in settings to test agents"
            : errBody?.error?.message || "Failed to get response";
        setLlmError(errMsg);
        useBuilderStore.setState((s) => ({
          playgroundMessages: s.playgroundMessages.filter(
            (m) => m.id !== assistantId
          ),
        }));
        setPlaygroundStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let usage: { inputTokens: number; outputTokens: number } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "text") {
              fullContent += event.content;
              useBuilderStore.setState((s) => ({
                playgroundMessages: s.playgroundMessages.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: fullContent }
                    : m
                ),
              }));
            } else if (event.type === "done") {
              usage = event.usage;
            } else if (event.type === "error") {
              setLlmError(event.message);
            }
          } catch {
            // skip malformed events
          }
        }
      }

      // Finalize the message
      useBuilderStore.setState((s) => ({
        playgroundMessages: s.playgroundMessages.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: fullContent,
                isStreaming: false,
                tokenUsage: usage
                  ? { input: usage.inputTokens, output: usage.outputTokens }
                  : undefined,
              }
            : m
        ),
      }));
    } catch (err) {
      setLlmError(err instanceof Error ? err.message : "Connection error");
      useBuilderStore.setState((s) => ({
        playgroundMessages: s.playgroundMessages.filter(
          (m) => m.id !== assistantId
        ),
      }));
    } finally {
      setPlaygroundStreaming(false);
    }
  }, [input, streaming, messages, agentId, config, testVariables, addPlaygroundMessage, setPlaygroundStreaming]);

  const totalTokens = messages.reduce(
    (acc, m) => ({
      input: acc.input + (m.tokenUsage?.input || 0),
      output: acc.output + (m.tokenUsage?.output || 0),
    }),
    { input: 0, output: 0 }
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-slate-400" />
          <span className="text-[13px] font-semibold text-slate-900">
            Playground
          </span>
          {messages.length > 0 && (
            <span className="text-[11px] text-slate-400">
              {messages.filter((m) => m.role === "user").length} messages
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-400"
            onClick={() => setSidePanel(sidePanel === "variables" ? null : "variables")}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-400"
            onClick={() => setSidePanel(sidePanel === "prompt" ? null : "prompt")}
          >
            <FileText className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-400"
            onClick={clearPlayground}
            disabled={messages.length === 0}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Chat area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <Bot className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-[14px] font-medium text-slate-600">
                  Test your agent
                </p>
                <p className="mt-1 max-w-[240px] text-[12px] text-slate-400">
                  {agentId
                    ? "Send a message to see how your agent responds with the current configuration."
                    : "Save your agent first to test it here."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Bot className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5",
                        msg.role === "user"
                          ? "bg-sage-500 text-white"
                          : "bg-slate-100 text-slate-900"
                      )}
                    >
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                        {msg.content}
                        {msg.isStreaming && (
                          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current" />
                        )}
                      </p>
                      {msg.tokenUsage && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMessage(msg);
                            setSidePanel("details");
                          }}
                          className={cn(
                            "mt-1.5 flex items-center gap-1.5 text-[10px]",
                            msg.role === "user"
                              ? "text-sage-100"
                              : "text-slate-400"
                          )}
                        >
                          <Zap className="h-2.5 w-2.5" />
                          {msg.tokenUsage.input + msg.tokenUsage.output} tokens
                        </button>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sage-50">
                        <UserIcon className="h-3.5 w-3.5 text-sage-600" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error banner */}
          {llmError && (
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-[12px] text-amber-700">{llmError}</p>
              <button
                type="button"
                onClick={() => setLlmError(null)}
                className="ml-auto text-[11px] font-medium text-amber-600 hover:text-amber-800"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Token usage bar */}
          {totalTokens.input + totalTokens.output > 0 && (
            <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-1.5 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Zap className="h-2.5 w-2.5" />
                {(totalTokens.input + totalTokens.output).toLocaleString()} total tokens
              </span>
              <span>In: {totalTokens.input.toLocaleString()}</span>
              <span>Out: {totalTokens.output.toLocaleString()}</span>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-slate-100 p-3">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  agentId
                    ? "Type a message..."
                    : "Save agent first to test..."
                }
                disabled={streaming || !agentId}
                className="h-10 text-[13px]"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || streaming || !agentId}
                className="h-10 w-10 shrink-0 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Side panel */}
        {sidePanel && (
          <div className="w-64 shrink-0 border-l border-slate-100 overflow-y-auto">
            <div className="p-4">
              {sidePanel === "prompt" && (
                <div className="space-y-3">
                  <h3 className="text-[12px] font-semibold text-slate-900">
                    System Prompt
                  </h3>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600">
                      {config.systemPrompt || "(No system prompt set)"}
                    </pre>
                  </div>
                </div>
              )}

              {sidePanel === "details" && selectedMessage && (
                <div className="space-y-3">
                  <h3 className="text-[12px] font-semibold text-slate-900">
                    Message Details
                  </h3>
                  {selectedMessage.tokenUsage && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Input tokens</span>
                        <span className="font-mono text-slate-700">
                          {selectedMessage.tokenUsage.input.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Output tokens</span>
                        <span className="font-mono text-slate-700">
                          {selectedMessage.tokenUsage.output.toLocaleString()}
                        </span>
                      </div>
                      {selectedMessage.latencyMs && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Latency</span>
                          <span className="font-mono text-slate-700">
                            {selectedMessage.latencyMs}ms
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {sidePanel === "variables" && (
                <div className="space-y-3">
                  <h3 className="text-[12px] font-semibold text-slate-900">
                    Test Variables
                  </h3>
                  {variables.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      No variables defined. Add variables in the config panel.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {variables.map((v) => (
                        <div key={v.id} className="space-y-1">
                          <Label className="text-[11px] text-slate-500">
                            {v.name || "Unnamed"}
                            <span className="ml-1 text-slate-400">({v.type})</span>
                          </Label>
                          <Input
                            value={testVariables[v.name] || ""}
                            onChange={(e) =>
                              setTestVariable(v.name, e.target.value)
                            }
                            placeholder={v.description || `Enter ${v.name}...`}
                            className="h-7 text-[11px]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
