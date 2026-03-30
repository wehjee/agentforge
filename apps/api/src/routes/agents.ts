import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, requireWorkspace } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { createAgentSchema, updateAgentSchema } from "@shared/types";
import {
  createAgent,
  listAgents,
  getAgent,
  updateAgent,
  deleteAgent,
} from "../services/agent-service";
import type { AgentStatus } from "@prisma/client";

const router = Router();

router.use(requireAuth, requireWorkspace);

router.post(
  "/",
  validate(createAgentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = await createAgent({
        ...req.body,
        workspaceId: req.workspaceId!,
        createdBy: req.userId!,
      });

      res.status(201).json({ success: true, data: agent });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query as Record<string, string | undefined>;

    const result = await listAgents({
      workspaceId: req.workspaceId!,
      search,
      status: status as AgentStatus | undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await getAgent(req.params.id as string, req.workspaceId!);
    res.json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  validate(updateAgentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agent = await updateAgent(
        req.params.id as string,
        req.workspaceId!,
        req.userId!,
        req.body
      );
      res.json({ success: true, data: agent });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const permanent = req.query.permanent === "true";
      const result = await deleteAgent(req.params.id as string, req.workspaceId!, permanent);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
