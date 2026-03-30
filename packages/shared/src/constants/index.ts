import type { AgentTool } from "../types/agent";
import type { ToolInputSchema, ToolConfig } from "../types/tool";
import type { KBConfig } from "../types/knowledge";

export const AGENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  BUILDER: "Builder",
  VIEWER: "Viewer",
};

export const PLAN_LABELS: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  TEAM: "Team",
  ENTERPRISE: "Enterprise",
};

export const MODEL_OPTIONS = [
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "claude-opus-4-20250918", label: "Claude Opus 4" },
] as const;

export const TEMPERATURE_PRESETS = [
  { value: 0.1, label: "Precise" },
  { value: 0.5, label: "Balanced" },
  { value: 0.9, label: "Creative" },
] as const;

export const BUILTIN_TOOLS: AgentTool[] = [
  {
    id: "web_search",
    name: "Web Search",
    description: "Search the web for real-time information and data",
    enabled: false,
    icon: "search",
  },
  {
    id: "code_execution",
    name: "Code Execution",
    description: "Execute code snippets in a sandboxed environment",
    enabled: false,
    icon: "code",
  },
  {
    id: "http_request",
    name: "HTTP Request",
    description: "Make HTTP requests to external APIs and services",
    enabled: false,
    icon: "globe",
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Perform mathematical calculations and conversions",
    enabled: false,
    icon: "calculator",
  },
  {
    id: "email_sender",
    name: "Email Sender",
    description: "Send emails to specified recipients",
    enabled: false,
    icon: "mail",
  },
];

export const DEFAULT_AGENT_CONFIG = {
  model: "claude-sonnet-4-20250514",
  temperature: 0.5,
  maxTokens: 4096,
  topP: 1,
  systemPrompt: "",
  guardrails: {
    piiDetection: false,
    maxConversationTurns: 50,
    blockedTopics: [] as string[],
    escalationRules: "",
  },
  memory: {
    type: "conversation" as const,
    maxMessages: 20,
  },
  tools: [] as AgentTool[],
  variables: [] as { id: string; name: string; type: "string" | "number" | "boolean"; description: string }[],
  knowledgeBases: [] as string[],
};

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
};

// ── Built-in Tool Definitions (full schema for the tool library) ─────────

export interface BuiltinToolDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  schema: ToolInputSchema;
  config: ToolConfig;
}

export const BUILTIN_TOOL_DEFINITIONS: BuiltinToolDef[] = [
  {
    id: "web_search",
    name: "Web Search",
    description: "Search the web for real-time information and data using a search query.",
    icon: "search",
    category: "Data",
    schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
        num_results: { type: "number", description: "Number of results to return (1-10)", default: 5 },
      },
      required: ["query"],
    },
    config: { timeout_ms: 10000, retry_count: 1 },
  },
  {
    id: "code_execution",
    name: "Code Execution",
    description: "Execute JavaScript or Python code in a sandboxed environment and return the result.",
    icon: "code",
    category: "Compute",
    schema: {
      type: "object",
      properties: {
        code: { type: "string", description: "The code to execute" },
        language: { type: "string", description: "Programming language", enum: ["javascript", "python"] },
      },
      required: ["code", "language"],
    },
    config: { timeout_ms: 30000, retry_count: 0 },
  },
  {
    id: "http_request",
    name: "HTTP Request",
    description: "Make an HTTP request to any URL. Supports GET, POST, PUT, DELETE, and PATCH methods.",
    icon: "globe",
    category: "Integration",
    schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL to request" },
        method: { type: "string", description: "HTTP method", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
        headers: { type: "string", description: "JSON string of headers" },
        body: { type: "string", description: "Request body (for POST/PUT/PATCH)" },
      },
      required: ["url", "method"],
    },
    config: { timeout_ms: 30000, retry_count: 1 },
  },
  {
    id: "email_sender",
    name: "Email Sender",
    description: "Send an email to a specified recipient with a subject and body.",
    icon: "mail",
    category: "Communication",
    schema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body (plain text or HTML)" },
      },
      required: ["to", "subject", "body"],
    },
    config: { timeout_ms: 10000, retry_count: 2, requires_approval: true },
  },
  {
    id: "database_query",
    name: "Database Query",
    description: "Execute a read-only SQL query against a configured database connection.",
    icon: "database",
    category: "Data",
    schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The SQL query to execute (SELECT only)" },
        connection_id: { type: "string", description: "The database connection identifier" },
      },
      required: ["query"],
    },
    config: { timeout_ms: 15000, retry_count: 0 },
  },
  {
    id: "file_operations",
    name: "File Operations",
    description: "Read or write files in the agent's storage. Supports text and JSON files.",
    icon: "file-text",
    category: "Storage",
    schema: {
      type: "object",
      properties: {
        operation: { type: "string", description: "Operation type", enum: ["read", "write", "list"] },
        path: { type: "string", description: "File path" },
        content: { type: "string", description: "File content (for write operation)" },
      },
      required: ["operation", "path"],
    },
    config: { timeout_ms: 5000, retry_count: 0 },
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Evaluate mathematical expressions and perform calculations. Supports basic arithmetic, trigonometry, and more.",
    icon: "calculator",
    category: "Compute",
    schema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Mathematical expression to evaluate (e.g. '2 + 2', 'sin(pi/2)', 'sqrt(144)')" },
      },
      required: ["expression"],
    },
    config: { timeout_ms: 5000, retry_count: 0 },
  },
  {
    id: "date_time",
    name: "Date & Time",
    description: "Get the current date/time, convert timezones, calculate date differences, and perform date math.",
    icon: "clock",
    category: "Utility",
    schema: {
      type: "object",
      properties: {
        operation: { type: "string", description: "Operation type", enum: ["now", "convert", "diff", "add"] },
        timezone: { type: "string", description: "Target timezone (e.g. 'America/New_York', 'UTC')" },
        date: { type: "string", description: "Date string (ISO 8601 format)" },
        date2: { type: "string", description: "Second date for diff operation" },
        amount: { type: "number", description: "Amount to add (for add operation)" },
        unit: { type: "string", description: "Unit for add operation", enum: ["days", "hours", "minutes", "seconds"] },
      },
      required: ["operation"],
    },
    config: { timeout_ms: 5000, retry_count: 0 },
  },
];

// ── Default KB Config ────────────────────────────────────────────────────

export const DEFAULT_KB_CONFIG: KBConfig = {
  chunking: {
    chunkSize: 512,
    chunkOverlap: 50,
    strategy: "fixed",
  },
  retrieval: {
    topK: 5,
    similarityThreshold: 0.5,
  },
};
