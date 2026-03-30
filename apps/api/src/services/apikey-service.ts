import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../utils/errors";

function generateApiKey(): string {
  const random = crypto.randomBytes(32).toString("hex");
  return `af_${random}`;
}

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function maskKey(key: string): string {
  if (key.length <= 8) return key;
  return `${key.slice(0, 5)}...${key.slice(-4)}`;
}

export async function createApiKey(params: {
  name: string;
  workspaceId: string;
}) {
  const { name, workspaceId } = params;

  const key = generateApiKey();
  const hashedKey = hashKey(key);

  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      key: maskKey(key),
      hashedKey,
      workspaceId,
    },
  });

  // Return the full key only on creation
  return {
    id: apiKey.id,
    name: apiKey.name,
    key, // full key, only available at creation time
    prefix: maskKey(key),
    lastUsedAt: null,
    workspaceId: apiKey.workspaceId,
    createdAt: apiKey.createdAt.toISOString(),
  };
}

export async function listApiKeys(workspaceId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.key, // already masked
    lastUsedAt: k.lastUsedAt?.toISOString() || null,
    workspaceId: k.workspaceId,
    createdAt: k.createdAt.toISOString(),
  }));
}

export async function revokeApiKey(id: string, workspaceId: string) {
  const key = await prisma.apiKey.findFirst({
    where: { id, workspaceId },
  });

  if (!key) {
    throw new NotFoundError("API Key");
  }

  await prisma.apiKey.delete({ where: { id } });
  return { id, revoked: true };
}

export async function validateApiKey(
  rawKey: string
): Promise<{ workspaceId: string } | null> {
  const hashedKey = hashKey(rawKey);

  const apiKey = await prisma.apiKey.findFirst({
    where: { hashedKey },
  });

  if (!apiKey) {
    return null;
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { workspaceId: apiKey.workspaceId };
}
