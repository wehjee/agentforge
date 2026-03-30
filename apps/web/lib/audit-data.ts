export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  entityName: string;
  userId: string;
  userName: string;
  userEmail: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export type AuditAction =
  | "agent.created"
  | "agent.updated"
  | "agent.deployed"
  | "agent.deleted"
  | "member.invited"
  | "member.removed"
  | "member.role_changed"
  | "settings.changed"
  | "workflow.created"
  | "workflow.updated"
  | "knowledge.created"
  | "tool.created"
  | "secret.created"
  | "secret.deleted";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "agent.created": "Created agent",
  "agent.updated": "Updated agent",
  "agent.deployed": "Deployed agent",
  "agent.deleted": "Deleted agent",
  "member.invited": "Invited member",
  "member.removed": "Removed member",
  "member.role_changed": "Changed member role",
  "settings.changed": "Updated settings",
  "workflow.created": "Created workflow",
  "workflow.updated": "Updated workflow",
  "knowledge.created": "Created knowledge base",
  "tool.created": "Created tool",
  "secret.created": "Created secret",
  "secret.deleted": "Deleted secret",
};

export const AUDIT_ACTION_ICONS: Record<string, string> = {
  agent: "bot",
  member: "users",
  settings: "settings",
  workflow: "git-branch",
  knowledge: "book-open",
  tool: "wrench",
  secret: "key",
};

export function getMockAuditLog(): AuditLogEntry[] {
  const now = new Date();
  const entries: AuditLogEntry[] = [
    {
      id: "audit_1",
      action: "agent.deployed",
      entityType: "agent",
      entityId: "agent_1",
      entityName: "Customer Support Agent",
      userId: "user_1",
      userName: "Alice Chen",
      userEmail: "alice@company.com",
      metadata: { environment: "production", version: 3 },
      createdAt: new Date(now.getTime() - 1800000).toISOString(),
    },
    {
      id: "audit_2",
      action: "agent.updated",
      entityType: "agent",
      entityId: "agent_1",
      entityName: "Customer Support Agent",
      userId: "user_1",
      userName: "Alice Chen",
      userEmail: "alice@company.com",
      metadata: { fields: ["systemPrompt", "temperature"] },
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: "audit_3",
      action: "member.invited",
      entityType: "member",
      entityId: "user_4",
      entityName: "david@company.com",
      userId: "user_1",
      userName: "Alice Chen",
      userEmail: "alice@company.com",
      metadata: { role: "BUILDER" },
      createdAt: new Date(now.getTime() - 7200000).toISOString(),
    },
    {
      id: "audit_4",
      action: "workflow.created",
      entityType: "workflow",
      entityId: "wf_1",
      entityName: "Customer Onboarding",
      userId: "user_2",
      userName: "Bob Martinez",
      userEmail: "bob@company.com",
      metadata: null,
      createdAt: new Date(now.getTime() - 14400000).toISOString(),
    },
    {
      id: "audit_5",
      action: "knowledge.created",
      entityType: "knowledge",
      entityId: "kb_1",
      entityName: "Product Documentation",
      userId: "user_3",
      userName: "Carol Zhang",
      userEmail: "carol@company.com",
      metadata: { documentCount: 24 },
      createdAt: new Date(now.getTime() - 28800000).toISOString(),
    },
    {
      id: "audit_6",
      action: "agent.created",
      entityType: "agent",
      entityId: "agent_3",
      entityName: "Sales Qualification Bot",
      userId: "user_2",
      userName: "Bob Martinez",
      userEmail: "bob@company.com",
      metadata: null,
      createdAt: new Date(now.getTime() - 43200000).toISOString(),
    },
    {
      id: "audit_7",
      action: "settings.changed",
      entityType: "settings",
      entityId: null,
      entityName: "Workspace Settings",
      userId: "user_1",
      userName: "Alice Chen",
      userEmail: "alice@company.com",
      metadata: { field: "defaultModel", from: "claude-sonnet-4-20250514", to: "claude-opus-4-20250918" },
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: "audit_8",
      action: "member.role_changed",
      entityType: "member",
      entityId: "user_3",
      entityName: "Carol Zhang",
      userId: "user_1",
      userName: "Alice Chen",
      userEmail: "alice@company.com",
      metadata: { from: "BUILDER", to: "ADMIN" },
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
    {
      id: "audit_9",
      action: "tool.created",
      entityType: "tool",
      entityId: "tool_5",
      entityName: "Stripe Payment Lookup",
      userId: "user_2",
      userName: "Bob Martinez",
      userEmail: "bob@company.com",
      metadata: { type: "API" },
      createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
    },
    {
      id: "audit_10",
      action: "secret.created",
      entityType: "secret",
      entityId: "secret_2",
      entityName: "STRIPE_API_KEY",
      userId: "user_1",
      userName: "Alice Chen",
      userEmail: "alice@company.com",
      metadata: null,
      createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
    },
    {
      id: "audit_11",
      action: "agent.deleted",
      entityType: "agent",
      entityId: "agent_7",
      entityName: "Test Agent",
      userId: "user_2",
      userName: "Bob Martinez",
      userEmail: "bob@company.com",
      metadata: null,
      createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    },
    {
      id: "audit_12",
      action: "member.removed",
      entityType: "member",
      entityId: "user_6",
      entityName: "frank@company.com",
      userId: "user_1",
      userName: "Alice Chen",
      userEmail: "alice@company.com",
      metadata: { reason: "Left company" },
      createdAt: new Date(now.getTime() - 86400000 * 7).toISOString(),
    },
  ];

  return entries;
}
