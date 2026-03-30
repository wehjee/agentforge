import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { verifyToken } from "../services/auth-service";
import { prisma } from "../lib/prisma";
import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      workspaceId?: string;
      memberRole?: Role;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new UnauthorizedError("No authentication token provided");
    }

    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError("Invalid or expired token"));
    }
  }
}

export async function requireWorkspace(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const workspaceId = req.headers["x-workspace-id"] as string;

    if (!workspaceId) {
      throw new ForbiddenError("Workspace ID is required (x-workspace-id header)");
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.userId!,
          workspaceId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    req.workspaceId = workspaceId;
    req.memberRole = member.role;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.memberRole || !roles.includes(req.memberRole)) {
      next(new ForbiddenError("Insufficient permissions"));
      return;
    }
    next();
  };
}
