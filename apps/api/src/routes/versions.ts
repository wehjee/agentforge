import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, requireWorkspace } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../utils/errors";
import type { Prisma } from "@prisma/client";

const router = Router();

router.use(requireAuth, requireWorkspace);

// GET /api/v1/agents/:id/versions — list all versions
router.get(
  "/:id/versions",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = await prisma.agent.findFirst({
        where: { id: req.params.id as string, workspaceId: req.workspaceId! },
      });

      if (!agent) {
        throw new NotFoundError("Agent");
      }

      const versions = await prisma.agentVersion.findMany({
        where: { agentId: agent.id },
        orderBy: { version: "desc" },
      });

      res.json({ success: true, data: versions });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/agents/:id/versions/:versionId — get a specific version
router.get(
  "/:id/versions/:versionId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const version = await prisma.agentVersion.findFirst({
        where: {
          id: req.params.versionId as string,
          agentId: req.params.id as string,
        },
      });

      if (!version) {
        throw new NotFoundError("Version");
      }

      res.json({ success: true, data: version });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/agents/:id/versions/:versionId/restore — restore a version
router.post(
  "/:id/versions/:versionId/restore",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = await prisma.agent.findFirst({
        where: { id: req.params.id as string, workspaceId: req.workspaceId! },
      });

      if (!agent) {
        throw new NotFoundError("Agent");
      }

      const version = await prisma.agentVersion.findFirst({
        where: {
          id: req.params.versionId as string,
          agentId: agent.id,
        },
      });

      if (!version) {
        throw new NotFoundError("Version");
      }

      const newVersion = agent.currentVersion + 1;

      const updated = await prisma.agent.update({
        where: { id: agent.id },
        data: {
          config: version.config as Prisma.JsonObject,
          currentVersion: newVersion,
        },
      });

      await prisma.agentVersion.create({
        data: {
          version: newVersion,
          config: version.config as Prisma.JsonObject,
          changelog: `Restored from version ${version.version}`,
          agentId: agent.id,
          createdBy: req.userId!,
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
