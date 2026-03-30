import { PrismaClient, AgentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BUILTIN_TOOLS = [
  {
    name: "Web Search",
    description: "Search the web for real-time information and data using a search query.",
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
    name: "Code Execution",
    description: "Execute JavaScript or Python code in a sandboxed environment and return the result.",
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
    name: "HTTP Request",
    description: "Make an HTTP request to any URL. Supports GET, POST, PUT, DELETE, and PATCH methods.",
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
    name: "Email Sender",
    description: "Send an email to a specified recipient with a subject and body.",
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
    name: "Database Query",
    description: "Execute a read-only SQL query against a configured database connection.",
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
    name: "File Operations",
    description: "Read or write files in the agent's storage. Supports text and JSON files.",
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
    name: "Calculator",
    description: "Evaluate mathematical expressions and perform calculations.",
    schema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Mathematical expression to evaluate" },
      },
      required: ["expression"],
    },
    config: { timeout_ms: 5000, retry_count: 0 },
  },
  {
    name: "Date & Time",
    description: "Get the current date/time, convert timezones, calculate date differences, and perform date math.",
    schema: {
      type: "object",
      properties: {
        operation: { type: "string", description: "Operation type", enum: ["now", "convert", "diff", "add"] },
        timezone: { type: "string", description: "Target timezone" },
        date: { type: "string", description: "Date string (ISO 8601)" },
        date2: { type: "string", description: "Second date for diff" },
        amount: { type: "number", description: "Amount for add" },
        unit: { type: "string", description: "Unit for add", enum: ["days", "hours", "minutes", "seconds"] },
      },
      required: ["operation"],
    },
    config: { timeout_ms: 5000, retry_count: 0 },
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@agentforge.dev" },
    update: {},
    create: {
      email: "admin@agentforge.dev",
      name: "Admin User",
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name: "Default Workspace",
      slug: "default",
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      role: "OWNER",
      userId: user.id,
      workspaceId: workspace.id,
    },
  });

  // Seed built-in tools
  for (const toolDef of BUILTIN_TOOLS) {
    const existing = await prisma.tool.findFirst({
      where: { name: toolDef.name, type: "BUILTIN" },
    });
    if (!existing) {
      await prisma.tool.create({
        data: {
          name: toolDef.name,
          description: toolDef.description,
          type: "BUILTIN",
          schema: toolDef.schema,
          config: toolDef.config,
          isPublic: true,
        },
      });
    }
  }

  const agents = [
    {
      name: "Customer Support Bot",
      description:
        "Handles customer inquiries about orders, returns, and general questions with a friendly, professional tone.",
      status: AgentStatus.ACTIVE,
      tags: ["support", "customer-facing"],
      config: {
        model: "claude-sonnet-4-20250514",
        temperature: 0.3,
        maxTokens: 4096,
        systemPrompt:
          "You are a helpful customer support agent. Be polite, professional, and concise.",
        guardrails: {
          piiDetection: true,
          maxConversationTurns: 50,
          blockedTopics: ["competitor pricing"],
        },
        memory: { type: "conversation", maxMessages: 20 },
      },
    },
    {
      name: "Content Writer",
      description:
        "Generates blog posts, social media content, and marketing copy based on brand guidelines and topic briefs.",
      status: AgentStatus.DRAFT,
      tags: ["content", "marketing"],
      config: {
        model: "claude-sonnet-4-20250514",
        temperature: 0.7,
        maxTokens: 8192,
        systemPrompt:
          "You are a creative content writer. Produce engaging, on-brand content that resonates with the target audience.",
        guardrails: {
          piiDetection: false,
          maxConversationTurns: 20,
          blockedTopics: [],
        },
        memory: { type: "conversation", maxMessages: 10 },
      },
    },
    {
      name: "Data Analyst",
      description:
        "Interprets datasets, generates summaries, and provides actionable insights from structured data inputs.",
      status: AgentStatus.ACTIVE,
      tags: ["analytics", "data"],
      config: {
        model: "claude-sonnet-4-20250514",
        temperature: 0.1,
        maxTokens: 4096,
        systemPrompt:
          "You are a data analyst. Provide clear, accurate analysis with actionable insights. Use numbers and evidence.",
        guardrails: {
          piiDetection: true,
          maxConversationTurns: 30,
          blockedTopics: [],
        },
        memory: { type: "conversation", maxMessages: 15 },
      },
    },
  ];

  for (const agentData of agents) {
    const existing = await prisma.agent.findFirst({
      where: { name: agentData.name, workspaceId: workspace.id },
    });

    if (!existing) {
      const agent = await prisma.agent.create({
        data: {
          name: agentData.name,
          description: agentData.description,
          status: agentData.status,
          config: agentData.config,
          tags: agentData.tags,
          workspaceId: workspace.id,
          createdBy: user.id,
        },
      });

      await prisma.agentVersion.create({
        data: {
          version: 1,
          config: agentData.config,
          changelog: "Initial version",
          agentId: agent.id,
          createdBy: user.id,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
