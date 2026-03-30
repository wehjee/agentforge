import { z } from "zod";

export const agentGuardrailsSchema = z.object({
  piiDetection: z.boolean().default(false),
  maxConversationTurns: z.number().int().min(1).max(200).default(50),
  blockedTopics: z.array(z.string()).default([]),
  escalationRules: z.string().default(""),
});

export const agentMemorySchema = z.object({
  type: z.literal("conversation").default("conversation"),
  maxMessages: z.number().int().min(1).max(100).default(20),
});

export const agentToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  icon: z.string(),
});

export const agentVariableSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["string", "number", "boolean"]),
  description: z.string(),
});

export const agentConfigSchema = z.object({
  model: z.string().min(1).default("claude-sonnet-4-20250514"),
  temperature: z.number().min(0).max(1).default(0.5),
  maxTokens: z.number().int().min(1).max(32768).default(4096),
  topP: z.number().min(0).max(1).default(1),
  systemPrompt: z.string().default(""),
  guardrails: agentGuardrailsSchema.default({}),
  memory: agentMemorySchema.default({}),
  tools: z.array(agentToolSchema).default([]),
  variables: z.array(agentVariableSchema).default([]),
  knowledgeBases: z.array(z.string()).default([]),
});

export const createAgentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  config: agentConfigSchema.default({}),
  status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  config: agentConfigSchema.partial().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  changelog: z.string().max(500).optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
