"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserPlus,
  MoreHorizontal,
  Shield,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getMockTeamMembers,
  ROLE_BADGE_STYLES,
  ROLE_OPTIONS,
  type TeamMember,
} from "@/lib/team-data";
import type { Role } from "@shared/types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("BUILDER");
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMembers(getMockTeamMembers());
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    const newMember: TeamMember = {
      id: `user_${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      avatarUrl: null,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    setMembers([...members, newMember]);
    setInviteEmail("");
    setInviteRole("BUILDER");
    setShowInvite(false);
  }

  function handleRemove(member: TeamMember) {
    setMembers(members.filter((m) => m.id !== member.id));
    setRemoveMember(null);
  }

  function handleRoleChange(memberId: string, newRole: Role) {
    setMembers(
      members.map((m) =>
        m.id === memberId ? { ...m, role: newRole } : m
      )
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
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
              Team
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Manage your workspace members and their permissions.
            </p>
          </div>
          <Button onClick={() => setShowInvite(!showInvite)} size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Invite form */}
      {showInvite && (
        <Card className="rounded-xl border-sage-50 bg-sage-50/30 shadow-card">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[240px]">
                <label className="mb-1.5 block text-[12px] font-medium text-slate-600">
                  Email address
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="bg-white text-[13px]"
                />
              </div>
              <div className="w-[160px]">
                <label className="mb-1.5 block text-[12px] font-medium text-slate-600">
                  Role
                </label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as Role)}
                >
                  <SelectTrigger className="bg-white text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <span className="font-medium">{opt.label}</span>
                          <span className="ml-2 text-[11px] text-slate-400">
                            {opt.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleInvite} size="sm">
                  Send Invite
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInvite(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      <Card className="rounded-xl border-slate-100 shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
              <Users className="h-4 w-4 text-slate-400" />
              Members
              <span className="text-[13px] font-normal text-slate-400">
                ({members.length})
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-50">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-slate-100 text-[11px] font-medium text-slate-600">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-slate-900">
                    {member.name}
                  </p>
                  <p className="text-[12px] text-slate-400">{member.email}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[12px] text-slate-400">
                    Joined {formatDate(member.joinedAt)}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Active {formatRelative(member.lastActive)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 ${ROLE_BADGE_STYLES[member.role]}`}
                >
                  {member.role}
                </Badge>
                {member.role !== "OWNER" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {ROLE_OPTIONS.filter(
                        (r) => r.value !== member.role
                      ).map((role) => (
                        <DropdownMenuItem
                          key={role.value}
                          onClick={() =>
                            handleRoleChange(member.id, role.value)
                          }
                        >
                          <Shield className="mr-2 h-3.5 w-3.5" />
                          Make {role.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setRemoveMember(member)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role reference */}
      <Card className="rounded-xl border-slate-100 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-semibold text-slate-900">
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-2 text-left font-medium text-slate-400 uppercase tracking-wider">
                    Permission
                  </th>
                  <th className="pb-2 text-center font-medium text-slate-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="pb-2 text-center font-medium text-slate-400 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="pb-2 text-center font-medium text-slate-400 uppercase tracking-wider">
                    Builder
                  </th>
                  <th className="pb-2 text-center font-medium text-slate-400 uppercase tracking-wider">
                    Viewer
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {[
                  ["Create/Edit Agents", true, true, true, false],
                  ["Deploy Agents", true, true, false, false],
                  ["Manage Workflows", true, true, true, false],
                  ["View Analytics", true, true, true, true],
                  ["Manage Team", true, true, false, false],
                  ["Billing & Settings", true, false, false, false],
                ].map(([label, ...perms]) => (
                  <tr
                    key={label as string}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-2 text-[13px] text-slate-700">
                      {label as string}
                    </td>
                    {(perms as boolean[]).map((perm, i) => (
                      <td key={i} className="py-2 text-center">
                        {perm ? (
                          <span className="text-sage-500">&#10003;</span>
                        ) : (
                          <span className="text-slate-200">&mdash;</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Remove confirmation */}
      <AlertDialog
        open={!!removeMember}
        onOpenChange={() => setRemoveMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{removeMember?.name}</strong> ({removeMember?.email})
              from this workspace? They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => removeMember && handleRemove(removeMember)}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
