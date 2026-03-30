import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

// Slack OAuth2 configuration
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || "";
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || "";
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || "";
const SLACK_REDIRECT_URI =
  process.env.SLACK_REDIRECT_URI || "http://localhost:4000/api/v1/slack/oauth/callback";

export function getOAuthUrl(state: string): string {
  const scopes = [
    "app_mentions:read",
    "chat:write",
    "channels:history",
    "groups:history",
    "im:history",
    "mpim:history",
    "users:read",
  ].join(",");

  return `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}&state=${state}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  teamId: string;
  teamName: string;
  botUserId: string;
  appId: string;
}> {
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code,
      redirect_uri: SLACK_REDIRECT_URI,
    }),
  });

  const data = (await response.json()) as {
    ok: boolean;
    access_token: string;
    team: { id: string; name: string };
    bot_user_id: string;
    app_id: string;
    error?: string;
  };

  if (!data.ok) {
    throw new Error(`Slack OAuth failed: ${data.error}`);
  }

  return {
    accessToken: data.access_token,
    teamId: data.team.id,
    teamName: data.team.name,
    botUserId: data.bot_user_id,
    appId: data.app_id,
  };
}

export function verifySlackSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  if (!SLACK_SIGNING_SECRET) return false;

  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (parseInt(timestamp, 10) < fiveMinutesAgo) {
    return false; // Request too old
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = `v0=${crypto
    .createHmac("sha256", SLACK_SIGNING_SECRET)
    .update(sigBasestring)
    .digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
}

export async function sendSlackMessage(params: {
  token: string;
  channel: string;
  text: string;
  threadTs?: string;
  blocks?: unknown[];
}): Promise<{ ok: boolean; ts: string }> {
  const { token, channel, text, threadTs, blocks } = params;

  const body: Record<string, unknown> = { channel, text };
  if (threadTs) body.thread_ts = threadTs;
  if (blocks) body.blocks = blocks;

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as { ok: boolean; ts: string; error?: string };

  if (!data.ok) {
    logger.error(`Slack API error: ${data.error}`);
    throw new Error(`Failed to send Slack message: ${data.error}`);
  }

  return { ok: data.ok, ts: data.ts };
}

export function formatAgentResponseAsBlocks(
  agentName: string,
  response: string
): unknown[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: response,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Powered by *${agentName}* via AgentForge`,
        },
      ],
    },
  ];
}

export async function handleSlackEvent(event: {
  type: string;
  text?: string;
  channel: string;
  user: string;
  thread_ts?: string;
  ts: string;
  bot_id?: string;
}): Promise<{
  agentId: string | null;
  message: string;
  threadTs: string;
  channel: string;
} | null> {
  // Ignore bot messages to prevent loops
  if (event.bot_id) return null;

  // Find the deployment for this Slack channel
  const deployments = await prisma.deployment.findMany({
    where: {
      channel: "SLACK",
      isActive: true,
    },
    include: { agent: true },
  });

  // Find matching deployment by checking config for channel match
  for (const deployment of deployments) {
    const config = deployment.config as Record<string, unknown>;
    const channels = (config.channels as string[]) || [];

    if (channels.includes(event.channel) || channels.length === 0) {
      return {
        agentId: deployment.agentId,
        message: event.text || "",
        threadTs: event.thread_ts || event.ts,
        channel: event.channel,
      };
    }
  }

  return null;
}
