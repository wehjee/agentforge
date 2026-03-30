import type { WorkspaceMember } from "./workspace";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithMemberships extends User {
  memberships: (WorkspaceMember & {
    workspace: {
      id: string;
      name: string;
      slug: string;
      plan: string;
    };
  })[];
}
