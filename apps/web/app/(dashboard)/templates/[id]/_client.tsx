"use client";


import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Cpu,
  Thermometer,
  Hash,
  Wrench,
  Tag,
  Rocket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TEMPLATES, CATEGORY_COLORS } from "@/lib/templates";

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const template = TEMPLATES.find((t) => t.id === params.id);

  if (!template) {
    return (
      <div className="flex flex-col items-center py-20">
        <p className="text-[14px] text-slate-400">Template not found</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/templates">Back to Templates</Link>
        </Button>
      </div>
    );
  }

  function handleUseTemplate() {
    // Navigate to new agent page with template data in query params
    const searchParams = new URLSearchParams({
      template: template!.id,
    });
    router.push(`/agents/new?${searchParams.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/templates"
        className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Templates
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-3xl">
            {template.icon}
          </div>
          <div>
            <h1 className="text-[24px] font-semibold tracking-tight text-slate-900">
              {template.name}
            </h1>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge
                variant="outline"
                className={CATEGORY_COLORS[template.category]}
              >
                {template.category}
              </Badge>
              {template.badge && (
                <Badge
                  variant="outline"
                  className={
                    template.badge === "Popular"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-sage-50 text-sage-600 border-sage-100"
                  }
                >
                  {template.badge}
                </Badge>
              )}
            </div>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-500">
              {template.description}
            </p>
          </div>
        </div>
        <Button onClick={handleUseTemplate} className="shrink-0">
          <Rocket className="mr-2 h-4 w-4" />
          Use This Template
        </Button>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column: System prompt */}
        <div className="lg:col-span-2">
          <Card className="rounded-xl border-slate-100 shadow-card">
            <CardHeader>
              <CardTitle className="text-[15px] font-semibold text-slate-900">
                System Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-lg bg-slate-900 p-4 text-[13px] leading-relaxed text-slate-300">
                {template.systemPrompt}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Side column: Config */}
        <div className="space-y-4">
          {/* Model config */}
          <Card className="rounded-xl border-slate-100 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold text-slate-900">
                Model Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-slate-500">
                  <Cpu className="h-3.5 w-3.5" />
                  Model
                </span>
                <span className="text-[13px] font-medium text-slate-900">
                  {template.model.replace("claude-", "").replace("-20250514", "")}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-slate-500">
                  <Thermometer className="h-3.5 w-3.5" />
                  Temperature
                </span>
                <span className="text-[13px] font-medium text-slate-900">
                  {template.temperature}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-slate-500">
                  <Hash className="h-3.5 w-3.5" />
                  Max Tokens
                </span>
                <span className="text-[13px] font-medium text-slate-900">
                  {template.maxTokens.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tools */}
          <Card className="rounded-xl border-slate-100 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                <Wrench className="h-4 w-4 text-slate-400" />
                Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {template.tools.map((tool) => (
                  <Badge
                    key={tool}
                    variant="outline"
                    className="bg-slate-50 text-slate-600 border-slate-200 text-[11px]"
                  >
                    {tool}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="rounded-xl border-slate-100 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                <Tag className="h-4 w-4 text-slate-400" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[12px] text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Button
            onClick={handleUseTemplate}
            className="w-full"
            size="lg"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Use This Template
          </Button>
        </div>
      </div>
    </div>
  );
}
