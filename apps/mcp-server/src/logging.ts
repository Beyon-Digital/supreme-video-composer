/**
 * Structured logging utilities for MCP tool usage tracking.
 * Logs all tool invocations, execution time, and results to stdout.
 */

export interface ToolInvocation {
  timestamp: string;
  toolName: string;
  status: "start" | "success" | "error";
  durationMs?: number;
  errorMessage?: string;
  inputHash?: string;
}

/**
 * Format and log a tool invocation
 */
export function logToolInvocation(invocation: ToolInvocation): void {
  const timestamp = new Date().toISOString();
  const prefix = `[mcp-tool]`;

  if (invocation.status === "start") {
    console.log(
      `${prefix} ${timestamp} START ${invocation.toolName}`,
      invocation.inputHash ? `(input: ${invocation.inputHash})` : "",
    );
  } else if (invocation.status === "success") {
    console.log(
      `${prefix} ${timestamp} SUCCESS ${invocation.toolName} (${invocation.durationMs}ms)`,
    );
  } else if (invocation.status === "error") {
    console.error(
      `${prefix} ${timestamp} ERROR ${invocation.toolName} (${invocation.durationMs}ms): ${invocation.errorMessage}`,
    );
  }
}

/**
 * Compute a simple hash of input for logging (first 50 chars or key names)
 */
export function hashInput(input: Record<string, unknown>): string {
  const keys = Object.keys(input).sort();
  if (keys.length === 0) return "{}";
  if (keys.length > 5) {
    return `{${keys.slice(0, 5).join(", ")}, ...}`;
  }
  return `{${keys.join(", ")}}`;
}

/**
 * Wrap a tool handler with logging
 */
export function withLogging<TInput extends Record<string, unknown>, TResult>(
  toolName: string,
  handler: (input: TInput) => Promise<TResult> | TResult,
): (input: TInput) => Promise<TResult> {
  return async (input: TInput): Promise<TResult> => {
    const startTime = Date.now();
    const inputHash = hashInput(input);

    logToolInvocation({
      timestamp: new Date().toISOString(),
      toolName,
      status: "start",
      inputHash,
    });

    try {
      const result = await Promise.resolve(handler(input));
      const durationMs = Date.now() - startTime;

      logToolInvocation({
        timestamp: new Date().toISOString(),
        toolName,
        status: "success",
        durationMs,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logToolInvocation({
        timestamp: new Date().toISOString(),
        toolName,
        status: "error",
        durationMs,
        errorMessage,
      });

      throw error;
    }
  };
}

/**
 * Summary statistics for MCP session
 */
export interface MCPSessionStats {
  totalToolsCalled: number;
  successfulCalls: number;
  failedCalls: number;
  totalDurationMs: number;
  averageCallDurationMs: number;
  toolCallCounts: Record<string, number>;
}

/**
 * In-memory statistics tracker for the MCP session
 */
export class MCPStatsTracker {
  private stats: MCPSessionStats = {
    totalToolsCalled: 0,
    successfulCalls: 0,
    failedCalls: 0,
    totalDurationMs: 0,
    averageCallDurationMs: 0,
    toolCallCounts: {},
  };

  recordToolCall(toolName: string, durationMs: number, success: boolean): void {
    this.stats.totalToolsCalled++;
    if (success) {
      this.stats.successfulCalls++;
    } else {
      this.stats.failedCalls++;
    }
    this.stats.totalDurationMs += durationMs;
    this.stats.averageCallDurationMs = Math.round(
      this.stats.totalDurationMs / this.stats.totalToolsCalled,
    );

    // Track per-tool call count
    this.stats.toolCallCounts[toolName] = (this.stats.toolCallCounts[toolName] || 0) + 1;

    // Log stats periodically or on milestone
    if (this.stats.totalToolsCalled % 10 === 0) {
      this.logStats();
    }
  }

  logStats(): void {
    const statsStr = JSON.stringify(this.stats, null, 2);
    console.log("[mcp-stats]", statsStr);
  }

  getStats(): MCPSessionStats {
    return { ...this.stats };
  }
}

export const mcpStatsTracker = new MCPStatsTracker();
