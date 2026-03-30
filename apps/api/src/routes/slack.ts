import { Router, Request, Response, NextFunction } from "express";
import {
  getOAuthUrl,
  exchangeCodeForToken,
  verifySlackSignature,
  handleSlackEvent,
  sendSlackMessage,
  formatAgentResponseAsBlocks,
} from "../services/slack-service";
import { runAgent } from "../services/agent-runtime";
import { logger } from "../utils/logger";
import crypto from "crypto";

const router = Router();

// GET /api/v1/slack/oauth/start — Begin Slack OAuth flow
router.get("/oauth/start", (req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString("hex");
  // In production, store state in session/redis for CSRF validation
  const url = getOAuthUrl(state);
  res.json({ success: true, data: { url, state } });
});

// GET /api/v1/slack/oauth/callback — Handle Slack OAuth callback
router.get(
  "/oauth/callback",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== "string") {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Missing code parameter" },
        });
        return;
      }

      const result = await exchangeCodeForToken(code);

      // Return the token data — the frontend will store it in the deployment config
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/slack/events — Slack Events API webhook
router.post(
  "/events",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // URL verification challenge
      if (req.body.type === "url_verification") {
        res.json({ challenge: req.body.challenge });
        return;
      }

      // Verify signature
      const signature = req.headers["x-slack-signature"] as string;
      const timestamp = req.headers["x-slack-request-timestamp"] as string;

      if (signature && timestamp) {
        const isValid = verifySlackSignature(
          signature,
          timestamp,
          JSON.stringify(req.body)
        );

        if (!isValid) {
          res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Invalid signature" },
          });
          return;
        }
      }

      // Respond immediately to Slack (3 second timeout requirement)
      res.status(200).json({ ok: true });

      // Process event asynchronously
      if (req.body.event) {
        const event = req.body.event;

        if (event.type === "message" || event.type === "app_mention") {
          const parsed = await handleSlackEvent(event);

          if (parsed && parsed.agentId) {
            try {
              // Get the deployment to find the bot token
              const { prisma } = await import("../lib/prisma");
              const deployment = await prisma.deployment.findFirst({
                where: {
                  agentId: parsed.agentId,
                  channel: "SLACK",
                  isActive: true,
                },
                include: { agent: true },
              });

              if (!deployment) return;

              const config = deployment.config as Record<string, unknown>;
              const botToken = config.botToken as string;

              if (!botToken) return;

              // Run the agent
              let fullResponse = "";

              await runAgent({
                agentId: parsed.agentId,
                workspaceId: deployment.agent.workspaceId,
                message: parsed.message,
                isPlayground: false,
                callbacks: {
                  onText: (text) => {
                    fullResponse += text;
                  },
                  onToolUse: () => {},
                  onDone: async () => {
                    // Send response back to Slack
                    const blocks = formatAgentResponseAsBlocks(
                      deployment.agent.name,
                      fullResponse
                    );

                    await sendSlackMessage({
                      token: botToken,
                      channel: parsed.channel,
                      text: fullResponse,
                      threadTs: parsed.threadTs,
                      blocks,
                    });
                  },
                  onError: async (error) => {
                    logger.error("Agent error in Slack handler:", error);
                    await sendSlackMessage({
                      token: botToken,
                      channel: parsed.channel,
                      text: "Sorry, I encountered an error processing your request.",
                      threadTs: parsed.threadTs,
                    });
                  },
                },
              });
            } catch (err) {
              logger.error("Failed to process Slack event:", err);
            }
          }
        }
      }
    } catch (error) {
      // Already responded 200 to Slack, log error
      logger.error("Slack events handler error:", error);
    }
  }
);

export default router;
