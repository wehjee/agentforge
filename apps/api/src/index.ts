import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/error-handler";
import { logger } from "./utils/logger";
import authRoutes from "./routes/auth";
import agentRoutes from "./routes/agents";
import chatRoutes from "./routes/chat";
import versionRoutes from "./routes/versions";
import workspaceRoutes from "./routes/workspace";
import workflowRoutes from "./routes/workflows";
import toolRoutes from "./routes/tools";
import knowledgeRoutes from "./routes/knowledge";
import deploymentRoutes, { deploymentManagementRouter } from "./routes/deployments";
import apiKeyRoutes from "./routes/api-keys";
import slackRoutes from "./routes/slack";
import externalChatRoutes from "./routes/external-chat";
import analyticsRoutes from "./routes/analytics";

const app = express();
const port = parseInt(process.env.PORT || "4000", 10);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" })); // Increased for file uploads
app.use(cookieParser());
app.use(morgan("dev"));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/agents", agentRoutes);
app.use("/api/v1/agents", chatRoutes);
app.use("/api/v1/agents", versionRoutes);
app.use("/api/v1/workspace", workspaceRoutes);
app.use("/api/v1/workflows", workflowRoutes);
app.use("/api/v1/tools", toolRoutes);
app.use("/api/v1/knowledge", knowledgeRoutes);
app.use("/api/v1/agents", deploymentRoutes);
app.use("/api/v1/deployments", deploymentManagementRouter);
app.use("/api/v1/api-keys", apiKeyRoutes);
app.use("/api/v1/slack", slackRoutes);
app.use("/api/v1/external/agents", externalChatRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`API server running on port ${port}`);
});

export default app;
