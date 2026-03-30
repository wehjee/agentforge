"use client";

import { Variable, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfigPanel } from "./config-panel";
import { useBuilderStore } from "@/stores/builder-store";

export function VariablesPanel() {
  const variables = useBuilderStore((s) => s.config.variables);
  const addVariable = useBuilderStore((s) => s.addVariable);
  const removeVariable = useBuilderStore((s) => s.removeVariable);
  const updateVariable = useBuilderStore((s) => s.updateVariable);

  function handleAdd() {
    addVariable({
      id: `var_${Date.now()}`,
      name: "",
      type: "string",
      description: "",
    });
  }

  return (
    <ConfigPanel
      id="variables"
      title="Variables"
      icon={<Variable className="h-3.5 w-3.5" />}
      badge={variables.length > 0 ? `${variables.length}` : undefined}
    >
      <div className="space-y-3">
        {variables.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
            <p className="text-[12px] text-slate-400">
              Define input variables your agent expects, like{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] font-mono text-slate-600">
                {"{{customer_name}}"}
              </code>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {variables.map((v) => (
              <div
                key={v.id}
                className="flex items-start gap-2 rounded-xl border border-slate-150 bg-white p-3"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={v.name}
                      onChange={(e) =>
                        updateVariable(v.id, { name: e.target.value })
                      }
                      placeholder="Variable name"
                      className="h-8 flex-1 text-[12px]"
                    />
                    <Select
                      value={v.type}
                      onValueChange={(val) =>
                        updateVariable(v.id, {
                          type: val as "string" | "number" | "boolean",
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-28 text-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    value={v.description}
                    onChange={(e) =>
                      updateVariable(v.id, { description: e.target.value })
                    }
                    placeholder="Description (optional)"
                    className="h-7 text-[11px] text-slate-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariable(v.id)}
                  className="mt-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-8 w-full gap-1.5 text-[12px]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Variable
        </Button>
      </div>
    </ConfigPanel>
  );
}
