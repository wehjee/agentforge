import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, requireWorkspace } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { createToolSchema, updateToolSchema } from "@shared/types";
import { createTool, listTools, getTool, updateTool, deleteTool } from "../services/tool-service";
import { executeTool } from "../services/tool-executor";
import type { ToolType } from "@prisma/client";

const router = Router();

router.use(requireAuth, requireWorkspace);

// POST /api/v1/tools/test-inline — Test a tool definition without saving it
// Must be before /:id routes to avoid matching "test-inline" as an id
router.post("/test-inline", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, schema, config, input } = req.body;

    const result = await executeTool({
      toolId: "inline_test",
      toolType: type || "CODE",
      schema: schema || {},
      config: config || {},
      input: input || {},
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/tools — Create custom tool
router.post(
  "/",
  validate(createToolSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tool = await createTool({
        ...req.body,
        workspaceId: req.workspaceId!,
      });
      res.status(201).json({ success: true, data: tool });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/tools — List tools (builtin + workspace)
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, type, page, limit } = req.query as Record<string, string | undefined>;
    const result = await listTools({
      workspaceId: req.workspaceId!,
      search,
      type: type as ToolType | undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/tools/:id — Get tool detail
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tool = await getTool(req.params.id as string, req.workspaceId!);
    res.json({ success: true, data: tool });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/tools/:id — Update tool
router.put(
  "/:id",
  validate(updateToolSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tool = await updateTool(req.params.id as string, req.workspaceId!, req.body);
      res.json({ success: true, data: tool });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/tools/:id — Delete tool
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteTool(req.params.id as string, req.workspaceId!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/tools/:id/test — Test a tool with sample input
router.post("/:id/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tool = await getTool(req.params.id as string, req.workspaceId!);
    const { input } = req.body;

    const result = await executeTool({
      toolId: tool.type === "BUILTIN"
        ? tool.name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")
        : tool.id,
      toolType: tool.type,
      schema: tool.schema as Record<string, unknown>,
      config: tool.config as Record<string, unknown>,
      input: input || {},
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
