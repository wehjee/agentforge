export type DocStatus = "PROCESSING" | "READY" | "FAILED";

export interface ChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
  strategy: "fixed" | "paragraph" | "semantic";
}

export interface RetrievalConfig {
  topK: number;
  similarityThreshold: number;
  metadataFilter?: Record<string, unknown>;
}

export interface KBConfig {
  chunking: ChunkingConfig;
  retrieval: RetrievalConfig;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  config: KBConfig;
  workspaceId: string;
  documentCount?: number;
  chunkCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface KBDocument {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: DocStatus;
  storageKey: string;
  chunkCount: number;
  knowledgeBaseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface KBChunk {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  tokenCount: number;
  documentId: string;
  score?: number;
}

export interface RetrievalResult {
  chunks: Array<KBChunk & { score: number; documentName?: string }>;
  query: string;
  totalFound: number;
}
