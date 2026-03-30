export type Plan = "FREE" | "PRO" | "TEAM" | "ENTERPRISE";
export type Role = "OWNER" | "ADMIN" | "BUILDER" | "VIEWER";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  role: Role;
  userId: string;
  workspaceId: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
}
