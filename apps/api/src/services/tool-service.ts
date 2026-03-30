import { prisma } from "../lib/prisma";
import { NotFoundError } from "../utils/errors";
import type { ToolType, Prisma } from "@prisma/client";

interface ListToolsParams {
  workspaceId: string;
  search?: string;
  type?: ToolType;
  page?: number;
  limit?: number;
}

export async function createTool(data: {
  name: string;
  description: string;
  type: "API" | "CODE";
  schema: Record<string, unknown>;
  config: Record<string, unknown>;
  workspaceId: string;
}) {
  return prisma.tool.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      schema: data.schema as Prisma.JsonObject,
      config: data.config as Prisma.JsonObject,
      workspaceId: data.workspaceId,
    },
  });
}

export async function listTools(params: ListToolsParams) {
  const { workspaceId, search, type, page = 1, limit = 50 } = params;

  const where: Prisma.ToolWhereInput = {
    OR: [
      { workspaceId },
      { isPublic: true },
      { type: "BUILTIN" },
    ],
    ...(type && { type }),
    ...(search && {
      AND: {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      },
    }),
  };

  const [tools, total] = await Promise.all([
    prisma.tool.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tool.count({ where }),
  ]);

  return {
    data: tools,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTool(id: string, workspaceId: string) {
  const tool = await prisma.tool.findFirst({
    where: {
      id,
      OR: [
        { workspaceId },
        { isPublic: true },
        { type: "BUILTIN" },
      ],
    },
    include: {
      agents: {
        include: { agent: { select: { id: true, name: true } } },
      },
    },
  });

  if (!tool) throw new NotFoundError("Tool");
  return tool;
}

export async function updateTool(id: string, workspaceId: string, data: {
  name?: string;
  description?: string;
  schema?: Record<string, unknown>;
  config?: Record<string, unknown>;
}) {
  const tool = await prisma.tool.findFirst({
    where: { id, workspaceId },
  });

  if (!tool) throw new NotFoundError("Tool");
  if (tool.type === "BUILTIN") {
    throw new Error("Built-in tools cannot be modified");
  }

  const updateData: Prisma.ToolUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.schema) updateData.schema = data.schema as Prisma.JsonObject;
  if (data.config) updateData.config = { ...(tool.config as Record<string, unknown>), ...data.config } as Prisma.JsonObject;

  return prisma.tool.update({ where: { id }, data: updateData });
}

export async function deleteTool(id: string, workspaceId: string) {
  const tool = await prisma.tool.findFirst({
    where: { id, workspaceId },
  });

  if (!tool) throw new NotFoundError("Tool");
  if (tool.type === "BUILTIN") {
    throw new Error("Built-in tools cannot be deleted");
  }

  await prisma.agentTool.deleteMany({ where: { toolId: id } });
  await prisma.tool.delete({ where: { id } });
  return { deleted: true };
}

export async function seedBuiltinTools() {
  // Import built-in tool definitions
  const { BUILTIN_TOOL_DEFINITIONS } = await import("@shared/types");

  for (const def of BUILTIN_TOOL_DEFINITIONS) {
    const existing = await prisma.tool.findFirst({
      where: { name: def.name, type: "BUILTIN" },
    });

    if (!existing) {
      await prisma.tool.create({
        data: {
          name: def.name,
          description: def.description,
          type: "BUILTIN",
          schema: def.schema as unknown as Prisma.JsonObject,
          config: def.config as unknown as Prisma.JsonObject,
          isPublic: true,
        },
      });
    }
  }
}
