import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import type { Prisma } from "@prisma/client";

/**
 * BullMQ job processor for scheduled agent runs.
 *
 * In production, this would be registered with BullMQ:
 *
 *   import { Worker } from "bullmq";
 *   const worker = new Worker("scheduled-agents", processScheduledAgent, { connection: redis });
 *
 * The scheduler would add jobs based on cron expressions:
 *
 *   import { Queue } from "bullmq";
 *   const queue = new Queue("scheduled-agents", { connection: redis });
 *   queue.add("run-agent", { jobId: "..." }, { repeat: { pattern: "0 9 * * *" } });
 */

interface ScheduledAgentJobData {
  jobId: string;
  agentId: string;
}

interface JobResult {
  success: boolean;
  output?: string;
  tokenUsage?: { inputTokens: number; outputTokens: number };
  error?: string;
  duration_ms: number;
}

export async function processScheduledAgent(
  data: ScheduledAgentJobData
): Promise<JobResult> {
  const startTime = Date.now();

  try {
    const job = await prisma.scheduledJob.findUnique({
      where: { id: data.jobId },
      include: { agent: true },
    });

    if (!job || !job.isActive) {
      return {
        success: false,
        error: "Job not found or inactive",
        duration_ms: Date.now() - startTime,
      };
    }

    const config = job.config as Record<string, unknown>;
    const inputVariables = (config.inputVariables as Record<string, string>) || {};

    // Build prompt from variables
    const agentConfig = job.agent.config as Record<string, unknown>;
    let systemPrompt = (agentConfig.systemPrompt as string) || "";

    for (const [key, value] of Object.entries(inputVariables)) {
      systemPrompt = systemPrompt.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, "g"),
        value
      );
    }

    // Run the agent
    const { streamChat } = await import("../services/llm-client");

    let fullResponse = "";
    let tokenUsage = { inputTokens: 0, outputTokens: 0 };

    await streamChat({
      model: (agentConfig.model as string) || "claude-sonnet-4-20250514",
      systemPrompt,
      messages: [
        {
          role: "user" as const,
          content:
            (config.prompt as string) ||
            "Execute your scheduled task and provide the results.",
        },
      ],
      maxTokens: (agentConfig.maxTokens as number) || 4096,
      temperature: (agentConfig.temperature as number) ?? 0.5,
      topP: (agentConfig.topP as number) ?? 1,
      callbacks: {
        onText: (text) => {
          fullResponse += text;
        },
        onDone: (usage) => {
          tokenUsage = usage || tokenUsage;
        },
        onError: (error) => {
          throw error;
        },
      },
    });

    // Route output based on config
    const outputRouting = config.outputRouting as string;

    if (outputRouting === "webhook" && config.webhookUrl) {
      try {
        await fetch(config.webhookUrl as string, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: data.agentId,
            jobId: data.jobId,
            output: fullResponse,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (err) {
        logger.error("Failed to send webhook:", err);
      }
    }

    // Always store result in database (conversation)
    await prisma.conversation.create({
      data: {
        channel: "SCHEDULED",
        status: "COMPLETED",
        agentId: data.agentId,
        metadata: {
          jobId: data.jobId,
          scheduledAt: new Date().toISOString(),
        },
        tokenUsage: tokenUsage as unknown as Prisma.InputJsonValue,
        messages: {
          create: [
            {
              role: "USER",
              content:
                (config.prompt as string) || "Scheduled execution",
            },
            {
              role: "ASSISTANT",
              content: fullResponse,
              tokenUsage: tokenUsage as unknown as Prisma.InputJsonValue,
              latencyMs: Date.now() - startTime,
            },
          ],
        },
      },
    });

    // Update job timestamps
    await prisma.scheduledJob.update({
      where: { id: data.jobId },
      data: { lastRunAt: new Date() },
    });

    logger.info(
      `Scheduled job ${data.jobId} completed in ${Date.now() - startTime}ms`
    );

    return {
      success: true,
      output: fullResponse,
      tokenUsage,
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Scheduled job ${data.jobId} failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      duration_ms: Date.now() - startTime,
    };
  }
}

/**
 * CRUD operations for scheduled jobs
 */
export async function createScheduledJob(params: {
  agentId: string;
  workspaceId: string;
  cronExpr: string;
  timezone?: string;
  config: Record<string, unknown>;
}) {
  const { agentId, workspaceId, cronExpr, timezone, config } = params;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, workspaceId },
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  return prisma.scheduledJob.create({
    data: {
      cronExpr,
      timezone: timezone || "UTC",
      config: config as unknown as Prisma.InputJsonValue,
      agentId,
    },
  });
}

export async function listScheduledJobs(agentId: string) {
  return prisma.scheduledJob.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateScheduledJob(
  id: string,
  data: {
    cronExpr?: string;
    timezone?: string;
    isActive?: boolean;
    config?: Record<string, unknown>;
  }
) {
  const updateData: Prisma.ScheduledJobUpdateInput = {};
  if (data.cronExpr) updateData.cronExpr = data.cronExpr;
  if (data.timezone) updateData.timezone = data.timezone;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.config) updateData.config = data.config as unknown as Prisma.InputJsonValue;
  return prisma.scheduledJob.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteScheduledJob(id: string) {
  return prisma.scheduledJob.delete({ where: { id } });
}
