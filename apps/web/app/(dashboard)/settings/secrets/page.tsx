"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Secret {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

const INITIAL_SECRETS: Secret[] = [
  {
    id: "sec_1",
    key: "OPENAI_API_KEY",
    value: "sk-proj-abc123...xyz789",
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "sec_2",
    key: "STRIPE_API_KEY",
    value: "sk_live_abc123...xyz789",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "sec_3",
    key: "SLACK_BOT_TOKEN",
    value: "xoxb-abc123...xyz789",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

function maskValue(value: string): string {
  if (value.length <= 8) return "********";
  return value.slice(0, 8) + "..." + value.slice(-4);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SecretsPage() {
  const [secrets, setSecrets] = useState<Secret[]>(INITIAL_SECRETS);
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteSecret, setDeleteSecret] = useState<Secret | null>(null);

  function handleAdd() {
    if (!newKey.trim() || !newValue.trim()) return;
    const secret: Secret = {
      id: `sec_${Date.now()}`,
      key: newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
      value: newValue.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSecrets([...secrets, secret]);
    setNewKey("");
    setNewValue("");
    setShowAdd(false);
  }

  function handleDelete(secret: Secret) {
    setSecrets(secrets.filter((s) => s.id !== secret.id));
    setDeleteSecret(null);
  }

  function toggleReveal(id: string) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCopy(secret: Secret) {
    navigator.clipboard.writeText(secret.value);
    setCopiedId(secret.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/settings"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-slate-900">
              Secrets
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Manage API keys and secrets used by your agents and tools. Values are encrypted at rest.
            </p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Secret
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="rounded-xl border-sage-50 bg-sage-50/30 shadow-card">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-[200px]">
                <label className="mb-1.5 block text-[12px] font-medium text-slate-600">
                  Key
                </label>
                <Input
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="API_KEY_NAME"
                  className="bg-white font-mono text-[13px]"
                />
              </div>
              <div className="flex-1 min-w-[240px]">
                <label className="mb-1.5 block text-[12px] font-medium text-slate-600">
                  Value
                </label>
                <Input
                  type="password"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter secret value..."
                  className="bg-white text-[13px]"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} size="sm">
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAdd(false);
                    setNewKey("");
                    setNewValue("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-slate-400">
              Reference in agent configs using{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
                {"{{secrets.YOUR_KEY}}"}
              </code>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Secrets list */}
      <Card className="rounded-xl border-slate-100 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
            <Key className="h-4 w-4 text-slate-400" />
            Workspace Secrets
            <span className="text-[13px] font-normal text-slate-400">
              ({secrets.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {secrets.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <Key className="h-10 w-10 text-slate-200" />
              <p className="mt-3 text-[14px] text-slate-400">
                No secrets configured yet
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowAdd(true)}
              >
                Add your first secret
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {secrets.map((secret) => {
                const isRevealed = revealedIds.has(secret.id);
                const isCopied = copiedId === secret.id;

                return (
                  <div
                    key={secret.id}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Key className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[14px] font-medium text-slate-900">
                        {secret.key}
                      </p>
                      <p className="mt-0.5 font-mono text-[12px] text-slate-400">
                        {isRevealed ? secret.value : maskValue(secret.value)}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[12px] text-slate-400">
                        Updated {formatDate(secret.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleReveal(secret.id)}
                      >
                        {isRevealed ? (
                          <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopy(secret)}
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-sage-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setDeleteSecret(secret)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteSecret}
        onOpenChange={() => setDeleteSecret(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete secret</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="font-mono">{deleteSecret?.key}</strong>?
              Any agent or tool referencing this secret will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteSecret && handleDelete(deleteSecret)}
            >
              Delete Secret
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
