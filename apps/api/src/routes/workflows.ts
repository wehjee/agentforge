import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, requireWorkspace } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { createWorkflowSchema, updateWorkflowSchema, triggerWorkflowSchema } from "@shared/types";
import {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  listWorkflowRuns,
  getWorkflowRun,
} from "../services/workflow-service";
import { triggerWorkflowRun } from "../services/workflow-engine";
import type { AgentStatus } from "@prisma/client";

const router = Router();

router.use(requireAuth, requireWorkspace);

// POST /api/v1/workflows — create workflow
router.post(
  "/",
  validate(createWorkflowSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workflow = await createWorkflow({
        ...req.body,
        workspaceId: String(req.workspaceId),
      });
      res.status(201).json({ success: true, data: workflow });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/workflows — list workflows
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search ? String(req.query.search) : undefined;
    const status = req.query.status ? String(req.query.status) as AgentStatus : undefined;
    const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const sortBy = req.query.sortBy ? String(req.query.sortBy) : undefined;
    const sortOrder = req.query.sortOrder ? String(req.query.sortOrder) as "asc" | "desc" : undefined;

    const result = await listWorkflows({
      workspaceId: String(req.workspaceId),
      search,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/workflows/:id — get workflow detail
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await getWorkflow(String(req.params.id), String(req.workspaceId));
    res.json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/workflows/:id — update workflow
router.put(
  "/:id",
  validate(updateWorkflowSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workflow = await updateWorkflow(
        String(req.params.id),
        String(req.workspaceId),
        req.body
      );
      res.json({ success: true, data: workflow });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/workflows/:id — delete workflow
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const permanent = req.query.permanent === "true";
      const result = await deleteWorkflow(String(req.params.id), String(req.workspaceId), permanent);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/workflows/:id/run — trigger workflow run
router.post(
  "/:id/run",
  validate(triggerWorkflowSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { triggerType, triggerData, context } = req.body;
      const run = await triggerWorkflowRun(
        String(req.params.id),
        triggerType ?? "manual",
        triggerData ?? {},
        context ?? {}
      );
      res.status(201).json({ success: true, data: run });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/workflows/:id/runs — list runs
router.get(
  "/:id/runs",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const result = await listWorkflowRuns(
        String(req.params.id),
        String(req.workspaceId),
        page,
        limit
      );
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/workflows/:id/runs/:runId — get run detail
router.get(
  "/:id/runs/:runId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await getWorkflowRun(
        String(req.params.runId),
        String(req.params.id),
        String(req.workspaceId)
      );
      res.json({ success: true, data: run });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
