import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../utils/logger";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.warn("ANTHROPIC_API_KEY not set — LLM features disabled");
    return null;
  }

  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  return client;
}

export function isLLMAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export interface StreamCallbacks {
  onText: (text: string) => void;
  onToolUse?: (toolUse: { id: string; name: string; input: unknown }) => void;
  onToolResult?: (result: { toolUseId: string; content: unknown }) => void;
  onRetrievedChunks?: (chunks: Array<{ id: string; content: string; score: number; documentName?: string }>) => void;
  onDone: (usage: { inputTokens: number; outputTokens: number }) => void;
  onError: (error: Error) => void;
}

// ── Simple streaming (no tools) ──────────────────────────────────────────

export async function streamChat(params: {
  model: string;
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
  temperature: number;
  topP: number;
  callbacks: StreamCallbacks;
}): Promise<void> {
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    params.callbacks.onError(
      new Error("Anthropic API key not configured")
    );
    return;
  }

  try {
    const stream = anthropic.messages.stream({
      model: params.model,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      top_p: params.topP,
      system: params.systemPrompt || undefined,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    stream.on("text", (text) => {
      params.callbacks.onText(text);
    });

    const finalMessage = await stream.finalMessage();

    const usage = {
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
    };

    params.callbacks.onDone(usage);
  } catch (error) {
    logger.error("LLM stream error:", error);
    params.callbacks.onError(
      error instanceof Error ? error : new Error("Unknown LLM error")
    );
  }
}

// ── Streaming with tool use ──────────────────────────────────────────────

export async function streamChatWithTools(params: {
  model: string;
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
  temperature: number;
  topP: number;
  tools?: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>;
  onToolExecute?: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>;
  callbacks: StreamCallbacks;
}): Promise<void> {
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    params.callbacks.onError(new Error("Anthropic API key not configured"));
    return;
  }

  // If no tools, fall back to simple streaming
  if (!params.tools || params.tools.length === 0) {
    return streamChat({
      model: params.model,
      systemPrompt: params.systemPrompt,
      messages: params.messages,
      maxTokens: params.maxTokens,
      temperature: params.temperature,
      topP: params.topP,
      callbacks: params.callbacks,
    });
  }

  try {
    // Build the Anthropic messages in the proper format
    let anthropicMessages: Anthropic.MessageParam[] = params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Tool use loop: Claude may request multiple tool calls in sequence
    const MAX_TOOL_ROUNDS = 10;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic.messages.create({
        model: params.model,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        top_p: params.topP,
        system: params.systemPrompt || undefined,
        messages: anthropicMessages,
        tools: params.tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema as Anthropic.Tool.InputSchema,
        })),
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      // Process content blocks
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      let hasToolUse = false;

      for (const block of response.content) {
        if (block.type === "text") {
          params.callbacks.onText(block.text);
        } else if (block.type === "tool_use") {
          hasToolUse = true;

          // Notify about tool use
          params.callbacks.onToolUse?.({
            id: block.id,
            name: block.name,
            input: block.input,
          });

          // Execute the tool
          let toolOutput: unknown;
          if (params.onToolExecute) {
            try {
              toolOutput = await params.onToolExecute(block.name, block.input as Record<string, unknown>);
            } catch (err) {
              toolOutput = { error: err instanceof Error ? err.message : "Tool execution failed" };
            }
          } else {
            toolOutput = { error: "Tool execution not configured" };
          }

          // Notify about tool result
          params.callbacks.onToolResult?.({
            toolUseId: block.id,
            content: toolOutput,
          });

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: typeof toolOutput === "string" ? toolOutput : JSON.stringify(toolOutput),
          });
        }
      }

      // If no tool use, we're done
      if (!hasToolUse || response.stop_reason === "end_turn") {
        break;
      }

      // Continue the conversation with tool results
      anthropicMessages = [
        ...anthropicMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];
    }

    params.callbacks.onDone({
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    });
  } catch (error) {
    logger.error("LLM tool-use error:", error);
    params.callbacks.onError(
      error instanceof Error ? error : new Error("Unknown LLM error")
    );
  }
}
