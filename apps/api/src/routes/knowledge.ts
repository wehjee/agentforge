import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, requireWorkspace } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { createKBSchema, updateKBSchema } from "@shared/types";
import {
  createKB,
  listKBs,
  getKB,
  updateKB,
  deleteKB,
  uploadDocument,
  listDocuments,
  deleteDocument,
  getDocumentChunks,
} from "../services/kb-service";
import { queryKnowledgeBase } from "../services/rag-service";

const router = Router();

router.use(requireAuth, requireWorkspace);

// POST /api/v1/knowledge — Create knowledge base
router.post(
  "/",
  validate(createKBSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const kb = await createKB({
        ...req.body,
        workspaceId: req.workspaceId!,
      });
      res.status(201).json({ success: true, data: kb });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/knowledge — List knowledge bases
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page, limit } = req.query as Record<string, string | undefined>;
    const result = await listKBs({
      workspaceId: req.workspaceId!,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/knowledge/:id — Get KB detail
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kb = await getKB(req.params.id as string, req.workspaceId!);
    res.json({ success: true, data: kb });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/knowledge/:id — Update KB
router.put(
  "/:id",
  validate(updateKBSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const kb = await updateKB(req.params.id as string, req.workspaceId!, req.body);
      res.json({ success: true, data: kb });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/knowledge/:id — Delete KB
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteKB(req.params.id as string, req.workspaceId!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// ── Document management routes ───────────────────────────────────────────

// POST /api/v1/knowledge/:id/documents — Upload document
router.post("/:id/documents", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Handle raw body upload (file sent as multipart or raw)
    // We accept the file as base64 in the JSON body or as raw form data
    const { filename, content } = req.body;

    if (!filename) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "filename is required" },
      });
      return;
    }

    if (!content) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "content (base64-encoded file) is required" },
      });
      return;
    }

    const buffer = Buffer.from(content, "base64");

    const doc = await uploadDocument({
      knowledgeBaseId: req.params.id as string,
      workspaceId: req.workspaceId!,
      file: {
        originalname: filename,
        buffer,
        size: buffer.length,
      },
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/knowledge/:id/documents — List documents
router.get("/:id/documents", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await listDocuments(req.params.id as string, req.workspaceId!);
    res.json({ success: true, data: docs });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/knowledge/:kbId/documents/:docId — Delete document
router.delete("/:kbId/documents/:docId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteDocument(
      req.params.docId as string,
      req.params.kbId as string,
      req.workspaceId!
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/knowledge/:kbId/documents/:docId/chunks — Get document chunks
router.get("/:kbId/documents/:docId/chunks", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chunks = await getDocumentChunks(
      req.params.docId as string,
      req.params.kbId as string,
      req.workspaceId!
    );
    res.json({ success: true, data: chunks });
  } catch (error) {
    next(error);
  }
});

// ── Retrieval test ───────────────────────────────────────────────────────

// POST /api/v1/knowledge/:id/query — Test retrieval
router.post("/:id/query", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, topK, similarityThreshold } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "query is required" },
      });
      return;
    }

    // Verify KB exists
    await getKB(req.params.id as string, req.workspaceId!);

    const chunks = await queryKnowledgeBase({
      knowledgeBaseId: req.params.id as string,
      query,
      topK: topK || 5,
      similarityThreshold: similarityThreshold || 0.3,
    });

    res.json({
      success: true,
      data: {
        query,
        chunks,
        totalFound: chunks.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
