"use client";

import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfigPanel } from "./config-panel";
import { useBuilderStore } from "@/stores/builder-store";
import { useState } from "react";

export function IdentityPanel() {
  const name = useBuilderStore((s) => s.name);
  const description = useBuilderStore((s) => s.description);
  const tags = useBuilderStore((s) => s.tags);
  const setName = useBuilderStore((s) => s.setName);
  const setDescription = useBuilderStore((s) => s.setDescription);
  const setTags = useBuilderStore((s) => s.setTags);
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AG";

  return (
    <ConfigPanel id="identity" title="Identity" icon={<User className="h-3.5 w-3.5" />}>
      <div className="space-y-4">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-sage-600 text-[18px] font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-[12px] text-slate-400">
              Avatar upload coming soon
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Customer Support Bot"
            className="h-9 text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this agent do?"
            rows={2}
            className="resize-none text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">Tags</Label>
          <div className="flex items-center gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag..."
              className="h-8 text-[12px]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTag}
              className="h-8 px-3 text-[12px]"
            >
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer bg-slate-100 text-[11px] text-slate-600 hover:bg-red-50 hover:text-red-600"
                  onClick={() => removeTag(tag)}
                >
                  {tag} &times;
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </ConfigPanel>
  );
}
