"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  workspaces: {
    id: string;
    name: string;
    slug: string;
    role: string;
  }[];
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (res.data) {
        document.cookie = `token=${res.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;

        if (res.data.workspaces.length > 0) {
          localStorage.setItem("workspaceId", res.data.workspaces[0].id);
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description:
          error instanceof Error ? error.message : "Invalid credentials",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[13px] text-slate-500">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@agentforge.dev"
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
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-10"
        />
      </div>
      <Button type="submit" className="h-10 w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-[13px] text-slate-400">
        No account?{" "}
        <Link
          href="/register"
          className="text-slate-900 underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
