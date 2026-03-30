import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import {
  hashPassword,
  verifyPassword,
  generateToken,
} from "../services/auth-service";
import { validate } from "../middleware/validation";
import { requireAuth } from "../middleware/auth";
import { loginSchema, registerSchema } from "@shared/types";
import { UnauthorizedError, ValidationError } from "../utils/errors";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, workspaceName } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new ValidationError("An account with this email already exists");
      }

      const passwordHash = await hashPassword(password);
      const slug = workspaceName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const existingWorkspace = await prisma.workspace.findUnique({
        where: { slug },
      });
      const finalSlug = existingWorkspace
        ? `${slug}-${Date.now().toString(36)}`
        : slug;

      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
        },
      });

      const workspace = await prisma.workspace.create({
        data: {
          name: workspaceName,
          slug: finalSlug,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          role: "OWNER",
          userId: user.id,
          workspaceId: workspace.id,
        },
      });

      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
          },
          workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            plan: workspace.plan,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: {
              workspace: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  plan: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedError("Invalid email or password");
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedError("Invalid email or password");
      }

      const token = generateToken(user.id);

      const workspaces = user.memberships.map((m) => ({
        ...m.workspace,
        role: m.role,
      }));

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
          },
          workspaces,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          memberships: {
            include: {
              workspace: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  plan: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          workspaces: user.memberships.map((m) => ({
            ...m.workspace,
            role: m.role,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
