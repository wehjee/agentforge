import { prisma } from "../lib/prisma";
import { NotFoundError, ValidationError } from "../utils/errors";
import type { Channel, Env, Prisma } from "@prisma/client";

export async function createDeployment(params: {
  agentId: string;
  workspaceId: string;
  channel: Channel;
  environment: Env;
  config: Record<string, unknown>;
}) {
  const { agentId, workspaceId, channel, environment, config } = params;

  // Verify agent belongs to workspace
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, workspaceId },
  });

  if (!agent) {
    throw new NotFoundError("Agent");
  }

  // Check if a deployment already exists for this channel + environment
  const existing = await prisma.deployment.findFirst({
    where: { agentId, channel, environment },
  });

  if (existing) {
    // Update existing deployment
    return prisma.deployment.update({
      where: { id: existing.id },
      data: {
        config: config as Prisma.JsonObject,
        agentVersion: agent.currentVersion,
        isActive: true,
      },
    });
  }

  return prisma.deployment.create({
    data: {
      channel,
      environment,
      config: config as Prisma.JsonObject,
      agentVersion: agent.currentVersion,
      agentId,
    },
  });
}

export async function listDeployments(agentId: string, workspaceId: string) {
  // Verify agent belongs to workspace
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, workspaceId },
  });

  if (!agent) {
    throw new NotFoundError("Agent");
  }

  return prisma.deployment.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateDeployment(
  deploymentId: string,
  workspaceId: string,
  data: { config?: Record<string, unknown>; isActive?: boolean }
) {
  const deployment = await prisma.deployment.findFirst({
    where: { id: deploymentId },
    include: { agent: true },
  });

  if (!deployment || deployment.agent.workspaceId !== workspaceId) {
    throw new NotFoundError("Deployment");
  }

  const updateData: Prisma.DeploymentUpdateInput = {};
  if (data.config !== undefined) {
    updateData.config = data.config as Prisma.JsonObject;
  }
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  return prisma.deployment.update({
    where: { id: deploymentId },
    data: updateData,
  });
}

export async function deactivateDeployment(
  deploymentId: string,
  workspaceId: string
) {
  const deployment = await prisma.deployment.findFirst({
    where: { id: deploymentId },
    include: { agent: true },
  });

  if (!deployment || deployment.agent.workspaceId !== workspaceId) {
    throw new NotFoundError("Deployment");
  }

  return prisma.deployment.update({
    where: { id: deploymentId },
    data: { isActive: false },
  });
}

export async function promoteVersion(params: {
  agentId: string;
  workspaceId: string;
  fromEnvironment: Env;
  toEnvironment: Env;
}) {
  const { agentId, workspaceId, fromEnvironment, toEnvironment } = params;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, workspaceId },
  });

  if (!agent) {
    throw new NotFoundError("Agent");
  }

  // Validate promotion path: DEV -> STAGING -> PROD
  const envOrder: Record<Env, number> = { DEV: 0, STAGING: 1, PROD: 2 };
  if (envOrder[toEnvironment] <= envOrder[fromEnvironment]) {
    throw new ValidationError(
      "Can only promote to a higher environment (DEV -> STAGING -> PROD)"
    );
  }

  // Find deployments in the source environment
  const sourceDeployments = await prisma.deployment.findMany({
    where: { agentId, environment: fromEnvironment, isActive: true },
  });

  if (sourceDeployments.length === 0) {
    throw new ValidationError(
      `No active deployments found in ${fromEnvironment} environment`
    );
  }

  // Create or update deployments in the target environment
  const promotedDeployments = [];
  for (const source of sourceDeployments) {
    const existing = await prisma.deployment.findFirst({
      where: {
        agentId,
        channel: source.channel,
        environment: toEnvironment,
      },
    });

    if (existing) {
      const updated = await prisma.deployment.update({
        where: { id: existing.id },
        data: {
          config: source.config as Prisma.JsonObject,
          agentVersion: source.agentVersion,
          isActive: true,
        },
      });
      promotedDeployments.push(updated);
    } else {
      const created = await prisma.deployment.create({
        data: {
          channel: source.channel,
          environment: toEnvironment,
          config: source.config as Prisma.JsonObject,
          agentVersion: source.agentVersion,
          agentId,
        },
      });
      promotedDeployments.push(created);
    }
  }

  return promotedDeployments;
}
