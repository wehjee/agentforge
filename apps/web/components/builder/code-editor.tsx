"use client";

import { useCallback, useRef, useEffect } from "react";
import { useBuilderStore } from "@/stores/builder-store";
import dynamic from "next/dynamic";
import { stringify, parse } from "yaml";
import type { AgentConfig } from "@shared/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-900">
      <div className="flex items-center gap-2 text-[13px] text-slate-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-slate-400" />
        Loading editor...
      </div>
    </div>
  ),
});

function configToYaml(
  name: string,
  description: string,
  config: AgentConfig
): string {
  const doc: Record<string, unknown> = {
    agent: {
      name,
      description: description || undefined,
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      system_prompt: config.systemPrompt || undefined,

      tools: config.tools
        .filter((t) => t.enabled)
        .map((t) => ({
          id: t.id,
          name: t.name,
          type: "builtin",
        })),

      knowledge_bases: config.knowledgeBases.length > 0 ? config.knowledgeBases : undefined,

      guardrails: {
        pii_detection: config.guardrails.piiDetection,
        blocked_topics:
          config.guardrails.blockedTopics.length > 0
            ? config.guardrails.blockedTopics
            : undefined,
        max_conversation_turns: config.guardrails.maxConversationTurns,
        escalation_trigger: config.guardrails.escalationRules || undefined,
      },

      memory: {
        type: config.memory.type,
        max_messages: config.memory.maxMessages,
      },

      variables: config.variables.length > 0
        ? config.variables.map((v) => ({
            name: v.name,
            type: v.type,
            description: v.description || undefined,
          }))
        : undefined,
    },
  };

  return stringify(doc, { lineWidth: 120 });
}

function yamlToConfig(
  yamlStr: string,
  currentTools: AgentConfig["tools"]
): {
  name: string;
  description: string;
  config: Partial<AgentConfig>;
} | null {
  try {
    const doc = parse(yamlStr);
    if (!doc?.agent) return null;

    const a = doc.agent;

    // Map tools from YAML back, preserving the full tool objects
    let tools = currentTools;
    if (a.tools && Array.isArray(a.tools)) {
      const enabledIds = new Set(a.tools.map((t: { id: string }) => t.id));
      tools = currentTools.map((t) => ({
        ...t,
        enabled: enabledIds.has(t.id),
      }));
    }

    return {
      name: a.name || "",
      description: a.description || "",
      config: {
        model: a.model,
        temperature: a.temperature,
        maxTokens: a.max_tokens,
        topP: a.top_p,
        systemPrompt: a.system_prompt || "",
        tools,
        knowledgeBases: a.knowledge_bases || [],
        guardrails: {
          piiDetection: a.guardrails?.pii_detection ?? false,
          blockedTopics: a.guardrails?.blocked_topics || [],
          maxConversationTurns: a.guardrails?.max_conversation_turns ?? 50,
          escalationRules: a.guardrails?.escalation_trigger || "",
        },
        memory: {
          type: a.memory?.type || "conversation",
          maxMessages: a.memory?.max_messages ?? 20,
        },
        variables: a.variables
          ? a.variables.map(
              (v: { name: string; type: string; description?: string }, i: number) => ({
                id: `var_${i}`,
                name: v.name,
                type: v.type as "string" | "number" | "boolean",
                description: v.description || "",
              })
            )
          : [],
      },
    };
  } catch {
    return null;
  }
}

export function CodeEditor() {
  const name = useBuilderStore((s) => s.name);
  const description = useBuilderStore((s) => s.description);
  const config = useBuilderStore((s) => s.config);
  const setName = useBuilderStore((s) => s.setName);
  const setDescription = useBuilderStore((s) => s.setDescription);
  const setConfig = useBuilderStore((s) => s.setConfig);

  const isInternalUpdate = useRef(false);
  const editorRef = useRef<unknown>(null);
  const lastYamlRef = useRef("");

  // Generate YAML from state
  const yaml = configToYaml(name, description, config);

  // Update editor when state changes from visual builder
  useEffect(() => {
    if (!isInternalUpdate.current && editorRef.current) {
      const editor = editorRef.current as { getValue: () => string; setValue: (v: string) => void };
      const currentValue = editor.getValue();
      if (currentValue !== yaml) {
        lastYamlRef.current = yaml;
        editor.setValue(yaml);
      }
    }
    isInternalUpdate.current = false;
  }, [yaml]);

  const handleEditorDidMount = useCallback(
    (editor: unknown) => {
      editorRef.current = editor;
      lastYamlRef.current = yaml;
    },
    [yaml]
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!value) return;
      if (value === lastYamlRef.current) return;
      lastYamlRef.current = value;

      isInternalUpdate.current = true;

      const result = yamlToConfig(value, config.tools);
      if (result) {
        if (result.name !== name) setName(result.name);
        if (result.description !== description) setDescription(result.description);
        if (result.config) {
          setConfig({ ...config, ...result.config } as AgentConfig);
        }
      }
    },
    [config, name, description, setName, setDescription, setConfig]
  );

  return (
    <div className="h-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex h-9 items-center border-b border-slate-800 px-4">
        <span className="text-[11px] font-medium text-slate-500">
          agent-config.yaml
        </span>
        <span className="ml-auto text-[10px] text-slate-600">
          Changes sync with visual editor
        </span>
      </div>
      <MonacoEditor
        height="calc(100% - 36px)"
        language="yaml"
        theme="vs-dark"
        value={yaml}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineHeight: 20,
          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          padding: { top: 12, bottom: 12 },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          renderLineHighlight: "none",
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
      />
    </div>
  );
}
