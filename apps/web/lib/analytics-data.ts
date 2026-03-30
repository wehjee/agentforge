// Mock data for analytics dashboard — will be replaced with real API calls

export interface AnalyticsOverview {
  conversations: {
    total: number;
    active: number;
    avgDuration: string;
    completionRate: number;
    trend: number;
  };
  messages: {
    total: number;
    avgPerConversation: number;
    trend: number;
  };
  tokens: {
    input: number;
    output: number;
    cost: number;
    trend: number;
  };
  performance: {
    p50: number;
    p95: number;
    p99: number;
    errorRate: number;
    trend: number;
  };
  tools: {
    totalCalls: number;
    successRate: number;
    trend: number;
  };
  knowledge: {
    hitRate: number;
    avgRelevanceScore: number;
    trend: number;
  };
}

export interface ConversationLog {
  id: string;
  agentId: string;
  agentName: string;
  channel: string;
  status: "active" | "completed" | "escalated" | "failed";
  messageCount: number;
  tokenUsage: { input: number; output: number };
  duration: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  agentId: string;
  agentName: string;
  channel: string;
  status: string;
  messages: ConversationMessage[];
  totalTokens: { input: number; output: number };
  totalCost: number;
  duration: string;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tokenUsage?: { input: number; output: number };
  latencyMs?: number;
  toolCalls?: ToolCallDetail[];
  createdAt: string;
}

export interface ToolCallDetail {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: "success" | "error";
  durationMs: number;
}

export interface TokenUsagePoint {
  date: string;
  input: number;
  output: number;
  cost: number;
}

export interface PerformancePoint {
  date: string;
  p50: number;
  p95: number;
  p99: number;
}

export interface ToolUsageStat {
  name: string;
  calls: number;
  successRate: number;
  avgLatency: number;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: ">" | "<" | ">=" | "<=";
  threshold: number;
  channel: "email" | "slack" | "webhook";
  enabled: boolean;
  createdAt: string;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: string;
  value: number;
  threshold: number;
  status: "triggered" | "resolved" | "acknowledged";
  createdAt: string;
}

// Mock data generators

export function getMockOverview(): AnalyticsOverview {
  return {
    conversations: {
      total: 12847,
      active: 23,
      avgDuration: "4m 32s",
      completionRate: 94.2,
      trend: 12.5,
    },
    messages: {
      total: 89432,
      avgPerConversation: 6.9,
      trend: 8.3,
    },
    tokens: {
      input: 24_500_000,
      output: 18_200_000,
      cost: 342.18,
      trend: -3.2,
    },
    performance: {
      p50: 820,
      p95: 2400,
      p99: 4100,
      errorRate: 1.8,
      trend: -5.1,
    },
    tools: {
      totalCalls: 34219,
      successRate: 97.3,
      trend: 2.1,
    },
    knowledge: {
      hitRate: 89.4,
      avgRelevanceScore: 0.82,
      trend: 1.4,
    },
  };
}

export function getMockTokenUsage(): TokenUsagePoint[] {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    const baseInput = 700000 + Math.random() * 200000;
    const baseOutput = 500000 + Math.random() * 150000;
    return {
      date: date.toISOString().split("T")[0],
      input: Math.round(baseInput),
      output: Math.round(baseOutput),
      cost: Math.round((baseInput * 0.000003 + baseOutput * 0.000015) * 100) / 100,
    };
  });
}

export function getMockPerformance(): PerformancePoint[] {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split("T")[0],
      p50: 600 + Math.round(Math.random() * 400),
      p95: 1800 + Math.round(Math.random() * 800),
      p99: 3200 + Math.round(Math.random() * 1500),
    };
  });
}

export function getMockToolUsage(): ToolUsageStat[] {
  return [
    { name: "order_lookup", calls: 8432, successRate: 98.1, avgLatency: 230 },
    { name: "knowledge_search", calls: 12890, successRate: 99.2, avgLatency: 180 },
    { name: "send_email", calls: 3210, successRate: 95.8, avgLatency: 450 },
    { name: "crm_lookup", calls: 5621, successRate: 97.5, avgLatency: 310 },
    { name: "calendar_booking", calls: 2130, successRate: 93.2, avgLatency: 520 },
    { name: "slack_notify", calls: 1936, successRate: 99.8, avgLatency: 120 },
  ];
}

const AGENT_NAMES = [
  "Customer Support Agent",
  "Sales Qualification Bot",
  "FAQ Bot",
  "Meeting Summarizer",
  "Email Drafter",
];

const CHANNELS = ["widget", "api", "slack", "web"];
const STATUSES: ConversationLog["status"][] = ["completed", "completed", "completed", "active", "escalated", "failed"];
const PREVIEWS = [
  "Hi, I need help with my recent order. The tracking number...",
  "I'm interested in your enterprise plan. Can you tell me...",
  "What are your business hours? I need to schedule a...",
  "The integration isn't working properly. I keep getting...",
  "Can you help me draft a follow-up email to the client...",
  "I'd like to cancel my subscription. The product doesn't...",
  "How do I reset my password? I've been locked out of...",
  "We're evaluating tools for our team of 200 people...",
];

export function getMockConversations(count = 20): ConversationLog[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const createdAt = new Date(now);
    createdAt.setHours(createdAt.getHours() - i * 2 - Math.random() * 5);
    const updatedAt = new Date(createdAt);
    updatedAt.setMinutes(updatedAt.getMinutes() + Math.round(Math.random() * 15 + 1));
    const msgs = Math.round(Math.random() * 12 + 2);
    const tokIn = msgs * (800 + Math.round(Math.random() * 400));
    const tokOut = msgs * (600 + Math.round(Math.random() * 300));

    return {
      id: `conv_${String(i + 1).padStart(4, "0")}`,
      agentId: `agent_${(i % 5) + 1}`,
      agentName: AGENT_NAMES[i % AGENT_NAMES.length],
      channel: CHANNELS[i % CHANNELS.length],
      status: STATUSES[i % STATUSES.length],
      messageCount: msgs,
      tokenUsage: { input: tokIn, output: tokOut },
      duration: `${Math.floor(Math.random() * 8 + 1)}m ${Math.floor(Math.random() * 59)}s`,
      preview: PREVIEWS[i % PREVIEWS.length],
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  });
}

export function getMockConversationDetail(id: string): ConversationDetail {
  return {
    id,
    agentId: "agent_1",
    agentName: "Customer Support Agent",
    channel: "widget",
    status: "completed",
    duration: "4m 12s",
    totalTokens: { input: 4820, output: 3650 },
    totalCost: 0.069,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      {
        id: "msg_1",
        role: "user",
        content: "Hi, I placed an order last week but haven't received any shipping updates. My order number is #ORD-4829.",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "msg_2",
        role: "assistant",
        content: "Hello! I'd be happy to help you check on your order status. Let me look up order #ORD-4829 for you right away.",
        tokenUsage: { input: 380, output: 120 },
        latencyMs: 890,
        toolCalls: [
          {
            id: "tc_1",
            name: "order_lookup",
            input: { orderId: "ORD-4829" },
            output: {
              orderId: "ORD-4829",
              status: "shipped",
              trackingNumber: "1Z999AA10123456784",
              carrier: "UPS",
              estimatedDelivery: "2026-04-01",
            },
            status: "success",
            durationMs: 230,
          },
        ],
        createdAt: new Date(Date.now() - 3540000).toISOString(),
      },
      {
        id: "msg_3",
        role: "assistant",
        content: "Great news! I found your order. It has been shipped via UPS with tracking number **1Z999AA10123456784**. The estimated delivery date is **April 1, 2026**.\n\nYou can track your package directly at ups.com with that tracking number. Is there anything else I can help you with?",
        tokenUsage: { input: 620, output: 280 },
        latencyMs: 1120,
        createdAt: new Date(Date.now() - 3480000).toISOString(),
      },
      {
        id: "msg_4",
        role: "user",
        content: "That's great, thank you! Can I change the delivery address? I'll be at a different location that day.",
        createdAt: new Date(Date.now() - 3300000).toISOString(),
      },
      {
        id: "msg_5",
        role: "assistant",
        content: "I understand you'd like to change the delivery address. Unfortunately, I'm not able to modify the delivery address directly once an order has shipped. However, I can suggest two options:\n\n1. **UPS My Choice**: You can sign up at ups.com to redirect your package to a different address or a UPS Access Point location.\n2. **Contact UPS directly**: Call 1-800-742-5877 with your tracking number to request an address change.\n\nWould you like me to help with anything else?",
        tokenUsage: { input: 850, output: 420 },
        latencyMs: 1450,
        createdAt: new Date(Date.now() - 3240000).toISOString(),
      },
      {
        id: "msg_6",
        role: "user",
        content: "That's helpful, I'll try UPS My Choice. Thanks for your help!",
        createdAt: new Date(Date.now() - 3100000).toISOString(),
      },
      {
        id: "msg_7",
        role: "assistant",
        content: "You're welcome! UPS My Choice is a great option — it's free to sign up and gives you control over your deliveries. If you run into any issues, don't hesitate to reach out again. Have a great day!",
        tokenUsage: { input: 520, output: 180 },
        latencyMs: 780,
        createdAt: new Date(Date.now() - 3060000).toISOString(),
      },
    ],
  };
}

export function getMockAlertRules(): AlertRule[] {
  return [
    {
      id: "alert_1",
      name: "High Error Rate",
      metric: "error_rate",
      operator: ">",
      threshold: 5,
      channel: "slack",
      enabled: true,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: "alert_2",
      name: "Response Time Spike",
      metric: "p95_latency",
      operator: ">",
      threshold: 5000,
      channel: "email",
      enabled: true,
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
    {
      id: "alert_3",
      name: "Daily Cost Limit",
      metric: "daily_cost",
      operator: ">",
      threshold: 50,
      channel: "slack",
      enabled: true,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: "alert_4",
      name: "Low Completion Rate",
      metric: "completion_rate",
      operator: "<",
      threshold: 80,
      channel: "webhook",
      enabled: false,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];
}

export function getMockAlertEvents(): AlertEvent[] {
  return [
    {
      id: "evt_1",
      ruleId: "alert_1",
      ruleName: "High Error Rate",
      metric: "error_rate",
      value: 7.2,
      threshold: 5,
      status: "resolved",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "evt_2",
      ruleId: "alert_2",
      ruleName: "Response Time Spike",
      metric: "p95_latency",
      value: 6800,
      threshold: 5000,
      status: "acknowledged",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "evt_3",
      ruleId: "alert_3",
      ruleName: "Daily Cost Limit",
      metric: "daily_cost",
      value: 52.4,
      threshold: 50,
      status: "triggered",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ];
}
