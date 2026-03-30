import { z } from "zod";

// ── Tool validation ──────────────────────────────────────────────────────

export const toolInputSchemaZ = z.object({
  type: z.literal("object"),
  properties: z.record(z.object({
    type: z.string(),
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
    default: z.unknown().optional(),
  })),
  required: z.array(z.string()).optional(),
});

export const toolConfigZ = z.object({
  url: z.string().optional(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional(),
  headers: z.record(z.string()).optional(),
  bodyTemplate: z.string().optional(),
  authType: z.enum(["none", "api_key", "bearer", "oauth2"]).optional(),
  authConfig: z.record(z.string()).optional(),
  code: z.string().optional(),
  language: z.enum(["javascript", "typescript"]).optional(),
  timeout_ms: z.number().int().min(100).max(120000).optional(),
  retry_count: z.number().int().min(0).max(5).optional(),
  requires_approval: z.boolean().optional(),
});

export const createToolSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  type: z.enum(["API", "CODE"]),
  schema: toolInputSchemaZ.default({ type: "object", properties: {} }),
  config: toolConfigZ.default({}),
});

export const updateToolSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  schema: toolInputSchemaZ.optional(),
  config: toolConfigZ.optional(),
});

export type CreateToolInput = z.infer<typeof createToolSchema>;
export type UpdateToolInput = z.infer<typeof updateToolSchema>;

// ── Knowledge Base validation ────────────────────────────────────────────

export const chunkingConfigZ = z.object({
  chunkSize: z.number().int().min(100).max(4000).default(512),
  chunkOverlap: z.number().int().min(0).max(500).default(50),
  strategy: z.enum(["fixed", "paragraph", "semantic"]).default("fixed"),
});

export const retrievalConfigZ = z.object({
  topK: z.number().int().min(1).max(50).default(5),
  similarityThreshold: z.number().min(0).max(1).default(0.5),
  metadataFilter: z.record(z.unknown()).optional(),
});

export const kbConfigZ = z.object({
  chunking: chunkingConfigZ.default({}),
  retrieval: retrievalConfigZ.default({}),
});

export const createKBSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  config: kbConfigZ.default({}),
});

export const updateKBSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  config: kbConfigZ.partial().optional(),
});

export type CreateKBInput = z.infer<typeof createKBSchema>;
export type UpdateKBInput = z.infer<typeof updateKBSchema>;
