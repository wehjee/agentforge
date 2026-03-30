import { prisma } from "../lib/prisma";
import { generateEmbedding, cosineSimilarity } from "./document-processor";
import { logger } from "../utils/logger";

interface RetrievalParams {
  knowledgeBaseId: string;
  query: string;
  topK?: number;
  similarityThreshold?: number;
  metadataFilter?: Record<string, unknown>;
}

interface RetrievedChunk {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  tokenCount: number;
  documentId: string;
  documentName: string;
  score: number;
}

export async function queryKnowledgeBase(params: RetrievalParams): Promise<RetrievedChunk[]> {
  const {
    knowledgeBaseId,
    query,
    topK = 5,
    similarityThreshold = 0.3,
  } = params;

  // Get all chunks for this KB (with their embeddings)
  const documents = await prisma.document.findMany({
    where: {
      knowledgeBaseId,
      status: "READY",
    },
    include: {
      chunks: true,
    },
  });

  if (documents.length === 0) {
    return [];
  }

  // Generate embedding for the query
  const queryEmbedding = generateEmbedding(query);

  // Score all chunks
  const scoredChunks: RetrievedChunk[] = [];

  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      const chunkEmbedding = chunk.embedding as number[] | null;
      if (!chunkEmbedding || !Array.isArray(chunkEmbedding)) {
        continue;
      }

      const score = cosineSimilarity(queryEmbedding, chunkEmbedding);

      if (score >= similarityThreshold) {
        scoredChunks.push({
          id: chunk.id,
          content: chunk.content,
          metadata: chunk.metadata as Record<string, unknown>,
          tokenCount: chunk.tokenCount,
          documentId: doc.id,
          documentName: doc.filename,
          score,
        });
      }
    }
  }

  // Sort by score descending and take top K
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK);
}

export async function queryMultipleKBs(params: {
  knowledgeBaseIds: string[];
  query: string;
  topK?: number;
  similarityThreshold?: number;
}): Promise<RetrievedChunk[]> {
  const allChunks: RetrievedChunk[] = [];

  for (const kbId of params.knowledgeBaseIds) {
    const chunks = await queryKnowledgeBase({
      knowledgeBaseId: kbId,
      query: params.query,
      topK: params.topK || 5,
      similarityThreshold: params.similarityThreshold || 0.3,
    });
    allChunks.push(...chunks);
  }

  // Re-sort all chunks by score and take top K overall
  allChunks.sort((a, b) => b.score - a.score);
  return allChunks.slice(0, params.topK || 5);
}

export function formatChunksForContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";

  const lines = chunks.map((chunk, i) =>
    `[Source ${i + 1}: ${chunk.documentName} (relevance: ${(chunk.score * 100).toFixed(0)}%)]\n${chunk.content}`
  );

  return `\n\n--- Retrieved Knowledge ---\n${lines.join("\n\n")}\n--- End of Retrieved Knowledge ---\n`;
}
