"use client";

import { FileText, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfigPanel } from "./config-panel";
import { useBuilderStore } from "@/stores/builder-store";

export function InstructionsPanel() {
  const config = useBuilderStore((s) => s.config);
  const updateConfig = useBuilderStore((s) => s.updateConfig);

  const charCount = config.systemPrompt.length;
  const tokenEstimate = Math.ceil(charCount / 4);

  return (
    <ConfigPanel
      id="instructions"
      title="Instructions"
      icon={<FileText className="h-3.5 w-3.5" />}
      badge={charCount > 0 ? `${tokenEstimate} tokens` : undefined}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[12px] font-medium text-slate-500">
            System Prompt
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-[11px] text-slate-400"
                  disabled
                >
                  <Sparkles className="h-3 w-3" />
                  Prompt Assistant
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-[12px]">Coming soon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          value={config.systemPrompt}
          onChange={(e) => updateConfig("systemPrompt", e.target.value)}
          placeholder="Define how your agent behaves. Be specific about its role, tone, and boundaries.&#10;&#10;Example: You are a helpful customer support agent for Acme Corp. Always be polite and professional. If you cannot resolve an issue, escalate to a human agent."
          rows={10}
          className="resize-y font-mono text-[12px] leading-relaxed"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{charCount.toLocaleString()} characters</span>
          <span>~{tokenEstimate.toLocaleString()} tokens</span>
        </div>
      </div>
    </ConfigPanel>
  );
}
