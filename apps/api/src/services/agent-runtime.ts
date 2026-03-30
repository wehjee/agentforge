import { prisma } from "../lib/prisma";
import { streamChatWithTools, isLLMAvailable, type StreamCallbacks } from "./llm-client";
import { executeTool } from "./tool-executor";
import { queryMultipleKBs, formatChunksForContext } from "./rag-service";
import { NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";
import type { AgentConfig } from "@shared/types";

interface RunAgentParams {
  agentId: string;
  workspaceId: string;
  message: string;
  conversationId?: string;
  variables?: Record<string, unknown>;
  isPlayground?: boolean;
  callbacks: StreamCallbacks;
}

export async function runAgent(params: RunAgentParams) {
  const { agentId, workspaceId, message, conversationId, variables, isPlayground, callbacks } = params;

  if (!isLLMAvailable()) {
    callbacks.onError(new Error("ANTHROPIC_API_KEY_MISSING"));
    return;
  }

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, workspaceId },
    include: {
      agentTools: {
        include: { tool: true },
      },
      agentKBs: {
        include: { knowledgeBase: true },
      },
    },
  });

  if (!agent) {
    throw new NotFoundError("Agent");
  }

  const config = agent.config as unknown as AgentConfig;

  let systemPrompt = config.systemPrompt || "";

  // Inject variables into system prompt
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      systemPrompt = systemPrompt.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, "g"),
        String(value)
      );
    }
  }

  // ── RAG: Query attached knowledge bases ────────────────────────────────
  const kbIds = agent.agentKBs.map((akb) => akb.knowledgeBaseId);
  // Also check for KBs referenced in the legacy config.knowledgeBases array
  if (config.knowledgeBases?.length) {
    for (const kbId of config.knowledgeBases) {
      if (!kbIds.includes(kbId)) kbIds.push(kbId);
    }
  }

  let retrievedChunks: Array<{
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    tokenCount: number;
    documentId: string;
    documentName: string;
    score: number;
  }> = [];

  if (kbIds.length > 0) {
    try {
      retrievedChunks = await queryMultipleKBs({
        knowledgeBaseIds: kbIds,
        query: message,
        topK: 5,
        similarityThreshold: 0.3,
      });

      if (retrievedChunks.length > 0) {
        const contextBlock = formatChunksForContext(retrievedChunks);
        systemPrompt += contextBlock;

        // Notify client about retrieved chunks
        if (callbacks.onRetrievedChunks) {
          callbacks.onRetrievedChunks(retrievedChunks);
        }
      }
    } catch (err) {
      logger.warn("RAG retrieval failed, continuing without context:", err);
    }
  }

  // ── Load tools for Anthropic tool use ──────────────────────────────────
  const anthropicTools: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }> = [];

  // Map tool IDs to their full records for execution
  const toolMap = new Map<string, { type: string; config: Record<string, unknown>; originalId: string }>();

  // Add tools from agentTools relation
  for (const at of agent.agentTools) {
    const tool = at.tool;
    const toolName = tool.name.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_");
    anthropicTools.push({
      name: toolName,
      description: tool.description,
      input_schema: tool.schema as Record<string, unknown>,
    });
    toolMap.set(toolName, {
      type: tool.type,
      config: tool.config as Record<string, unknown>,
      originalId: tool.id,
    });
  }

  // Also check for legacy enabled tools in config
  if (config.tools?.length) {
    for (const t of config.tools) {
      if (t.enabled && !toolMap.has(t.id)) {
        // Look up built-in tool definition
        const builtinTool = await prisma.tool.findFirst({
          where: { type: "BUILTIN", name: t.name },
        });
        if (builtinTool) {
          const toolName = t.id;
          anthropicTools.push({
            name: toolName,
            description: builtinTool.description,
            input_schema: builtinTool.schema as Record<string, unknown>,
          });
          toolMap.set(toolName, {
            type: "BUILTIN",
            config: builtinTool.config as Record<string, unknown>,
            originalId: builtinTool.id,
          });
        }
      }
    }
  }

  // Build or load conversation
  let convRecord: { id: string; tokenUsage: unknown } | null = null;
  let existingMessages: Array<{ role: string; content: string }> = [];

  if (conversationId) {
    const found = await prisma.conversation.findFirst({
      where: { id: conversationId, agentId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: config.memory?.maxMessages || 20,
        },
      },
    });

    if (found) {
      convRecord = { id: found.id, tokenUsage: found.tokenUsage };
      existingMessages = found.messages.map((m) => ({
        role: m.role.toLowerCase(),
        content: m.content,
      }));
    }
  }

  if (!convRecord && !isPlayground) {
    const created = await prisma.conversation.create({
      data: {
        channel: "PLAYGROUND",
        status: "ACTIVE",
        agentId,
        variables: variables ? JSON.parse(JSON.stringify(variables)) : undefined,
      },
    });
    convRecord = { id: created.id, tokenUsage: created.tokenUsage };
  }

  const convId = convRecord?.id;

  // Store user message in DB (unless playground without persistence)
  if (convId && !isPlayground) {
    await prisma.message.create({
      data: {
        role: "USER",
        content: message,
        conversationId: convId,
        retrievedChunks: retrievedChunks.length > 0
          ? JSON.parse(JSON.stringify(retrievedChunks))
          : undefined,
      },
    });
  }

  // Build messages array
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const msg of existingMessages) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role as "user" | "assistant", content: msg.content });
    }
  }

  messages.push({ role: "user", content: message });

  // Track response for DB storage
  let fullResponse = "";
  const startTime = Date.now();
  const toolCallsLog: Array<{ name: string; input: Record<string, unknown>; output: Record<string, unknown> | string | null }> = [];

  // ── Tool execution handler ─────────────────────────────────────────────
  const handleToolExecution = async (toolName: string, toolInput: Record<string, unknown>) => {
    const toolInfo = toolMap.get(toolName);
    if (!toolInfo) {
      return { error: `Unknown tool: ${toolName}` };
    }

    const result = await executeTool({
      toolId: toolInfo.type === "BUILTIN" ? toolName : toolInfo.originalId,
      toolType: toolInfo.type as "BUILTIN" | "API" | "CODE",
      schema: {},
      config: toolInfo.config,
      input: toolInput,
    });

    toolCallsLog.push({
      name: toolName,
      input: toolInput,
      output: (result.output as Record<string, unknown>) || result.error || null,
    });

    if (result.success) {
      return result.output;
    } else {
      return { error: result.error };
    }
  };

  await streamChatWithTools({
    model: config.model,
    systemPrompt,
    messages,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    topP: config.topP ?? 1,
    tools: anthropicTools.length > 0 ? anthropicTools : undefined,
    onToolExecute: handleToolExecution,
    callbacks: {
      onText: (text) => {
        fullResponse += text;
        callbacks.onText(text);
      },
      onToolUse: (toolUse) => {
        callbacks.onToolUse?.(toolUse);
      },
      onToolResult: (result) => {
        callbacks.onToolResult?.(result);
      },
      onRetrievedChunks: callbacks.onRetrievedChunks,
      onDone: async (usage) => {
        const latencyMs = Date.now() - startTime;

        // Store assistant message in DB (unless playground)
        if (convId && !isPlayground) {
          await prisma.message.create({
            data: {
              role: "ASSISTANT",
              content: fullResponse,
              toolCalls: toolCallsLog.length > 0
                ? JSON.parse(JSON.stringify(toolCallsLog))
                : undefined,
              tokenUsage: { input: usage.inputTokens, output: usage.outputTokens },
              latencyMs,
              conversationId: convId,
            },
          });

          // Update conversation token usage
          const existingUsage = (convRecord?.tokenUsage as Record<string, number>) || {
            input: 0,
            output: 0,
          };
          await prisma.conversation.update({
            where: { id: convId },
            data: {
              tokenUsage: {
                input: (existingUsage.input || 0) + usage.inputTokens,
                output: (existingUsage.output || 0) + usage.outputTokens,
              },
            },
          });
        }

        callbacks.onDone({
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
        });
      },
      onError: (error) => {
        logger.error("Agent runtime error:", error);
        callbacks.onError(error);
      },
    },
  });

  return { conversationId: convId };
}
