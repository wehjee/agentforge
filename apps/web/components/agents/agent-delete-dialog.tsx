"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";

interface AgentDeleteDialogProps {
  agentId: string;
  agentName: string;
}

export function AgentDeleteDialog({
  agentId,
  agentName,
}: AgentDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleArchive() {
    setDeleting(true);
    try {
      await apiFetch(`/agents/${agentId}`, { method: "DELETE" });
      toast({ title: "Agent archived" });
      router.push("/agents");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to archive",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handlePermanentDelete() {
    setDeleting(true);
    try {
      await apiFetch(`/agents/${agentId}`, {
        method: "DELETE",
        params: { permanent: true },
      });
      toast({ title: "Agent deleted permanently" });
      router.push("/agents");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {agentName}?</AlertDialogTitle>
          <AlertDialogDescription>
            You can archive this agent to hide it from your list, or permanently
            delete it along with all its versions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleArchive();
            }}
            disabled={deleting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {deleting ? "Archiving..." : "Archive"}
          </AlertDialogAction>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handlePermanentDelete();
            }}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? "Deleting..." : "Delete Permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
