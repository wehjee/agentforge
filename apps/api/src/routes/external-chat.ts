import { Router, Request, Response, NextFunction } from "express";
import { requireApiAuth } from "../middleware/api-key-auth";
import { runAgent } from "../services/agent-runtime";
import { isLLMAvailable } from "../services/llm-client";
import { prisma } from "../lib/prisma";
import { NotFoundError, UnauthorizedError } from "../utils/errors";

const router = Router();

/**
 * POST /api/v1/agents/:agent_id/chat
 *
 * External chat endpoint with API key authentication.
 * Supports SSE streaming when stream=true in the body.
 */
router.post(
  "/:agent_id/chat",
  requireApiAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, conversation_id, variables, stream } = req.body;

      if (!message || typeof message !== "string") {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "message is required",
          },
        });
        return;
      }

      if (!isLLMAvailable()) {
        res.status(503).json({
          success: false,
          error: {
            code: "LLM_UNAVAILABLE",
            message: "LLM service is not configured",
          },
        });
        return;
      }

      // Verify the agent belongs to the workspace
      const agent = await prisma.agent.findFirst({
        where: {
          id: req.params.agent_id as string,
          workspaceId: req.workspaceId!,
        },
      });

      if (!agent) {
        throw new NotFoundError("Agent");
      }

      // Check if agent has an active API deployment
      const deployment = await prisma.deployment.findFirst({
        where: {
          agentId: agent.id,
          channel: "API",
          isActive: true,
        },
      });

      if (!deployment) {
        res.status(403).json({
          success: false,
          error: {
            code: "NOT_DEPLOYED",
            message: "This agent does not have an active API deployment",
          },
        });
        return;
      }

      if (stream) {
        // SSE streaming response
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        });

        const result = await runAgent({
          agentId: agent.id,
          workspaceId: req.workspaceId!,
          message,
          conversationId: conversation_id,
          variables,
          isPlayground: false,
          callbacks: {
            onText: (text) => {
              res.write(
                `data: ${JSON.stringify({ type: "text_delta", content: text })}\n\n`
              );
            },
            onToolUse: (toolUse) => {
              res.write(
                `data: ${JSON.stringify({ type: "tool_use", ...toolUse })}\n\n`
              );
            },
            onDone: (usage) => {
              res.write(
                `data: ${JSON.stringify({
                  type: "message_end",
                  usage,
                  conversation_id: result?.conversationId,
                })}\n\n`
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
      } else {
        // Non-streaming: collect full response
        let fullResponse = "";
        let totalUsage = { inputTokens: 0, outputTokens: 0 };
        let resultConversationId = conversation_id;

        const result = await runAgent({
          agentId: agent.id,
          workspaceId: req.workspaceId!,
          message,
          conversationId: conversation_id,
          variables,
          isPlayground: false,
          callbacks: {
            onText: (text) => {
              fullResponse += text;
            },
            onToolUse: () => {},
            onDone: (usage) => {
              totalUsage = usage || totalUsage;
              resultConversationId = result?.conversationId || conversation_id;
            },
            onError: (error) => {
              throw error;
            },
          },
        });

        res.json({
          success: true,
          data: {
            content: fullResponse,
            conversation_id: resultConversationId,
            usage: totalUsage,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;
