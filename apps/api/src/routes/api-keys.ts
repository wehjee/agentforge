import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, requireWorkspace, requireRole } from "../middleware/auth";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "../services/apikey-service";

const router = Router();

router.use(requireAuth, requireWorkspace);

// POST /api/v1/api-keys — Create API key
router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== "string") {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "name is required",
          },
        });
        return;
      }

      const apiKey = await createApiKey({
        name,
        workspaceId: req.workspaceId!,
      });

      res.status(201).json({ success: true, data: apiKey });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/api-keys — List API keys
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await listApiKeys(req.workspaceId!);
    res.json({ success: true, data: keys });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/api-keys/:id — Revoke API key
router.delete(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await revokeApiKey(
        req.params.id as string,
        req.workspaceId!
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
