"use client";

import Link from "next/link";
import { Plus, Search, BookOpen, FileText, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useKnowledgeBases } from "@/lib/hooks/use-knowledge";
import { useKBStore } from "@/stores/kb-store";

export function KBListView() {
  const { kbs, loading } = useKnowledgeBases();
  const { search, setSearch } = useKBStore();

  const filtered = kbs.filter((kb) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        kb.name.toLowerCase().includes(q) ||
        (kb.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
            Knowledge Bases
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Manage document collections for RAG-powered agents.
          </p>
        </div>
        <Button asChild>
          <Link href="/knowledge/new">
            <Plus className="mr-2 h-4 w-4" />
            New Knowledge Base
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search knowledge bases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-[13px]"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <BookOpen className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-[14px] font-medium text-slate-600">
            No knowledge bases yet
          </p>
          <p className="mt-1 text-[13px] text-slate-400">
            Upload documents to create a searchable knowledge base for your agents.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/knowledge/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create Knowledge Base
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((kb) => (
            <Link key={kb.id} href={`/knowledge/${kb.id}`}>
              <Card className="group rounded-xl border-slate-100 shadow-card transition-all duration-200 hover:shadow-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-200/70">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-slate-50 text-[11px] font-normal text-slate-500"
                    >
                      {(kb.config as any)?.chunking?.strategy || "fixed"}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-[14px] font-medium text-slate-900">
                      {kb.name}
                    </h3>
                    {kb.description && (
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-400 line-clamp-2">
                        {kb.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{kb.documentCount ?? 0} docs</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
                      <Box className="h-3.5 w-3.5" />
                      <span>{kb.chunkCount ?? 0} chunks</span>
                    </div>
                  </div>

                  <p className="mt-3 text-[12px] text-slate-300">
                    Updated {new Date(kb.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
