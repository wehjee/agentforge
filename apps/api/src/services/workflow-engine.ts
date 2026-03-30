import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import type { Prisma } from "@prisma/client";

interface CanvasNode {
  id: string;
  type: string;
  data: {
    label: string;
    nodeType: string;
    config: Record<string, unknown>;
  };
  position: { x: number; y: number };
}

interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface Canvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface RunContext {
  variables: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
}

/**
 * Workflow Engine — orchestrates multi-agent workflow execution.
 *
 * Processes nodes in topological order, handles parallel branches,
 * manages shared context, and logs each step.
 */
export class WorkflowEngine {
  private canvas: Canvas;
  private workflowId: string;
  private runId: string;
  private context: RunContext;

  constructor(
    canvas: Canvas,
    workflowId: string,
    runId: string,
    initialContext: Record<string, unknown> = {}
  ) {
    this.canvas = canvas;
    this.workflowId = workflowId;
    this.runId = runId;
    this.context = {
      variables: { ...initialContext },
      nodeOutputs: {},
    };
  }

  /**
   * Execute the workflow run.
   */
  async execute(): Promise<void> {
    try {
      await this.updateRunStatus("RUNNING");

      const executionOrder = this.topologicalSort();

      for (const nodeId of executionOrder) {
        const node = this.canvas.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        // Check for parallel nodes — execute branches concurrently
        if (node.data.nodeType === "parallel") {
          await this.executeParallelNode(node);
        } else {
          await this.executeNode(node);
        }
      }

      await this.updateRunStatus("COMPLETED");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Workflow run ${this.runId} failed: ${errorMessage}`);

      await prisma.workflowRun.update({
        where: { id: this.runId },
        data: {
          status: "FAILED",
          error: errorMessage,
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Execute a single node and log the step.
   */
  private async executeNode(node: CanvasNode): Promise<unknown> {
    const startTime = Date.now();

    const step = await prisma.workflowStep.create({
      data: {
        nodeId: node.id,
        nodeName: node.data.label,
        nodeType: node.data.nodeType,
        status: "RUNNING",
        input: { config: node.data.config, variables: this.context.variables } as unknown as Prisma.InputJsonObject,
        runId: this.runId,
      },
    });

    try {
      const output = await this.processNode(node);
      const duration = Date.now() - startTime;

      this.context.nodeOutputs[node.id] = output;

      await prisma.workflowStep.update({
        where: { id: step.id },
        data: {
          status: "COMPLETED",
          output: (output ?? null) as unknown as Prisma.InputJsonValue,
          duration_ms: duration,
          completedAt: new Date(),
        },
      });

      return output;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await prisma.workflowStep.update({
        where: { id: step.id },
        data: {
          status: "FAILED",
          error: errorMessage,
          duration_ms: duration,
          completedAt: new Date(),
        },
      });

      // Retry logic based on node config
      const retryCount =
        (node.data.config?.retryCount as number) ?? 0;
      if (retryCount > 0) {
        for (let attempt = 1; attempt <= retryCount; attempt++) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
          await this.sleep(backoffMs);

          try {
            const retryOutput = await this.processNode(node);
            this.context.nodeOutputs[node.id] = retryOutput;

            await prisma.workflowStep.update({
              where: { id: step.id },
              data: {
                status: "COMPLETED",
                output: (retryOutput ?? null) as unknown as Prisma.InputJsonValue,
                duration_ms: Date.now() - startTime,
                completedAt: new Date(),
                error: null,
              },
            });

            return retryOutput;
          } catch {
            // Continue retry loop
          }
        }
      }

      throw error;
    }
  }

  /**
   * Execute a parallel node — runs all branches concurrently.
   */
  private async executeParallelNode(node: CanvasNode): Promise<void> {
    const mergeStrategy =
      (node.data.config?.mergeStrategy as string) ?? "wait_all";

    // Find outgoing edges from this node
    const branchEdges = this.canvas.edges.filter(
      (e) => e.source === node.id
    );
    const branchNodeIds = branchEdges.map((e) => e.target);

    const step = await prisma.workflowStep.create({
      data: {
        nodeId: node.id,
        nodeName: node.data.label,
        nodeType: "parallel",
        status: "RUNNING",
        input: { branches: branchNodeIds } as Prisma.JsonObject,
        runId: this.runId,
      },
    });

    const startTime = Date.now();

    try {
      const branchPromises = branchNodeIds.map(async (branchId) => {
        const branchNode = this.canvas.nodes.find((n) => n.id === branchId);
        if (!branchNode) return null;
        return this.executeNode(branchNode);
      });

      let results: unknown[];
      if (mergeStrategy === "wait_first") {
        const first = await Promise.race(branchPromises);
        results = [first];
      } else {
        results = await Promise.all(branchPromises);
      }

      const output = { mergeStrategy, results };
      this.context.nodeOutputs[node.id] = output;

      await prisma.workflowStep.update({
        where: { id: step.id },
        data: {
          status: "COMPLETED",
          output: output as unknown as unknown as Prisma.InputJsonValue,
          duration_ms: Date.now() - startTime,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await prisma.workflowStep.update({
        where: { id: step.id },
        data: {
          status: "FAILED",
          error: errorMessage,
          duration_ms: Date.now() - startTime,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Process a node based on its type.
   */
  private async processNode(node: CanvasNode): Promise<unknown> {
    const nodeType = node.data.nodeType;
    const config = node.data.config;

    switch (nodeType) {
      case "trigger":
        return this.processTrigger(config);

      case "agent":
        return this.processAgent(config);

      case "router":
        return this.processRouter(node, config);

      case "conditional":
        return this.processConditional(node, config);

      case "transform":
        return this.processTransform(config);

      case "human":
        return this.processHumanInTheLoop(config);

      case "output":
        return this.processOutput(config);

      default:
        return { nodeType, message: "Passthrough — no processor defined" };
    }
  }

  private async processTrigger(
    config: Record<string, unknown>
  ): Promise<unknown> {
    // Trigger data is set at run creation — just pass it through
    return {
      triggerType: config.triggerType ?? "manual",
      data: this.context.variables,
    };
  }

  private async processAgent(
    config: Record<string, unknown>
  ): Promise<unknown> {
    const agentId = config.agentId as string;
    if (!agentId) {
      return { error: "No agent configured" };
    }

    // Resolve input mappings
    const inputMappings = (config.inputMappings as Record<string, string>) ?? {};
    const resolvedInputs: Record<string, unknown> = {};
    for (const [key, mapping] of Object.entries(inputMappings)) {
      resolvedInputs[key] = this.resolveVariable(mapping);
    }

    // In a full implementation, this would call the agent runtime.
    // For now, log the intent and return a placeholder.
    return {
      agentId,
      inputs: resolvedInputs,
      message: `Agent ${agentId} would be invoked here with the resolved inputs.`,
    };
  }

  private async processRouter(
    node: CanvasNode,
    config: Record<string, unknown>
  ): Promise<unknown> {
    const mode = config.mode as string;
    const conditions = (config.conditions as Array<{
      field: string;
      operator: string;
      value: string;
      targetHandle: string;
    }>) ?? [];

    if (mode === "llm") {
      return { route: "default", message: "LLM classification not yet implemented" };
    }

    // Rule-based routing
    for (const condition of conditions) {
      const fieldValue = this.resolveVariable(condition.field);
      let matched = false;

      switch (condition.operator) {
        case "equals":
          matched = String(fieldValue) === condition.value;
          break;
        case "contains":
          matched = String(fieldValue).includes(condition.value);
          break;
        case "gt":
          matched = Number(fieldValue) > Number(condition.value);
          break;
        case "lt":
          matched = Number(fieldValue) < Number(condition.value);
          break;
        case "exists":
          matched = fieldValue !== undefined && fieldValue !== null;
          break;
        case "regex":
          matched = new RegExp(condition.value).test(String(fieldValue));
          break;
      }

      if (matched) {
        return { route: condition.targetHandle, matched: true };
      }
    }

    return { route: "default", matched: false };
  }

  private async processConditional(
    node: CanvasNode,
    config: Record<string, unknown>
  ): Promise<unknown> {
    const expression = config.expression as string;
    if (!expression) {
      return { branch: "false", reason: "No expression configured" };
    }

    // Simple expression evaluation against context
    try {
      const result = this.evaluateExpression(expression);
      return { branch: result ? "true" : "false", expression, result };
    } catch {
      return { branch: "false", reason: "Expression evaluation failed" };
    }
  }

  private async processTransform(
    config: Record<string, unknown>
  ): Promise<unknown> {
    const code = config.code as string;
    if (!code) {
      return this.context.variables;
    }

    try {
      // Sandboxed transform — uses Function constructor with limited scope
      const transformFn = new Function(
        "context",
        "nodeOutputs",
        `"use strict"; ${code}`
      );
      const result = transformFn(
        { ...this.context.variables },
        { ...this.context.nodeOutputs }
      );
      return result;
    } catch (error) {
      return {
        error: "Transform failed",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async processHumanInTheLoop(
    config: Record<string, unknown>
  ): Promise<unknown> {
    // In a full implementation, this would pause the run and wait for human input.
    // For now, mark it as paused.
    await prisma.workflowRun.update({
      where: { id: this.runId },
      data: { status: "PAUSED" },
    });

    return {
      message: config.message ?? "Awaiting human input",
      status: "paused",
      approvalButtons: config.approvalButtons ?? [
        { label: "Approve", value: "approved" },
        { label: "Reject", value: "rejected" },
      ],
    };
  }

  private async processOutput(
    config: Record<string, unknown>
  ): Promise<unknown> {
    const outputType = config.outputType as string;

    return {
      outputType: outputType ?? "return",
      data: this.context.nodeOutputs,
      variables: this.context.variables,
    };
  }

  /**
   * Resolve a variable reference from the context.
   * Supports dot notation like "nodeOutputs.node1.result"
   */
  private resolveVariable(path: string): unknown {
    const parts = path.split(".");
    let current: unknown = {
      ...this.context.variables,
      nodeOutputs: this.context.nodeOutputs,
    };

    for (const part of parts) {
      if (current == null || typeof current !== "object") return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Simple expression evaluator.
   */
  private evaluateExpression(expression: string): boolean {
    try {
      const fn = new Function(
        "ctx",
        `"use strict"; return Boolean(${expression});`
      );
      return fn({
        ...this.context.variables,
        nodeOutputs: this.context.nodeOutputs,
      });
    } catch {
      return false;
    }
  }

  /**
   * Topological sort of nodes based on edges.
   * Returns node IDs in execution order.
   */
  private topologicalSort(): string[] {
    const nodes = this.canvas.nodes;
    const edges = this.canvas.edges;

    const inDegree: Record<string, number> = {};
    const adjacency: Record<string, string[]> = {};

    for (const node of nodes) {
      inDegree[node.id] = 0;
      adjacency[node.id] = [];
    }

    for (const edge of edges) {
      adjacency[edge.source].push(edge.target);
      inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
    }

    // Start with nodes that have no incoming edges
    const queue: string[] = [];
    for (const node of nodes) {
      if (inDegree[node.id] === 0) {
        queue.push(node.id);
      }
    }

    const sorted: string[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      sorted.push(nodeId);

      for (const neighbor of adjacency[nodeId]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    return sorted;
  }

  private async updateRunStatus(
    status: "RUNNING" | "COMPLETED" | "FAILED"
  ): Promise<void> {
    await prisma.workflowRun.update({
      where: { id: this.runId },
      data: {
        status,
        context: {
          variables: this.context.variables,
          nodeOutputs: this.context.nodeOutputs,
        } as Prisma.JsonObject,
        ...(status !== "RUNNING" && { completedAt: new Date() }),
      },
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Trigger a workflow run.
 */
export async function triggerWorkflowRun(
  workflowId: string,
  triggerType: string,
  triggerData: Record<string, unknown> = {},
  context: Record<string, unknown> = {}
) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  const run = await prisma.workflowRun.create({
    data: {
      workflowId,
      triggerType,
      triggerData: triggerData as Prisma.JsonObject,
      context: context as Prisma.JsonObject,
      status: "QUEUED",
    },
  });

  // Execute asynchronously
  const canvas = workflow.canvas as unknown as Canvas;
  const engine = new WorkflowEngine(canvas, workflowId, run.id, {
    ...context,
    ...triggerData,
  });

  // Fire and forget — in production, this would be enqueued via BullMQ
  engine.execute().catch((err) => {
    logger.error(`Workflow run ${run.id} failed: ${err.message}`);
  });

  return run;
}
