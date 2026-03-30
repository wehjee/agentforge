export type WorkflowStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type RunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "PAUSED";

export type TriggerType = "webhook" | "schedule" | "manual" | "event";

export type NodeType =
  | "trigger"
  | "agent"
  | "router"
  | "conditional"
  | "parallel"
  | "human"
  | "transform"
  | "output";

export interface WorkflowNodeData {
  label: string;
  nodeType: NodeType;
  config: Record<string, unknown>;
}

export interface TriggerConfig {
  triggerType: TriggerType;
  cron?: string;
  webhookUrl?: string;
  eventName?: string;
}

export interface AgentNodeConfig {
  agentId: string;
  agentName?: string;
  inputMappings: Record<string, string>;
  outputMappings: Record<string, string>;
  retryCount: number;
  timeoutMs: number;
}

export interface RouterCondition {
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "regex" | "exists";
  value: string;
  targetHandle: string;
}

export interface RouterNodeConfig {
  mode: "rules" | "llm";
  conditions: RouterCondition[];
  llmPrompt?: string;
}

export interface ConditionalNodeConfig {
  expression: string;
  trueLabel?: string;
  falseLabel?: string;
}

export interface ParallelNodeConfig {
  mergeStrategy: "wait_all" | "wait_first";
  branches: string[];
}

export interface HumanNodeConfig {
  message: string;
  approvalButtons: { label: string; value: string }[];
  notifyEmail?: string;
}

export interface TransformNodeConfig {
  code: string;
  description?: string;
}

export interface OutputNodeConfig {
  outputType: "return" | "email" | "webhook" | "store";
  webhookUrl?: string;
  emailTo?: string;
  emailSubject?: string;
  storeKey?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  canvas: unknown;
  config: Record<string, unknown>;
  status: WorkflowStatus;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { runs: number };
}

export interface WorkflowRun {
  id: string;
  status: RunStatus;
  triggerType: string;
  triggerData: unknown;
  context: Record<string, unknown>;
  workflowId: string;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: RunStatus;
  input: unknown;
  output: unknown;
  tokenUsage: { input: number; output: number } | null;
  duration_ms: number | null;
  error: string | null;
  runId: string;
  startedAt: string;
  completedAt: string | null;
}
