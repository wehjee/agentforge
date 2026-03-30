import * as fs from "fs";
import * as path from "path";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

// ── Text extraction ──────────────────────────────────────────────────────

function extractTextFromTxt(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

function extractTextFromMd(buffer: Buffer): string {
  // Markdown is plain text — strip common syntax for cleaner chunks
  return buffer
    .toString("utf-8")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, ""))
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1");
}

function extractTextFromHtml(buffer: Buffer): string {
  const html = buffer.toString("utf-8");
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractTextFromCsv(buffer: Buffer): string {
  const text = buffer.toString("utf-8");
  const lines = text.split("\n");
  const headers = lines[0]?.split(",").map((h) => h.trim()) || [];

  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    return headers.map((h, i) => `${h}: ${(values[i] || "").trim()}`).join(", ");
  });

  return rows.join("\n");
}

function extractTextFromJson(buffer: Buffer): string {
  try {
    const data = JSON.parse(buffer.toString("utf-8"));
    return JSON.stringify(data, null, 2);
  } catch {
    return buffer.toString("utf-8");
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for pdf-parse (optional dependency)
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (err) {
    logger.warn("pdf-parse not available or failed, returning empty text:", err);
    return "[PDF parsing requires the pdf-parse package. Install with: pnpm add pdf-parse]";
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for mammoth (optional dependency)
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (err) {
    logger.warn("mammoth not available or failed, returning empty text:", err);
    return "[DOCX parsing requires the mammoth package. Install with: pnpm add mammoth]";
  }
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  switch (mimeType) {
    case "text/plain":
      return extractTextFromTxt(buffer);
    case "text/markdown":
      return extractTextFromMd(buffer);
    case "text/html":
      return extractTextFromHtml(buffer);
    case "text/csv":
      return extractTextFromCsv(buffer);
    case "application/json":
      return extractTextFromJson(buffer);
    case "application/pdf":
      return await extractTextFromPdf(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return await extractTextFromDocx(buffer);
    default:
      // Try as plain text
      return buffer.toString("utf-8");
  }
}

// ── Chunking ─────────────────────────────────────────────────────────────

interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  strategy: "fixed" | "paragraph" | "semantic";
}

interface TextChunk {
  content: string;
  metadata: {
    chunkIndex: number;
    startChar: number;
    endChar: number;
  };
}

function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

function chunkFixed(text: string, options: ChunkingOptions): TextChunk[] {
  const chunks: TextChunk[] = [];
  // Convert token-based sizes to approximate character counts
  const chunkSizeChars = options.chunkSize * 4;
  const overlapChars = options.chunkOverlap * 4;
  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = start + chunkSizeChars;

    // Try to break at sentence boundary
    if (end < text.length) {
      const searchEnd = Math.min(end + 200, text.length);
      const slice = text.slice(end - 100, searchEnd);
      const sentenceEnd = slice.search(/[.!?]\s/);
      if (sentenceEnd !== -1) {
        end = end - 100 + sentenceEnd + 2;
      }
    } else {
      end = text.length;
    }

    const content = text.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({
        content,
        metadata: { chunkIndex: index, startChar: start, endChar: end },
      });
      index++;
    }

    start = end - overlapChars;
    if (start <= (chunks[chunks.length - 1]?.metadata.startChar ?? -1)) {
      start = end;
    }
  }

  return chunks;
}

function chunkByParagraph(text: string, options: ChunkingOptions): TextChunk[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let startChar = 0;
  let chunkStartChar = 0;
  let index = 0;
  const maxChars = options.chunkSize * 4;

  for (const para of paragraphs) {
    const trimmed = para.trim();

    if (currentChunk.length + trimmed.length + 2 > maxChars && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { chunkIndex: index, startChar: chunkStartChar, endChar: startChar },
      });
      index++;

      // Overlap: keep last portion
      const overlapChars = options.chunkOverlap * 4;
      if (currentChunk.length > overlapChars) {
        currentChunk = currentChunk.slice(-overlapChars);
        chunkStartChar = startChar - overlapChars;
      } else {
        chunkStartChar = startChar;
      }
      currentChunk = currentChunk + "\n\n" + trimmed;
    } else {
      if (currentChunk.length === 0) {
        chunkStartChar = startChar;
      }
      currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + trimmed;
    }

    startChar += trimmed.length + 2;
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: { chunkIndex: index, startChar: chunkStartChar, endChar: startChar },
    });
  }

  return chunks;
}

function chunkSemantic(text: string, options: ChunkingOptions): TextChunk[] {
  // Semantic chunking: split at sentence boundaries, group sentences
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let startChar = 0;
  let chunkStartChar = 0;
  let index = 0;
  const maxChars = options.chunkSize * 4;

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChars && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { chunkIndex: index, startChar: chunkStartChar, endChar: startChar },
      });
      index++;

      const overlapChars = options.chunkOverlap * 4;
      if (currentChunk.length > overlapChars) {
        currentChunk = currentChunk.slice(-overlapChars);
        chunkStartChar = startChar - overlapChars;
      } else {
        chunkStartChar = startChar;
      }
    }

    if (currentChunk.length === 0) {
      chunkStartChar = startChar;
    }
    currentChunk += sentence;
    startChar += sentence.length;
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: { chunkIndex: index, startChar: chunkStartChar, endChar: startChar },
    });
  }

  return chunks;
}

export function chunkText(text: string, options: ChunkingOptions): TextChunk[] {
  switch (options.strategy) {
    case "paragraph":
      return chunkByParagraph(text, options);
    case "semantic":
      return chunkSemantic(text, options);
    case "fixed":
    default:
      return chunkFixed(text, options);
  }
}

// ── Simple embedding (TF-IDF / hash-based) ──────────────────────────────
// This is a placeholder approach. In production, use Anthropic Voyager
// or OpenAI embeddings. For now, we create a simple bag-of-words vector.

const EMBEDDING_DIM = 256;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

export function generateEmbedding(text: string): number[] {
  const embedding = new Array(EMBEDDING_DIM).fill(0);
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);

  for (const word of words) {
    const idx = Math.abs(hashString(word)) % EMBEDDING_DIM;
    embedding[idx] += 1;
  }

  // Normalize to unit vector
  const magnitude = Math.sqrt(embedding.reduce((sum: number, v: number) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      embedding[i] = embedding[i] / magnitude;
    }
  }

  return embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Document processing pipeline ─────────────────────────────────────────

export async function processDocument(documentId: string): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { knowledgeBase: true },
  });

  if (!doc) {
    logger.error(`Document ${documentId} not found`);
    return;
  }

  try {
    // Read file from storage
    const filePath = doc.storageKey;
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);

    // Step 1: Extract text
    const text = await extractText(buffer, doc.mimeType);
    if (!text || text.trim().length === 0) {
      throw new Error("No text could be extracted from the document");
    }

    // Step 2: Chunk text
    const kbConfig = doc.knowledgeBase.config as Record<string, unknown>;
    const chunkingConfig = (kbConfig.chunking as Record<string, unknown>) || {};
    const chunks = chunkText(text, {
      chunkSize: (chunkingConfig.chunkSize as number) || 512,
      chunkOverlap: (chunkingConfig.chunkOverlap as number) || 50,
      strategy: (chunkingConfig.strategy as "fixed" | "paragraph" | "semantic") || "fixed",
    });

    // Step 3: Generate embeddings and store chunks
    const chunkRecords = chunks.map((chunk) => ({
      content: chunk.content,
      metadata: JSON.parse(JSON.stringify(chunk.metadata)),
      embedding: generateEmbedding(chunk.content),
      tokenCount: estimateTokenCount(chunk.content),
      documentId: doc.id,
    }));

    // Delete existing chunks for this document (in case of reprocessing)
    await prisma.chunk.deleteMany({ where: { documentId: doc.id } });

    // Batch create chunks
    for (const record of chunkRecords) {
      await prisma.chunk.create({ data: record });
    }

    // Step 4: Update document status
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: "READY",
        chunkCount: chunkRecords.length,
      },
    });

    logger.info(`Document ${doc.filename} processed: ${chunkRecords.length} chunks created`);
  } catch (err) {
    logger.error(`Document processing failed for ${documentId}:`, err);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    });
  }
}

// ── MIME type detection ──────────────────────────────────────────────────

export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".html": "text/html",
    ".htm": "text/html",
    ".csv": "text/csv",
    ".json": "application/json",
  };
  return mimeMap[ext] || "application/octet-stream";
}

export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/html",
  "text/csv",
  "application/json",
];
