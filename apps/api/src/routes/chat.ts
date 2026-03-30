import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, requireWorkspace } from "../middleware/auth";
import { runAgent } from "../services/agent-runtime";
import { isLLMAvailable } from "../services/llm-client";
import { prisma } from "../lib/prisma";

const router = Router();

router.use(requireAuth, requireWorkspace);

// POST /api/v1/agents/:id/chat — Streaming SSE chat
router.post(
  "/:id/chat",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, conversationId, variables } = req.body;

      if (!message || typeof message !== "string") {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Message is required" },
        });
        return;
      }

      if (!isLLMAvailable()) {
        res.status(503).json({
          success: false,
          error: {
            code: "LLM_UNAVAILABLE",
            message: "Add your Anthropic API key in settings to test agents",
          },
        });
        return;
      }

      // Set SSE headers
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      const result = await runAgent({
        agentId: req.params.id as string,
        workspaceId: req.workspaceId!,
        message,
        conversationId,
        variables,
        isPlayground: false,
        callbacks: {
          onText: (text) => {
            res.write(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`);
          },
          onToolUse: (toolUse) => {
            res.write(
              `data: ${JSON.stringify({ type: "tool_use", ...toolUse })}\n\n`
            );
          },
          onDone: (usage) => {
            res.write(
              `data: ${JSON.stringify({ type: "done", usage, conversationId: result?.conversationId })}\n\n`
            );
            res.end();
          },
          onError: (error) => {
            res.write(
              `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
            );
            res.end();
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/agents/:id/test — Playground test (no persistence)
router.post(
  "/:id/test",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, messages: existingMessages, variables, config: overrideConfig } = req.body;

      if (!message || typeof message !== "string") {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Message is required" },
        });
        return;
      }

      if (!isLLMAvailable()) {
        res.status(503).json({
          success: false,
          error: {
            code: "LLM_UNAVAILABLE",
            message: "Add your Anthropic API key in settings to test agents",
          },
        });
        return;
      }

      // Set SSE headers
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      // For test mode, we may use override config or agent's saved config
      const agent = await prisma.agent.findFirst({
        where: { id: req.params.id as string, workspaceId: req.workspaceId! },
      });

      if (!agent) {
        res.write(
          `data: ${JSON.stringify({ type: "error", message: "Agent not found" })}\n\n`
        );
        res.end();
        return;
      }

      const config = overrideConfig || (agent.config as Record<string, unknown>);
      let systemPrompt = (config.systemPrompt as string) || "";

      // Inject variables
      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          systemPrompt = systemPrompt.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, "g"),
            String(value)
          );
        }
      }

      // Build messages from existing conversation + new message
      const msgs: Array<{ role: "user" | "assistant"; content: string }> = [];
      if (existingMessages && Array.isArray(existingMessages)) {
        for (const m of existingMessages) {
          if (m.role === "user" || m.role === "assistant") {
            msgs.push({ role: m.role, content: m.content });
          }
        }
      }
      msgs.push({ role: "user", content: message });

      const { streamChat } = await import("../services/llm-client");

      await streamChat({
        model: (config.model as string) || "claude-sonnet-4-20250514",
        systemPrompt,
        messages: msgs,
        maxTokens: (config.maxTokens as number) || 4096,
        temperature: (config.temperature as number) ?? 0.5,
        topP: (config.topP as number) ?? 1,
        callbacks: {
          onText: (text) => {
            res.write(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`);
          },
          onDone: (usage) => {
            res.write(`data: ${JSON.stringify({ type: "done", usage })}\n\n`);
            res.end();
          },
          onError: (error) => {
            res.write(
              `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
            );
            res.end();
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
