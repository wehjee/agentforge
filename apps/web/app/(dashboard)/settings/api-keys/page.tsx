"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import type { ApiKey } from "@shared/types/deployment";

export default function ApiKeysPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await apiFetch<ApiKey[]>("/api-keys");
      setKeys((res.data as unknown as ApiKey[]) || []);
    } catch {
      toast({ variant: "destructive", title: "Failed to load API keys" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await apiFetch<ApiKey>("/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = res.data as unknown as ApiKey;
      setNewlyCreatedKey(data.key);
      setNewKeyName("");
      fetchKeys();
    } catch {
      toast({ variant: "destructive", title: "Failed to create API key" });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await apiFetch(`/api-keys/${id}`, { method: "DELETE" });
      toast({ title: "API key revoked" });
      fetchKeys();
    } catch {
      toast({ variant: "destructive", title: "Failed to revoke API key" });
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/settings")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-[20px] font-semibold text-slate-900">
              API Keys
            </h1>
            <p className="mt-0.5 text-[13px] text-slate-400">
              Manage API keys for external agent access
            </p>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setNewlyCreatedKey(null);
            setNewKeyName("");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 text-[13px]">
              <Plus className="h-3.5 w-3.5" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            {newlyCreatedKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Copy your API key now. You will not be able to see it again.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <p className="text-[12px] text-amber-700">
                      This key will only be shown once. Store it securely.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-[12px] text-slate-300">
                      {newlyCreatedKey}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopy(newlyCreatedKey!, "new-key")
                      }
                    >
                      {copiedId === "new-key" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => {
                    setCreateOpen(false);
                    setNewlyCreatedKey(null);
                  }}>
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Give your API key a descriptive name
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[13px]">Name</Label>
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Production API, Widget Backend"
                      className="h-9 text-[13px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreate();
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !newKeyName.trim()}
                  >
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <Key className="h-5 w-5 text-slate-400" />
          </div>
          <h3 className="mt-4 text-[14px] font-medium text-slate-900">
            No API keys yet
          </h3>
          <p className="mt-1 text-[13px] text-slate-400">
            Create an API key to access your agents externally
          </p>
          <Button
            className="mt-4 gap-1.5 text-[13px]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Create API Key
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[12px] font-medium text-slate-400">
                  Name
                </TableHead>
                <TableHead className="text-[12px] font-medium text-slate-400">
                  Key
                </TableHead>
                <TableHead className="text-[12px] font-medium text-slate-400">
                  Created
                </TableHead>
                <TableHead className="text-[12px] font-medium text-slate-400">
                  Last Used
                </TableHead>
                <TableHead className="w-[80px] text-right text-[12px] font-medium text-slate-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((apiKey) => (
                <TableRow key={apiKey.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-[13px] font-medium text-slate-900">
                    {apiKey.name}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-slate-100 px-2 py-0.5 text-[12px] text-slate-500">
                      {apiKey.prefix}
                    </code>
                  </TableCell>
                  <TableCell className="text-[13px] text-slate-400">
                    {new Date(apiKey.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-[13px] text-slate-400">
                    {apiKey.lastUsedAt
                      ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to revoke{" "}
                            <strong>{apiKey.name}</strong>? Any applications
                            using this key will immediately lose access.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevoke(apiKey.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Usage Note */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-[14px] font-semibold text-slate-900">Usage</h3>
        <p className="mt-1 text-[13px] text-slate-400">
          Include your API key in the Authorization header of your requests
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-[12px] leading-relaxed text-slate-300">
          <code>{`curl -H "Authorization: Bearer af_your_key_here" \\
     -H "Content-Type: application/json" \\
     -d '{"message": "Hello"}' \\
     POST /api/v1/external/agents/AGENT_ID/chat`}</code>
        </pre>
      </div>
    </div>
  );
}
