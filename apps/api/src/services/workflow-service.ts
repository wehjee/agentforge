import { prisma } from "../lib/prisma";
import { NotFoundError } from "../utils/errors";
import type { AgentStatus, Prisma } from "@prisma/client";

interface ListWorkflowsParams {
  workspaceId: string;
  search?: string;
  status?: AgentStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function createWorkflow(data: {
  name: string;
  description?: string | null;
  canvas?: unknown;
  config?: Record<string, unknown>;
  status?: AgentStatus;
  workspaceId: string;
}) {
  const workflow = await prisma.workflow.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      canvas: (data.canvas ?? { nodes: [], edges: [] }) as Prisma.JsonObject,
      config: (data.config ?? {}) as Prisma.JsonObject,
      status: data.status ?? "DRAFT",
      workspaceId: data.workspaceId,
    },
  });

  return workflow;
}

export async function listWorkflows(params: ListWorkflowsParams) {
  const {
    workspaceId,
    search,
    status,
    page = 1,
    limit = 20,
    sortBy = "updatedAt",
    sortOrder = "desc",
  } = params;

  const where: Prisma.WorkflowWhereInput = {
    workspaceId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [workflows, total] = await Promise.all([
    prisma.workflow.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { runs: true } },
      },
    }),
    prisma.workflow.count({ where }),
  ]);

  return {
    data: workflows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getWorkflow(id: string, workspaceId: string) {
  const workflow = await prisma.workflow.findFirst({
    where: { id, workspaceId },
    include: {
      _count: { select: { runs: true } },
    },
  });

  if (!workflow) {
    throw new NotFoundError("Workflow");
  }

  return workflow;
}

export async function updateWorkflow(
  id: string,
  workspaceId: string,
  data: {
    name?: string;
    description?: string | null;
    canvas?: unknown;
    config?: Record<string, unknown>;
    status?: AgentStatus;
  }
) {
  const workflow = await prisma.workflow.findFirst({
    where: { id, workspaceId },
  });

  if (!workflow) {
    throw new NotFoundError("Workflow");
  }

  const updateData: Prisma.WorkflowUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.canvas !== undefined) updateData.canvas = data.canvas as Prisma.JsonObject;
  if (data.config !== undefined) updateData.config = data.config as Prisma.JsonObject;
  if (data.status !== undefined) updateData.status = data.status;

  const updated = await prisma.workflow.update({
    where: { id },
    data: updateData,
  });

  return updated;
}

export async function deleteWorkflow(
  id: string,
  workspaceId: string,
  permanent: boolean = false
) {
  const workflow = await prisma.workflow.findFirst({
    where: { id, workspaceId },
  });

  if (!workflow) {
    throw new NotFoundError("Workflow");
  }

  if (permanent) {
    await prisma.workflowStep.deleteMany({
      where: { run: { workflowId: id } },
    });
    await prisma.workflowRun.deleteMany({ where: { workflowId: id } });
    await prisma.workflow.delete({ where: { id } });
    return { deleted: true };
  }

  await prisma.workflow.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  return { archived: true };
}

export async function listWorkflowRuns(
  workflowId: string,
  workspaceId: string,
  page: number = 1,
  limit: number = 20
) {
  // Verify workflow belongs to workspace
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, workspaceId },
  });

  if (!workflow) {
    throw new NotFoundError("Workflow");
  }

  const [runs, total] = await Promise.all([
    prisma.workflowRun.findMany({
      where: { workflowId },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { steps: true } },
      },
    }),
    prisma.workflowRun.count({ where: { workflowId } }),
  ]);

  return {
    data: runs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getWorkflowRun(
  runId: string,
  workflowId: string,
  workspaceId: string
) {
  // Verify workflow belongs to workspace
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, workspaceId },
  });

  if (!workflow) {
    throw new NotFoundError("Workflow");
  }

  const run = await prisma.workflowRun.findFirst({
    where: { id: runId, workflowId },
    include: {
      steps: {
        orderBy: { startedAt: "asc" },
      },
    },
  });

  if (!run) {
    throw new NotFoundError("Workflow run");
  }

  return run;
}
