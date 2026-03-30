import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/errors";
import { validateApiKey } from "../services/apikey-service";
import { verifyToken } from "../services/auth-service";

/**
 * Middleware that accepts either a Bearer JWT token or an API key (af_...) for auth.
 * Used for external API access where session-based auth isn't available.
 */
export async function requireApiAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("No authentication token provided");
    }

    const token = authHeader.slice(7);

    // Check if it's an API key (starts with af_)
    if (token.startsWith("af_")) {
      const result = await validateApiKey(token);

      if (!result) {
        throw new UnauthorizedError("Invalid API key");
      }

      req.workspaceId = result.workspaceId;
      // For API key auth, userId is not set — external access
      next();
      return;
    }

    // Otherwise, treat as a JWT token
    try {
      const payload = verifyToken(token);
      req.userId = payload.userId;
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }

    // For JWT auth, workspace still needs to be determined
    const workspaceId = req.headers["x-workspace-id"] as string;
    if (workspaceId) {
      req.workspaceId = workspaceId;
    }

    next();
  } catch (error) {
    next(error);
  }
}
