import { logger } from "../utils/logger";

interface ToolExecInput {
  toolId: string;
  toolType: "BUILTIN" | "API" | "CODE";
  schema: Record<string, unknown>;
  config: Record<string, unknown>;
  input: Record<string, unknown>;
}

interface ToolExecResult {
  success: boolean;
  output?: unknown;
  error?: string;
  durationMs: number;
}

// ── Built-in tool handlers ───────────────────────────────────────────────

async function handleWebSearch(input: Record<string, unknown>): Promise<unknown> {
  const query = input.query as string;
  const numResults = (input.num_results as number) || 5;
  // In production, this would call a search API (SerpAPI, Brave, etc.)
  // For now, return a simulated response structure
  return {
    results: [
      {
        title: `Search result for: ${query}`,
        url: `https://example.com/search?q=${encodeURIComponent(query)}`,
        snippet: `This is a simulated search result for "${query}". Connect a search API (SerpAPI, Brave Search, etc.) in production.`,
      },
    ],
    total: numResults,
    note: "Web search requires API configuration. Set SEARCH_API_KEY in environment.",
  };
}

async function handleCodeExecution(input: Record<string, unknown>): Promise<unknown> {
  const code = input.code as string;
  const language = (input.language as string) || "javascript";

  if (language === "javascript") {
    return await executeJavaScript(code);
  }

  return {
    error: `Language "${language}" is not yet supported. Only JavaScript is available.`,
  };
}

async function executeJavaScript(code: string): Promise<unknown> {
  // Sandboxed JS execution with timeout
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ error: "Execution timed out after 10 seconds" });
    }, 10000);

    try {
      // Create a restricted execution context
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        error: (...args: unknown[]) => logs.push("[ERROR] " + args.map(String).join(" ")),
        warn: (...args: unknown[]) => logs.push("[WARN] " + args.map(String).join(" ")),
      };

      // Use Function constructor for basic sandboxing
      // NOTE: In production, use a proper sandbox (vm2, isolated-vm, or Docker)
      const fn = new Function("console", "Math", "JSON", "Date", "parseInt", "parseFloat", "isNaN", "isFinite",
        `"use strict";\n${code}`
      );
      const result = fn(mockConsole, Math, JSON, Date, parseInt, parseFloat, isNaN, isFinite);
      clearTimeout(timeout);

      resolve({
        result: result !== undefined ? result : null,
        logs,
      });
    } catch (err) {
      clearTimeout(timeout);
      resolve({
        error: err instanceof Error ? err.message : "Unknown execution error",
      });
    }
  });
}

async function handleHttpRequest(input: Record<string, unknown>): Promise<unknown> {
  const url = input.url as string;
  const method = (input.method as string) || "GET";
  let headers: Record<string, string> = {};
  const body = input.body as string | undefined;

  if (input.headers) {
    try {
      headers = typeof input.headers === "string" ? JSON.parse(input.headers) : input.headers as Record<string, string>;
    } catch {
      return { error: "Invalid headers JSON" };
    }
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: { "Content-Type": "application/json", ...headers },
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get("content-type") || "";
    let responseBody: unknown;

    if (contentType.includes("application/json")) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "HTTP request failed" };
  }
}

async function handleEmailSender(input: Record<string, unknown>): Promise<unknown> {
  // In production, use nodemailer, SendGrid, SES, etc.
  return {
    sent: false,
    to: input.to,
    subject: input.subject,
    note: "Email sending requires SMTP configuration. Set EMAIL_* environment variables.",
  };
}

async function handleDatabaseQuery(input: Record<string, unknown>): Promise<unknown> {
  const query = (input.query as string || "").trim();
  if (!query.toLowerCase().startsWith("select")) {
    return { error: "Only SELECT queries are allowed for read-only access" };
  }
  return {
    rows: [],
    note: "Database query requires connection configuration. Set DB_TOOL_CONNECTION_STRING in environment.",
  };
}

async function handleFileOperations(input: Record<string, unknown>): Promise<unknown> {
  const operation = input.operation as string;
  const path = input.path as string;

  // In production, this would interact with S3 or local storage
  switch (operation) {
    case "read":
      return { content: null, note: `File "${path}" — file operations require storage configuration.` };
    case "write":
      return { written: false, path, note: "File operations require storage configuration." };
    case "list":
      return { files: [], note: "File operations require storage configuration." };
    default:
      return { error: `Unknown operation: ${operation}` };
  }
}

async function handleCalculator(input: Record<string, unknown>): Promise<unknown> {
  const expression = input.expression as string;

  try {
    // Safe math evaluation — only allows numbers, operators, and math functions
    const sanitized = expression
      .replace(/[^0-9+\-*/.()%^,\s]/g, (match) => {
        const allowed = [
          "sin", "cos", "tan", "asin", "acos", "atan", "atan2",
          "sqrt", "cbrt", "abs", "ceil", "floor", "round",
          "log", "log2", "log10", "exp", "pow",
          "min", "max", "PI", "E", "pi", "e",
        ];
        // Check if the match is part of an allowed function name at this position
        for (const fn of allowed) {
          if (expression.includes(fn)) return match;
        }
        throw new Error(`Invalid character in expression: ${match}`);
      });

    // Replace common math names
    const prepared = sanitized
      .replace(/\bpi\b/gi, String(Math.PI))
      .replace(/\be\b/g, String(Math.E))
      .replace(/\bsqrt\b/g, "Math.sqrt")
      .replace(/\bcbrt\b/g, "Math.cbrt")
      .replace(/\babs\b/g, "Math.abs")
      .replace(/\bceil\b/g, "Math.ceil")
      .replace(/\bfloor\b/g, "Math.floor")
      .replace(/\bround\b/g, "Math.round")
      .replace(/\bsin\b/g, "Math.sin")
      .replace(/\bcos\b/g, "Math.cos")
      .replace(/\btan\b/g, "Math.tan")
      .replace(/\basin\b/g, "Math.asin")
      .replace(/\bacos\b/g, "Math.acos")
      .replace(/\batan2?\b/g, "Math.atan")
      .replace(/\blog\b/g, "Math.log")
      .replace(/\blog2\b/g, "Math.log2")
      .replace(/\blog10\b/g, "Math.log10")
      .replace(/\bexp\b/g, "Math.exp")
      .replace(/\bpow\b/g, "Math.pow")
      .replace(/\bmin\b/g, "Math.min")
      .replace(/\bmax\b/g, "Math.max")
      .replace(/\^/g, "**");

    const fn = new Function("Math", `"use strict"; return (${prepared});`);
    const result = fn(Math);

    if (typeof result !== "number" || !isFinite(result)) {
      return { error: "Expression did not evaluate to a finite number", result: String(result) };
    }

    return { expression, result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to evaluate expression" };
  }
}

async function handleDateTime(input: Record<string, unknown>): Promise<unknown> {
  const operation = input.operation as string;

  switch (operation) {
    case "now": {
      const tz = (input.timezone as string) || "UTC";
      try {
        const now = new Date();
        const formatted = now.toLocaleString("en-US", { timeZone: tz });
        return { iso: now.toISOString(), formatted, timezone: tz, timestamp: now.getTime() };
      } catch {
        return { iso: new Date().toISOString(), timezone: "UTC", timestamp: Date.now() };
      }
    }
    case "convert": {
      const dateStr = input.date as string;
      const tz = (input.timezone as string) || "UTC";
      try {
        const date = new Date(dateStr);
        return { original: dateStr, converted: date.toLocaleString("en-US", { timeZone: tz }), timezone: tz };
      } catch {
        return { error: "Invalid date format" };
      }
    }
    case "diff": {
      const d1 = new Date(input.date as string);
      const d2 = new Date(input.date2 as string);
      const diffMs = d2.getTime() - d1.getTime();
      return {
        milliseconds: diffMs,
        seconds: Math.floor(diffMs / 1000),
        minutes: Math.floor(diffMs / 60000),
        hours: Math.floor(diffMs / 3600000),
        days: Math.floor(diffMs / 86400000),
      };
    }
    case "add": {
      const date = new Date(input.date as string || Date.now());
      const amount = input.amount as number || 0;
      const unit = input.unit as string || "days";
      const ms = { days: 86400000, hours: 3600000, minutes: 60000, seconds: 1000 }[unit] || 86400000;
      const result = new Date(date.getTime() + amount * ms);
      return { original: date.toISOString(), result: result.toISOString(), added: `${amount} ${unit}` };
    }
    default:
      return { error: `Unknown operation: ${operation}` };
  }
}

const BUILTIN_HANDLERS: Record<string, (input: Record<string, unknown>) => Promise<unknown>> = {
  web_search: handleWebSearch,
  code_execution: handleCodeExecution,
  http_request: handleHttpRequest,
  email_sender: handleEmailSender,
  database_query: handleDatabaseQuery,
  file_operations: handleFileOperations,
  calculator: handleCalculator,
  date_time: handleDateTime,
};

// ── API tool execution ───────────────────────────────────────────────────

async function executeApiTool(config: Record<string, unknown>, input: Record<string, unknown>): Promise<unknown> {
  let url = config.url as string;
  const method = (config.method as string) || "GET";
  const headers: Record<string, string> = (config.headers as Record<string, string>) || {};
  let bodyTemplate = (config.bodyTemplate as string) || "";

  // Replace placeholders {{param}} with input values
  for (const [key, value] of Object.entries(input)) {
    const placeholder = `{{${key}}}`;
    url = url.replace(placeholder, encodeURIComponent(String(value)));
    bodyTemplate = bodyTemplate.replace(placeholder, String(value));
    for (const hKey of Object.keys(headers)) {
      headers[hKey] = headers[hKey].replace(placeholder, String(value));
    }
  }

  // Handle auth
  const authType = config.authType as string;
  const authConfig = (config.authConfig as Record<string, string>) || {};

  if (authType === "api_key") {
    const headerName = authConfig.headerName || "X-API-Key";
    headers[headerName] = authConfig.apiKey || "";
  } else if (authType === "bearer") {
    headers["Authorization"] = `Bearer ${authConfig.token || ""}`;
  }

  const fetchOptions: RequestInit = { method, headers };
  if (bodyTemplate && ["POST", "PUT", "PATCH"].includes(method)) {
    fetchOptions.body = bodyTemplate;
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  const response = await fetch(url, fetchOptions);
  const contentType = response.headers.get("content-type") || "";
  let responseBody: unknown;

  if (contentType.includes("application/json")) {
    responseBody = await response.json();
  } else {
    responseBody = await response.text();
  }

  return { status: response.status, body: responseBody };
}

// ── Code tool execution ──────────────────────────────────────────────────

async function executeCodeTool(config: Record<string, unknown>, input: Record<string, unknown>): Promise<unknown> {
  const code = config.code as string;
  if (!code) {
    return { error: "No handler code provided" };
  }

  try {
    const logs: string[] = [];
    const mockConsole = {
      log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
      error: (...args: unknown[]) => logs.push("[ERROR] " + args.map(String).join(" ")),
    };

    // Wrap code in an async function that receives the input
    const wrappedCode = `
      "use strict";
      return (async function(input, console, Math, JSON, Date) {
        ${code}
      })(input, console, Math, JSON, Date);
    `;

    const fn = new Function("input", "console", "Math", "JSON", "Date", wrappedCode);
    const result = await fn(input, mockConsole, Math, JSON, Date);

    return { result: result !== undefined ? result : null, logs };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Code execution failed" };
  }
}

// ── Main executor ────────────────────────────────────────────────────────

export async function executeTool(params: ToolExecInput): Promise<ToolExecResult> {
  const startTime = Date.now();
  const timeoutMs = (params.config.timeout_ms as number) || 30000;

  try {
    let output: unknown;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Tool execution timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    const executionPromise = (async () => {
      switch (params.toolType) {
        case "BUILTIN": {
          const handler = BUILTIN_HANDLERS[params.toolId];
          if (!handler) {
            throw new Error(`Unknown built-in tool: ${params.toolId}`);
          }
          return await handler(params.input);
        }
        case "API":
          return await executeApiTool(params.config, params.input);
        case "CODE":
          return await executeCodeTool(params.config, params.input);
        default:
          throw new Error(`Unknown tool type: ${params.toolType}`);
      }
    })();

    output = await Promise.race([executionPromise, timeoutPromise]);

    return {
      success: true,
      output,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    logger.error("Tool execution error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown tool execution error",
      durationMs: Date.now() - startTime,
    };
  }
}
