import { prisma } from "../lib/prisma";
import type { Channel, ConvStatus } from "@prisma/client";

interface OverviewMetrics {
  conversations: {
    total: number;
    active: number;
    completed: number;
    escalated: number;
  };
  messages: {
    total: number;
    avgPerConversation: number;
  };
  tokens: {
    totalInput: number;
    totalOutput: number;
    estimatedCost: number;
  };
  agents: {
    total: number;
    active: number;
    draft: number;
  };
}

interface ConversationFilters {
  workspaceId: string;
  agentId?: string;
  channel?: Channel;
  status?: ConvStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getOverviewMetrics(workspaceId: string): Promise<OverviewMetrics> {
  const agents = await prisma.agent.findMany({
    where: { workspaceId },
    select: { id: true, status: true },
  });

  const agentIds = agents.map((a) => a.id);

  const [conversations, messages] = await Promise.all([
    prisma.conversation.findMany({
      where: { agentId: { in: agentIds } },
      select: { id: true, status: true, tokenUsage: true },
    }),
    prisma.message.count({
      where: { conversation: { agentId: { in: agentIds } } },
    }),
  ]);

  let totalInput = 0;
  let totalOutput = 0;

  for (const conv of conversations) {
    const usage = conv.tokenUsage as Record<string, number> | null;
    if (usage) {
      totalInput += usage.inputTokens || usage.input || 0;
      totalOutput += usage.outputTokens || usage.output || 0;
    }
  }

  // Estimate cost: ~$3/1M input tokens, ~$15/1M output tokens (Sonnet pricing)
  const estimatedCost = (totalInput * 3 + totalOutput * 15) / 1_000_000;

  return {
    conversations: {
      total: conversations.length,
      active: conversations.filter((c) => c.status === "ACTIVE").length,
      completed: conversations.filter((c) => c.status === "COMPLETED").length,
      escalated: conversations.filter((c) => c.status === "ESCALATED").length,
    },
    messages: {
      total: messages,
      avgPerConversation: conversations.length > 0 ? Math.round(messages / conversations.length) : 0,
    },
    tokens: {
      totalInput,
      totalOutput,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
    },
    agents: {
      total: agents.length,
      active: agents.filter((a) => a.status === "ACTIVE").length,
      draft: agents.filter((a) => a.status === "DRAFT").length,
    },
  };
}

export async function getConversationLogs(filters: ConversationFilters) {
  const { workspaceId, agentId, channel, status, dateFrom, dateTo, search, page = 1, pageSize = 20 } = filters;

  const agents = await prisma.agent.findMany({
    where: { workspaceId },
    select: { id: true },
  });
  const agentIds = agents.map((a) => a.id);

  const where: Record<string, unknown> = {
    agentId: agentId ? agentId : { in: agentIds },
  };

  if (channel) where.channel = channel;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    };
  }

  const [total, conversations] = await Promise.all([
    prisma.conversation.count({ where: where as never }),
    prisma.conversation.findMany({
      where: where as never,
      include: {
        agent: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: "asc" }, take: 1, select: { content: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    data: conversations,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getConversationDetail(conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      agent: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return conversation;
}

export async function getTokenUsageBreakdown(workspaceId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const agents = await prisma.agent.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
  });
  const agentIds = agents.map((a) => a.id);

  const conversations = await prisma.conversation.findMany({
    where: {
      agentId: { in: agentIds },
      createdAt: { gte: since },
    },
    select: {
      agentId: true,
      tokenUsage: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const byDate: Record<string, { input: number; output: number; cost: number }> = {};
  for (const conv of conversations) {
    const date = conv.createdAt.toISOString().split("T")[0];
    if (!byDate[date]) byDate[date] = { input: 0, output: 0, cost: 0 };
    const usage = conv.tokenUsage as Record<string, number> | null;
    if (usage) {
      const inp = usage.inputTokens || usage.input || 0;
      const out = usage.outputTokens || usage.output || 0;
      byDate[date].input += inp;
      byDate[date].output += out;
      byDate[date].cost += (inp * 3 + out * 15) / 1_000_000;
    }
  }

  return {
    daily: Object.entries(byDate).map(([date, data]) => ({
      date,
      ...data,
      cost: Math.round(data.cost * 100) / 100,
    })),
    byAgent: agents.map((agent) => {
      const agentConvs = conversations.filter((c) => c.agentId === agent.id);
      let input = 0;
      let output = 0;
      for (const conv of agentConvs) {
        const usage = conv.tokenUsage as Record<string, number> | null;
        if (usage) {
          input += usage.inputTokens || usage.input || 0;
          output += usage.outputTokens || usage.output || 0;
        }
      }
      return { agentId: agent.id, agentName: agent.name, input, output };
    }),
  };
}
