export type AgentStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface AgentGuardrails {
  piiDetection: boolean;
  maxConversationTurns: number;
  blockedTopics: string[];
  escalationRules: string;
}

export interface AgentMemory {
  type: "conversation";
  maxMessages: number;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
}

export interface AgentVariable {
  id: string;
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  guardrails: AgentGuardrails;
  memory: AgentMemory;
  tools: AgentTool[];
  variables: AgentVariable[];
  knowledgeBases: string[];
}

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  status: AgentStatus;
  config: AgentConfig;
  currentVersion: number;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  versions?: AgentVersion[];
}

export interface AgentVersion {
  id: string;
  version: number;
  config: AgentConfig;
  changelog: string | null;
  agentId: string;
  createdBy: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
  tokenUsage?: { input: number; output: number };
  latencyMs?: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  channel: string;
  status: string;
  metadata?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  agentId: string;
  messages: ChatMessage[];
  tokenUsage?: { input: number; output: number };
  createdAt: string;
  updatedAt: string;
}
