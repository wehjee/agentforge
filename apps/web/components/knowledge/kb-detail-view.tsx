"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Search,
  BookOpen,
  FileText,
  Box,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiFetch } from "@/lib/api";
import type { KBDocument, KBChunk } from "@shared/types";

const DOC_STATUS_STYLES: Record<string, { icon: React.ReactNode; color: string }> = {
  PROCESSING: { icon: <Clock className="h-3.5 w-3.5 animate-spin" />, color: "text-amber-600 bg-amber-50 border-amber-200" },
  READY: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: "text-sage-600 bg-sage-50 border-sage-100" },
  FAILED: { icon: <XCircle className="h-3.5 w-3.5" />, color: "text-red-600 bg-red-50 border-red-200" },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getScoreColor(score: number): string {
  if (score >= 0.7) return "text-sage-600 bg-sage-50 border-sage-100";
  if (score >= 0.4) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

export function KBDetailView({ kbId }: { kbId: string }) {
  const router = useRouter();
  const [kb, setKB] = useState<any>(null);
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Chunk viewer state
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<KBChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Retrieval tester state
  const [query, setQuery] = useState("");
  const [retrievalResults, setRetrievalResults] = useState<any>(null);
  const [querying, setQuerying] = useState(false);

  const loadKB = useCallback(async () => {
    try {
      const res = await apiFetch<any>(`/knowledge/${kbId}`);
      setKB((res as any).data);
    } catch {
      // not found
    }
  }, [kbId]);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await apiFetch<KBDocument[]>(`/knowledge/${kbId}/documents`);
      setDocuments((res as any).data || []);
    } catch {
      setDocuments([]);
    }
  }, [kbId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadKB(), loadDocuments()]);
      setLoading(false);
    }
    init();
  }, [loadKB, loadDocuments]);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      const content = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // Remove data:... prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await apiFetch(`/knowledge/${kbId}/documents`, {
        method: "POST",
        body: JSON.stringify({ filename: file.name, content }),
      });

      await loadDocuments();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }, [kbId, loadDocuments]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }, [uploadFile]);

  const handleDeleteDoc = useCallback(async (docId: string) => {
    try {
      await apiFetch(`/knowledge/${kbId}/documents/${docId}`, { method: "DELETE" });
      await loadDocuments();
      if (selectedDocId === docId) {
        setSelectedDocId(null);
        setChunks([]);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, [kbId, loadDocuments, selectedDocId]);

  const handleDeleteKB = useCallback(async () => {
    setDeleting(true);
    try {
      await apiFetch(`/knowledge/${kbId}`, { method: "DELETE" });
      router.push("/knowledge");
    } catch {
      setDeleting(false);
    }
  }, [kbId, router]);

  const loadChunks = useCallback(async (docId: string) => {
    if (selectedDocId === docId) {
      setSelectedDocId(null);
      setChunks([]);
      return;
    }
    setSelectedDocId(docId);
    setLoadingChunks(true);
    try {
      const res = await apiFetch<KBChunk[]>(`/knowledge/${kbId}/documents/${docId}/chunks`);
      setChunks((res as any).data || []);
    } catch {
      setChunks([]);
    } finally {
      setLoadingChunks(false);
    }
  }, [kbId, selectedDocId]);

  const handleQuery = useCallback(async () => {
    if (!query.trim()) return;
    setQuerying(true);
    setRetrievalResults(null);
    try {
      const res = await apiFetch<any>(`/knowledge/${kbId}/query`, {
        method: "POST",
        body: JSON.stringify({ query: query.trim() }),
      });
      setRetrievalResults((res as any).data);
    } catch (err) {
      console.error("Query failed:", err);
    } finally {
      setQuerying(false);
    }
  }, [kbId, query]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (!kb) {
    return (
      <div className="text-center py-20">
        <p className="text-[14px] text-slate-500">Knowledge base not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/knowledge")}>
          Back to Knowledge Bases
        </Button>
      </div>
    );
  }

  const config = kb.config as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/knowledge")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-[22px] font-medium tracking-[-0.01em] text-slate-900">
            {kb.name}
          </h1>
          {kb.description && <p className="text-[13px] text-slate-500">{kb.description}</p>}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this knowledge base?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{kb.name}" and all its documents and chunks. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteKB} className="bg-red-600 hover:bg-red-700" disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-xl border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <FileText className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[22px] font-semibold text-slate-900">{documents.length}</p>
                <p className="text-[12px] text-slate-400">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <Box className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[22px] font-semibold text-slate-900">{kb.chunkCount || 0}</p>
                <p className="text-[12px] text-slate-400">Chunks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[22px] font-semibold text-slate-900">{config?.retrieval?.topK || 5}</p>
                <p className="text-[12px] text-slate-400">Top-K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents" className="text-[13px]">Documents</TabsTrigger>
          <TabsTrigger value="retrieval" className="text-[13px]">Test Retrieval</TabsTrigger>
          <TabsTrigger value="config" className="text-[13px]">Configuration</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {/* Upload zone */}
          <div
            className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? "border-sage-400 bg-sage-50/50"
                : "border-slate-200 bg-slate-50/30 hover:border-slate-300"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-sage-500" />
                <p className="text-[13px] text-slate-600">Uploading and processing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-slate-400" />
                <p className="text-[13px] text-slate-600">
                  Drag and drop a file here, or{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sage-600 underline underline-offset-2 hover:text-sage-600"
                  >
                    browse
                  </button>
                </p>
                <p className="text-[11px] text-slate-400">
                  PDF, DOCX, TXT, MD, HTML, CSV, JSON
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,.md,.html,.htm,.csv,.json"
              onChange={handleFileSelect}
            />
          </div>

          {/* Document list */}
          <div className="space-y-2">
            {documents.map((doc) => {
              const status = DOC_STATUS_STYLES[doc.status] || DOC_STATUS_STYLES.PROCESSING;
              const isExpanded = selectedDocId === doc.id;

              return (
                <div key={doc.id}>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50/50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-900 truncate">
                        {doc.filename}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-slate-400">{formatBytes(doc.sizeBytes)}</span>
                        <span className="text-[11px] text-slate-400">{doc.chunkCount} chunks</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`gap-1 ${status.color}`}>
                      {status.icon}
                      <span className="text-[11px]">{doc.status}</span>
                    </Badge>
                    {doc.status === "READY" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-[11px] text-slate-500"
                        onClick={() => loadChunks(doc.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        Chunks
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-500"
                      onClick={() => handleDeleteDoc(doc.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Expanded chunk list */}
                  {isExpanded && (
                    <div className="ml-12 mt-1 mb-2 space-y-1.5 max-h-80 overflow-y-auto">
                      {loadingChunks ? (
                        <div className="py-4 text-center">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                        </div>
                      ) : chunks.length === 0 ? (
                        <p className="py-4 text-center text-[12px] text-slate-400">No chunks found</p>
                      ) : (
                        chunks.map((chunk, i) => (
                          <div key={chunk.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-medium text-slate-500">Chunk {i + 1}</span>
                              <span className="text-[10px] text-slate-400">{chunk.tokenCount} tokens</span>
                            </div>
                            <p className="text-[12px] text-slate-700 line-clamp-4 whitespace-pre-wrap">
                              {chunk.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {documents.length === 0 && (
              <p className="py-8 text-center text-[13px] text-slate-400">
                No documents uploaded yet. Drag and drop files above.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Retrieval Test Tab */}
        <TabsContent value="retrieval" className="space-y-4">
          <Card className="rounded-xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-slate-800">
                Test Retrieval
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter a search query..."
                  className="h-9 text-[13px]"
                  onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                />
                <Button onClick={handleQuery} disabled={querying || !query.trim()} size="sm">
                  {querying ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Search className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {retrievalResults && (
            <div className="space-y-2">
              <p className="text-[12px] text-slate-500">
                {retrievalResults.totalFound} chunk{retrievalResults.totalFound !== 1 ? "s" : ""} found for "{retrievalResults.query}"
              </p>
              {retrievalResults.chunks?.map((chunk: any, i: number) => (
                <Card key={chunk.id || i} className={`rounded-xl border ${getScoreColor(chunk.score)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium">
                          {chunk.documentName || "Document"}
                        </span>
                        <Badge variant="outline" className={`text-[10px] ${getScoreColor(chunk.score)}`}>
                          {(chunk.score * 100).toFixed(0)}% match
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-400">{chunk.tokenCount} tokens</span>
                    </div>
                    <p className="text-[12px] text-slate-700 whitespace-pre-wrap line-clamp-6">
                      {chunk.content}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {retrievalResults.totalFound === 0 && (
                <p className="py-8 text-center text-[13px] text-slate-400">
                  No matching chunks found. Try a different query or lower the similarity threshold.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="rounded-xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-medium text-slate-800">
                  Chunking Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Strategy</span>
                  <span className="font-medium text-slate-700">{config?.chunking?.strategy || "fixed"}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Chunk Size</span>
                  <span className="font-medium text-slate-700">{config?.chunking?.chunkSize || 512} tokens</span>
                </div>
                <Separator />
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Overlap</span>
                  <span className="font-medium text-slate-700">{config?.chunking?.chunkOverlap || 50} tokens</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-medium text-slate-800">
                  Retrieval Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Top-K Results</span>
                  <span className="font-medium text-slate-700">{config?.retrieval?.topK || 5}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Similarity Threshold</span>
                  <span className="font-medium text-slate-700">{config?.retrieval?.similarityThreshold ?? 0.5}</span>
                </div>
              </CardContent>
            </Card>

            {/* Connected Agents */}
            <Card className="rounded-xl border-slate-100 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-medium text-slate-800">
                  Connected Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kb.agents?.length > 0 ? (
                  <div className="space-y-2">
                    {kb.agents.map((akb: any) => (
                      <div key={akb.agent.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                          <BookOpen className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="text-[13px] font-medium text-slate-700">
                          {akb.agent.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-slate-400">
                    No agents connected yet. Attach this KB in the agent builder.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
