import { z } from "zod";

export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  canvas: z.any().default({}),
  config: z.record(z.unknown()).default({}),
  status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  canvas: z.any().optional(),
  config: z.record(z.unknown()).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
});

export const triggerWorkflowSchema = z.object({
  triggerType: z.enum(["webhook", "schedule", "manual", "event"]).default("manual"),
  triggerData: z.record(z.unknown()).optional(),
  context: z.record(z.unknown()).optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type TriggerWorkflowInput = z.infer<typeof triggerWorkflowSchema>;
