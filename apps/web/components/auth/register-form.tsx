"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";

interface RegisterResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
}

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, workspaceName }),
      });

      if (res.data) {
        document.cookie = `token=${res.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
        localStorage.setItem("workspaceId", res.data.workspace.id);
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description:
          error instanceof Error ? error.message : "Could not create account",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-[13px] text-slate-500">
          Name
        </Label>
        <Input
          id="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[13px] text-slate-500">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-[13px] text-slate-500">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Min 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="workspace" className="text-[13px] text-slate-500">
          Workspace name
        </Label>
        <Input
          id="workspace"
          placeholder="My Team"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          required
          className="h-10"
        />
      </div>
      <Button type="submit" className="h-10 w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-center text-[13px] text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-slate-900 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
