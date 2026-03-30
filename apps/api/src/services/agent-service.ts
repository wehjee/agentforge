import { prisma } from "../lib/prisma";
import { NotFoundError } from "../utils/errors";
import type { AgentStatus, Prisma } from "@prisma/client";

interface ListAgentsParams {
  workspaceId: string;
  search?: string;
  status?: AgentStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function createAgent(data: {
  name: string;
  description?: string | null;
  tags?: string[];
  config: Record<string, unknown>;
  status?: AgentStatus;
  workspaceId: string;
  createdBy: string;
}) {
  const agent = await prisma.agent.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      tags: data.tags ?? [],
      config: data.config as Prisma.JsonObject,
      status: data.status ?? "DRAFT",
      workspaceId: data.workspaceId,
      createdBy: data.createdBy,
    },
  });

  await prisma.agentVersion.create({
    data: {
      version: 1,
      config: data.config as Prisma.JsonObject,
      changelog: "Initial version",
      agentId: agent.id,
      createdBy: data.createdBy,
    },
  });

  return agent;
}

export async function listAgents(params: ListAgentsParams) {
  const {
    workspaceId,
    search,
    status,
    page = 1,
    limit = 20,
    sortBy = "updatedAt",
    sortOrder = "desc",
  } = params;

  const where: Prisma.AgentWhereInput = {
    workspaceId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.agent.count({ where }),
  ]);

  return {
    data: agents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAgent(id: string, workspaceId: string) {
  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 5,
      },
    },
  });

  if (!agent) {
    throw new NotFoundError("Agent");
  }

  return agent;
}

export async function updateAgent(
  id: string,
  workspaceId: string,
  userId: string,
  data: {
    name?: string;
    description?: string | null;
    tags?: string[];
    config?: Record<string, unknown>;
    status?: AgentStatus;
    changelog?: string;
  }
) {
  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId },
  });

  if (!agent) {
    throw new NotFoundError("Agent");
  }

  const configChanged =
    data.config && JSON.stringify(data.config) !== JSON.stringify(agent.config);

  const updateData: Prisma.AgentUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.status !== undefined) updateData.status = data.status;

  if (data.config) {
    const existing = agent.config as Record<string, unknown>;
    const incoming = data.config;
    const merged = { ...existing, ...incoming };

    // Deep merge known nested objects to prevent accidental data loss
    if (existing.guardrails && incoming.guardrails) {
      merged.guardrails = {
        ...(existing.guardrails as Record<string, unknown>),
        ...(incoming.guardrails as Record<string, unknown>),
      };
    }
    if (existing.memory && incoming.memory) {
      merged.memory = {
        ...(existing.memory as Record<string, unknown>),
        ...(incoming.memory as Record<string, unknown>),
      };
    }

    updateData.config = merged as Prisma.JsonObject;
  }

  if (configChanged) {
    updateData.currentVersion = agent.currentVersion + 1;
  }

  const updated = await prisma.agent.update({
    where: { id },
    data: updateData,
  });

  if (configChanged) {
    await prisma.agentVersion.create({
      data: {
        version: updated.currentVersion,
        config: updated.config as Prisma.JsonObject,
        changelog: data.changelog ?? null,
        agentId: id,
        createdBy: userId,
      },
    });
  }

  return updated;
}

export async function deleteAgent(
  id: string,
  workspaceId: string,
  permanent: boolean = false
) {
  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId },
  });

  if (!agent) {
    throw new NotFoundError("Agent");
  }

  if (permanent) {
    await prisma.agentVersion.deleteMany({ where: { agentId: id } });
    await prisma.agent.delete({ where: { id } });
    return { deleted: true };
  }

  await prisma.agent.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  return { archived: true };
}
