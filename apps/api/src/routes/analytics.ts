import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, requireWorkspace } from "../middleware/auth";
import {
  getOverviewMetrics,
  getConversationLogs,
  getConversationDetail,
  getTokenUsageBreakdown,
} from "../services/analytics-service";
import type { Channel, ConvStatus } from "@prisma/client";

const router = Router();

router.use(requireAuth, requireWorkspace);

// GET /api/v1/analytics/overview
router.get("/overview", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await getOverviewMetrics(String(req.workspaceId));
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/analytics/conversations
router.get("/conversations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getConversationLogs({
      workspaceId: String(req.workspaceId),
      agentId: req.query.agentId ? String(req.query.agentId) : undefined,
      channel: req.query.channel ? String(req.query.channel) as Channel : undefined,
      status: req.query.status ? String(req.query.status) as ConvStatus : undefined,
      dateFrom: req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined,
      dateTo: req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      page: req.query.page ? parseInt(String(req.query.page), 10) : undefined,
      pageSize: req.query.pageSize ? parseInt(String(req.query.pageSize), 10) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/analytics/conversations/:id
router.get("/conversations/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await getConversationDetail(String(req.params.id));
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }
    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/analytics/usage
router.get("/usage", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
    const usage = await getTokenUsageBreakdown(String(req.workspaceId), days);
    res.json({ success: true, data: usage });
  } catch (error) {
    next(error);
  }
});

export default router;
