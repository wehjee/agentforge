import type { Role } from "@shared/types";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  joinedAt: string;
  lastActive: string;
}

export const ROLE_BADGE_STYLES: Record<Role, string> = {
  OWNER: "bg-violet-50 text-violet-700 border-violet-200",
  ADMIN: "bg-sage-50 text-sage-600 border-sage-100",
  BUILDER: "bg-slate-100 text-slate-600 border-slate-200",
  VIEWER: "bg-slate-50 text-slate-400 border-slate-100",
};

export const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: "ADMIN", label: "Admin", description: "Full access, manage team" },
  { value: "BUILDER", label: "Builder", description: "Create and edit agents" },
  { value: "VIEWER", label: "Viewer", description: "View-only access" },
];

export function getMockTeamMembers(): TeamMember[] {
  return [
    {
      id: "user_1",
      name: "Alice Chen",
      email: "alice@company.com",
      role: "OWNER",
      avatarUrl: null,
      joinedAt: new Date(Date.now() - 86400000 * 120).toISOString(),
      lastActive: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: "user_2",
      name: "Bob Martinez",
      email: "bob@company.com",
      role: "ADMIN",
      avatarUrl: null,
      joinedAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      lastActive: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "user_3",
      name: "Carol Zhang",
      email: "carol@company.com",
      role: "ADMIN",
      avatarUrl: null,
      joinedAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      lastActive: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "user_4",
      name: "David Kim",
      email: "david@company.com",
      role: "BUILDER",
      avatarUrl: null,
      joinedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      lastActive: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "user_5",
      name: "Eva Johnson",
      email: "eva@company.com",
      role: "VIEWER",
      avatarUrl: null,
      joinedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      lastActive: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];
}
