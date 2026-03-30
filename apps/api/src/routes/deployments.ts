import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, requireWorkspace } from "../middleware/auth";
import {
  createDeployment,
  listDeployments,
  updateDeployment,
  deactivateDeployment,
  promoteVersion,
} from "../services/deployment-service";
import type { Channel, Env } from "@prisma/client";

const router = Router();

router.use(requireAuth, requireWorkspace);

// POST /api/v1/agents/:id/deploy — Deploy agent to channel
router.post(
  "/:id/deploy",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channel, environment, config } = req.body;

      if (!channel || !environment) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "channel and environment are required",
          },
        });
        return;
      }

      const deployment = await createDeployment({
        agentId: req.params.id as string,
        workspaceId: req.workspaceId!,
        channel: channel as Channel,
        environment: environment as Env,
        config: config || {},
      });

      res.status(201).json({ success: true, data: deployment });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/agents/:id/deployments — List deployments
router.get(
  "/:id/deployments",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deployments = await listDeployments(
        req.params.id as string,
        req.workspaceId!
      );

      res.json({ success: true, data: deployments });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/agents/:id/promote — Promote version between environments
router.post(
  "/:id/promote",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fromEnvironment, toEnvironment } = req.body;

      if (!fromEnvironment || !toEnvironment) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "fromEnvironment and toEnvironment are required",
          },
        });
        return;
      }

      const promoted = await promoteVersion({
        agentId: req.params.id as string,
        workspaceId: req.workspaceId!,
        fromEnvironment: fromEnvironment as Env,
        toEnvironment: toEnvironment as Env,
      });

      res.json({ success: true, data: promoted });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

// Separate router for deployment management (not nested under agents)
export const deploymentManagementRouter = Router();

deploymentManagementRouter.use(requireAuth, requireWorkspace);

// PUT /api/v1/deployments/:id — Update deployment config
deploymentManagementRouter.put(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { config, isActive } = req.body;

      const deployment = await updateDeployment(
        req.params.id as string,
        req.workspaceId!,
        { config, isActive }
      );

      res.json({ success: true, data: deployment });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/deployments/:id — Deactivate deployment
deploymentManagementRouter.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deployment = await deactivateDeployment(
        req.params.id as string,
        req.workspaceId!
      );

      res.json({ success: true, data: deployment });
    } catch (error) {
      next(error);
    }
  }
);
