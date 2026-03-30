export type ToolType = "BUILTIN" | "API" | "CODE";

export interface ToolInputSchema {
  type: "object";
  properties: Record<string, {
    type: string;
    description?: string;
    enum?: string[];
    default?: unknown;
  }>;
  required?: string[];
}

export interface ToolConfig {
  // API tool config
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  bodyTemplate?: string;
  authType?: "none" | "api_key" | "bearer" | "oauth2";
  authConfig?: Record<string, string>;

  // Code tool config
  code?: string;
  language?: "javascript" | "typescript";

  // Execution config
  timeout_ms?: number;
  retry_count?: number;
  requires_approval?: boolean;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  schema: ToolInputSchema;
  config: ToolConfig;
  isPublic: boolean;
  workspaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ToolTestResult {
  success: boolean;
  output?: unknown;
  error?: string;
  durationMs: number;
}
