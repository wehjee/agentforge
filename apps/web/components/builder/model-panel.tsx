"use client";

import { Cpu } from "lucide-react";
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
import { ConfigPanel } from "./config-panel";
import { useBuilderStore } from "@/stores/builder-store";
import { MODEL_OPTIONS, TEMPERATURE_PRESETS } from "@shared/types";
import { cn } from "@/lib/utils";

export function ModelPanel() {
  const config = useBuilderStore((s) => s.config);
  const updateConfig = useBuilderStore((s) => s.updateConfig);

  const tempPreset =
    TEMPERATURE_PRESETS.find((p) => p.value === config.temperature)?.label ||
    "Custom";

  return (
    <ConfigPanel
      id="model"
      title="Model Configuration"
      icon={<Cpu className="h-3.5 w-3.5" />}
      badge={MODEL_OPTIONS.find((m) => m.value === config.model)?.label}
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-slate-500">Model</Label>
          <Select
            value={config.model}
            onValueChange={(v) => updateConfig("model", v)}
          >
            <SelectTrigger className="h-9 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[12px] font-medium text-slate-500">
              Temperature
            </Label>
            <span className="text-[12px] tabular-nums text-slate-400">
              {config.temperature.toFixed(1)} ({tempPreset})
            </span>
          </div>

          {/* Custom gradient temperature slider */}
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-sage-400 via-slate-300 to-orange-400 opacity-20" />
            <Slider
              value={[config.temperature]}
              onValueChange={([v]) => updateConfig("temperature", v)}
              min={0}
              max={1}
              step={0.1}
              className="relative w-full"
            />
          </div>

          <div className="flex gap-1.5">
            {TEMPERATURE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => updateConfig("temperature", preset.value)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all duration-150",
                  config.temperature === preset.value
                    ? preset.value <= 0.1
                      ? "border-sage-100 bg-sage-50 text-sage-600"
                      : preset.value >= 0.9
                        ? "border-orange-200 bg-orange-50 text-orange-700"
                        : "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-slate-500">
              Max Tokens
            </Label>
            <Input
              type="number"
              value={config.maxTokens}
              onChange={(e) =>
                updateConfig(
                  "maxTokens",
                  parseInt(e.target.value, 10) || 4096
                )
              }
              min={1}
              max={32768}
              className="h-9 text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-slate-500">
              Top P
            </Label>
            <Input
              type="number"
              value={config.topP}
              onChange={(e) =>
                updateConfig(
                  "topP",
                  parseFloat(e.target.value) || 1
                )
              }
              min={0}
              max={1}
              step={0.05}
              className="h-9 text-[13px]"
            />
          </div>
        </div>
      </div>
    </ConfigPanel>
  );
}
