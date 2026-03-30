"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  CATEGORY_COLORS,
  type TemplateCategory,
} from "@/lib/templates";

const BADGE_STYLES: Record<string, string> = {
  Popular: "bg-amber-50 text-amber-700 border-amber-200",
  New: "bg-sage-50 text-sage-600 border-sage-100",
};

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    TemplateCategory | "All"
  >("All");

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      if (
        selectedCategory !== "All" &&
        t.category !== selectedCategory
      )
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q))
        );
      }
      return true;
    });
  }, [search, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
          Templates
        </h1>
        <p className="mt-1 text-[14px] text-slate-500">
          Start with a pre-built template and customize it for your use case.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9 text-[13px]"
          />
        </div>
        <div className="flex gap-1.5">
          <Button
            variant={selectedCategory === "All" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("All")}
            className="text-[12px]"
          >
            All
          </Button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-[12px]"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="rounded-xl border-dashed border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sparkles className="h-10 w-10 text-slate-200" />
            <p className="mt-3 text-[14px] text-slate-400">
              No templates match your search
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <Link
              key={template.id}
              href={`/templates/${template.id}`}
            >
              <Card className="group relative h-full rounded-xl border-slate-100 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
                <CardContent className="flex h-full flex-col p-5">
                  {/* Icon area */}
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-2xl">
                      {template.icon}
                    </div>
                    {template.badge && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${BADGE_STYLES[template.badge] || ""}`}
                      >
                        {template.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="mt-4 flex-1">
                    <h3 className="text-[15px] font-semibold text-slate-900">
                      {template.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`mt-2 text-[10px] ${CATEGORY_COLORS[template.category]}`}
                    >
                      {template.category}
                    </Badge>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-slate-500 line-clamp-3">
                      {template.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                    <div className="flex gap-1">
                      {template.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[12px] font-medium text-sage-500 opacity-0 transition-opacity group-hover:opacity-100">
                      View
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
