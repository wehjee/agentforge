"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

export function KBCreateView() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [strategy, setStrategy] = useState("fixed");
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.5);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch<any>("/knowledge", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          config: {
            chunking: { chunkSize, chunkOverlap, strategy },
            retrieval: { topK, similarityThreshold: threshold },
          },
        }),
      });
      const kb = (res as any).data;
      router.push(`/knowledge/${kb.id}`);
    } catch (err) {
      console.error("Failed to create KB:", err);
    } finally {
      setSaving(false);
    }
  }, [name, description, chunkSize, chunkOverlap, strategy, topK, threshold, router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/knowledge")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-display text-[22px] font-medium tracking-[-0.01em] text-slate-900">
              Create Knowledge Base
            </h1>
            <p className="text-[13px] text-slate-500">
              Configure chunking and retrieval settings for your documents.
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? "Creating..." : "Create"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Details & Chunking */}
        <div className="space-y-5">
          <Card className="rounded-xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-slate-800">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-[12px] text-slate-600">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Product Documentation"
                  className="mt-1 h-9 text-[13px]"
                />
              </div>
              <div>
                <Label className="text-[12px] text-slate-600">Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What documents will this contain?"
                  className="mt-1 h-9 text-[13px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-slate-800">
                Chunking Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-[12px] text-slate-600">Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger className="mt-1 h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Size</SelectItem>
                    <SelectItem value="paragraph">Paragraph</SelectItem>
                    <SelectItem value="semantic">Semantic</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-slate-400">
                  {strategy === "fixed" && "Split text into chunks of a fixed token size."}
                  {strategy === "paragraph" && "Split at paragraph boundaries, merging small paragraphs."}
                  {strategy === "semantic" && "Split at sentence boundaries, grouping related sentences."}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[12px] text-slate-600">Chunk Size (tokens)</Label>
                  <span className="text-[12px] font-medium text-slate-700">{chunkSize}</span>
                </div>
                <Slider
                  value={[chunkSize]}
                  onValueChange={([v]) => setChunkSize(v)}
                  min={100}
                  max={4000}
                  step={50}
                  className="mt-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[12px] text-slate-600">Chunk Overlap (tokens)</Label>
                  <span className="text-[12px] font-medium text-slate-700">{chunkOverlap}</span>
                </div>
                <Slider
                  value={[chunkOverlap]}
                  onValueChange={([v]) => setChunkOverlap(v)}
                  min={0}
                  max={500}
                  step={10}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Retrieval Config */}
        <div className="space-y-5">
          <Card className="rounded-xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-slate-800">
                Retrieval Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[12px] text-slate-600">Top-K Results</Label>
                  <span className="text-[12px] font-medium text-slate-700">{topK}</span>
                </div>
                <Slider
                  value={[topK]}
                  onValueChange={([v]) => setTopK(v)}
                  min={1}
                  max={20}
                  step={1}
                  className="mt-2"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Number of chunks to return per query.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[12px] text-slate-600">Similarity Threshold</Label>
                  <span className="text-[12px] font-medium text-slate-700">{threshold.toFixed(2)}</span>
                </div>
                <Slider
                  value={[threshold]}
                  onValueChange={([v]) => setThreshold(v)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="mt-2"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Minimum relevance score (0 = return everything, 1 = exact match only).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-100 bg-slate-50/50">
            <CardContent className="py-6 text-center">
              <p className="text-[13px] text-slate-500">
                You can upload documents after creating the knowledge base.
              </p>
              <p className="mt-1 text-[12px] text-slate-400">
                Supported formats: PDF, DOCX, TXT, MD, HTML, CSV, JSON
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
