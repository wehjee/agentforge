import * as fs from "fs";
import * as path from "path";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../utils/errors";
import { processDocument, getMimeType, SUPPORTED_MIME_TYPES } from "./document-processor";
import { logger } from "../utils/logger";
import type { Prisma } from "@prisma/client";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

interface ListKBParams {
  workspaceId: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function createKB(data: {
  name: string;
  description?: string | null;
  config?: Record<string, unknown>;
  workspaceId: string;
}) {
  const defaultConfig = {
    chunking: { chunkSize: 512, chunkOverlap: 50, strategy: "fixed" },
    retrieval: { topK: 5, similarityThreshold: 0.5 },
  };

  return prisma.knowledgeBase.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      config: (data.config || defaultConfig) as Prisma.JsonObject,
      workspaceId: data.workspaceId,
    },
  });
}

export async function listKBs(params: ListKBParams) {
  const { workspaceId, search, page = 1, limit = 50 } = params;

  const where: Prisma.KnowledgeBaseWhereInput = {
    workspaceId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [kbs, total] = await Promise.all([
    prisma.knowledgeBase.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { documents: true } },
        documents: {
          select: { chunkCount: true },
        },
      },
    }),
    prisma.knowledgeBase.count({ where }),
  ]);

  // Compute aggregated counts
  const data = kbs.map((kb) => ({
    ...kb,
    documentCount: kb._count.documents,
    chunkCount: kb.documents.reduce((sum, d) => sum + d.chunkCount, 0),
    documents: undefined,
    _count: undefined,
  }));

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getKB(id: string, workspaceId: string) {
  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, workspaceId },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
      },
      agents: {
        include: { agent: { select: { id: true, name: true } } },
      },
    },
  });

  if (!kb) throw new NotFoundError("Knowledge Base");

  const chunkCount = kb.documents.reduce((sum, d) => sum + d.chunkCount, 0);
  return { ...kb, chunkCount };
}

export async function updateKB(id: string, workspaceId: string, data: {
  name?: string;
  description?: string | null;
  config?: Record<string, unknown>;
}) {
  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, workspaceId },
  });

  if (!kb) throw new NotFoundError("Knowledge Base");

  const updateData: Prisma.KnowledgeBaseUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.config) {
    updateData.config = {
      ...(kb.config as Record<string, unknown>),
      ...data.config,
    } as Prisma.JsonObject;
  }

  return prisma.knowledgeBase.update({ where: { id }, data: updateData });
}

export async function deleteKB(id: string, workspaceId: string) {
  const kb = await prisma.knowledgeBase.findFirst({
    where: { id, workspaceId },
    include: { documents: true },
  });

  if (!kb) throw new NotFoundError("Knowledge Base");

  // Delete uploaded files
  for (const doc of kb.documents) {
    try {
      if (fs.existsSync(doc.storageKey)) {
        fs.unlinkSync(doc.storageKey);
      }
    } catch (err) {
      logger.warn(`Failed to delete file ${doc.storageKey}:`, err);
    }
  }

  await prisma.agentKnowledgeBase.deleteMany({ where: { knowledgeBaseId: id } });
  await prisma.knowledgeBase.delete({ where: { id } });
  return { deleted: true };
}

// ── Document management ──────────────────────────────────────────────────

export async function uploadDocument(params: {
  knowledgeBaseId: string;
  workspaceId: string;
  file: {
    originalname: string;
    buffer: Buffer;
    size: number;
    mimetype?: string;
  };
}) {
  const { knowledgeBaseId, workspaceId, file } = params;

  // Verify KB exists and belongs to workspace
  const kb = await prisma.knowledgeBase.findFirst({
    where: { id: knowledgeBaseId, workspaceId },
  });
  if (!kb) throw new NotFoundError("Knowledge Base");

  const mimeType = file.mimetype || getMimeType(file.originalname);
  if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Supported: ${SUPPORTED_MIME_TYPES.join(", ")}`);
  }

  // Save file to disk
  const kbDir = path.join(UPLOAD_DIR, knowledgeBaseId);
  if (!fs.existsSync(kbDir)) {
    fs.mkdirSync(kbDir, { recursive: true });
  }

  const safeFilename = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const storagePath = path.join(kbDir, safeFilename);
  fs.writeFileSync(storagePath, file.buffer);

  // Create document record
  const doc = await prisma.document.create({
    data: {
      filename: file.originalname,
      mimeType,
      sizeBytes: file.size,
      status: "PROCESSING",
      storageKey: storagePath,
      knowledgeBaseId,
    },
  });

  // Process document asynchronously
  processDocument(doc.id).catch((err) => {
    logger.error("Background document processing failed:", err);
  });

  return doc;
}

export async function listDocuments(knowledgeBaseId: string, workspaceId: string) {
  // Verify KB belongs to workspace
  const kb = await prisma.knowledgeBase.findFirst({
    where: { id: knowledgeBaseId, workspaceId },
  });
  if (!kb) throw new NotFoundError("Knowledge Base");

  return prisma.document.findMany({
    where: { knowledgeBaseId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteDocument(documentId: string, knowledgeBaseId: string, workspaceId: string) {
  const kb = await prisma.knowledgeBase.findFirst({
    where: { id: knowledgeBaseId, workspaceId },
  });
  if (!kb) throw new NotFoundError("Knowledge Base");

  const doc = await prisma.document.findFirst({
    where: { id: documentId, knowledgeBaseId },
  });
  if (!doc) throw new NotFoundError("Document");

  // Delete file from disk
  try {
    if (fs.existsSync(doc.storageKey)) {
      fs.unlinkSync(doc.storageKey);
    }
  } catch (err) {
    logger.warn(`Failed to delete file ${doc.storageKey}:`, err);
  }

  // Cascade deletes chunks automatically
  await prisma.document.delete({ where: { id: documentId } });
  return { deleted: true };
}

export async function getDocumentChunks(documentId: string, knowledgeBaseId: string, workspaceId: string) {
  const kb = await prisma.knowledgeBase.findFirst({
    where: { id: knowledgeBaseId, workspaceId },
  });
  if (!kb) throw new NotFoundError("Knowledge Base");

  return prisma.chunk.findMany({
    where: { documentId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      content: true,
      metadata: true,
      tokenCount: true,
      documentId: true,
    },
  });
}
