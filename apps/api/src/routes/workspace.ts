import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, requireWorkspace } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../utils/errors";

const router = Router();

router.use(requireAuth, requireWorkspace);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
      include: {
        _count: {
          select: {
            members: true,
            agents: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace");
    }

    res.json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/members",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: req.workspaceId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
