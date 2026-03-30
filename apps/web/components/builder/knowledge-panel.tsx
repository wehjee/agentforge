"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Plus, Trash2, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfigPanel } from "./config-panel";
import { useBuilderStore } from "@/stores/builder-store";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

interface KBOption {
  id: string;
  name: string;
  description: string | null;
  documentCount?: number;
  chunkCount?: number;
}

export function KnowledgePanel() {
  const knowledgeBases = useBuilderStore((s) => s.config.knowledgeBases);
  const updateConfig = useBuilderStore((s) => s.updateConfig);
  const [availableKBs, setAvailableKBs] = useState<KBOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const fetchKBs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>("/knowledge", { params: { limit: 50 } });
      setAvailableKBs((res as any).data || []);
    } catch {
      setAvailableKBs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKBs();
  }, [fetchKBs]);

  const addKB = (kbId: string) => {
    if (!knowledgeBases.includes(kbId)) {
      updateConfig("knowledgeBases", [...knowledgeBases, kbId]);
    }
    setShowPicker(false);
  };

  const removeKB = (kbId: string) => {
    updateConfig(
      "knowledgeBases",
      knowledgeBases.filter((id) => id !== kbId)
    );
  };

  const attachedKBs = availableKBs.filter((kb) => knowledgeBases.includes(kb.id));
  const unattachedKBs = availableKBs.filter((kb) => !knowledgeBases.includes(kb.id));

  return (
    <ConfigPanel
      id="knowledge"
      title="Knowledge Bases"
      icon={<BookOpen className="h-3.5 w-3.5" />}
      badge={knowledgeBases.length > 0 ? `${knowledgeBases.length} attached` : undefined}
    >
      <div className="space-y-3">
        {/* Attached KBs */}
        {attachedKBs.length > 0 ? (
          <div className="space-y-2">
            {attachedKBs.map((kb) => (
              <div
                key={kb.id}
                className="flex items-center gap-3 rounded-xl border border-sage-100 bg-sage-50/50 p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-50 text-sage-600">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 truncate">
                    {kb.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400">
                      {kb.documentCount ?? 0} docs
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {kb.chunkCount ?? 0} chunks
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-red-500"
                  onClick={() => removeKB(kb.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <BookOpen className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-[12px] text-slate-500">
              No knowledge bases attached.
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Add a KB to give your agent document context.
            </p>
          </div>
        )}

        {/* Add KB */}
        {showPicker ? (
          <div className="space-y-2 rounded-xl border border-slate-200 p-3">
            <p className="text-[12px] font-medium text-slate-600">
              Select a Knowledge Base
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            ) : unattachedKBs.length > 0 ? (
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {unattachedKBs.map((kb) => (
                  <button
                    key={kb.id}
                    onClick={() => addKB(kb.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-slate-100 p-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-slate-700 truncate">
                        {kb.name}
                      </p>
                      {kb.description && (
                        <p className="text-[11px] text-slate-400 truncate">{kb.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-[12px] text-slate-400">No knowledge bases available.</p>
                <Button variant="outline" size="sm" className="mt-2 h-7 text-[11px]" asChild>
                  <Link href="/knowledge/new">Create one</Link>
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-[12px]"
              onClick={() => setShowPicker(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 gap-1.5 text-[12px]"
            onClick={() => setShowPicker(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Attach Knowledge Base
          </Button>
        )}
      </div>
    </ConfigPanel>
  );
}
