import { query } from "@anthropic-ai/claude-agent-sdk";
import { zodToJsonSchema } from "zod-to-json-schema";

import { codeQualityAnalyzer } from "./agents/code-quality-analyzer.js";
import { testCoverageAnalyzer } from "./agents/test-coverage-analyzer.js";
import { refactoringSuggester } from "./agents/refactoring-suggester.js";

import { mcpServers } from "./config/mcp.config.js";
import { orchestratorPrompt } from "./prompts/orchestrator.prompt.js";

import {
  ReviewReportSchema,
  type ReviewReport,
} from "./schemas/review.schema.js";

import {
  withRetry,
  withTimeout,
} from "./utils/error-handler.js";

import {
  reviewRateLimiter,
} from "./utils/rate-limiter.js";

export interface PullRequestTarget {
  owner: string;
  repo: string;
  pullRequestNumber: number;
}

const REVIEW_TIMEOUT_MS = 120_000;

export class Orchestrator {
  public async reviewPullRequest(
    target: PullRequestTarget
  ): Promise<ReviewReport> {
    this.validateTarget(target);

    const release =
      await reviewRateLimiter.acquire();

    try {
      return await withRetry(
        () =>
          withTimeout(
            this.executeReview(target),
            REVIEW_TIMEOUT_MS,
            "Pull request review timed out."
          ),
        {
          maxRetries: 2,
          initialDelayMs: 1_000,
          maxDelayMs: 5_000,
          backoffMultiplier: 2,
        }
      );
    } finally {
      release();
    }
  }

  private async executeReview(
    target: PullRequestTarget
  ): Promise<ReviewReport> {
    const reviewSchema = zodToJsonSchema(
      ReviewReportSchema,
      "ReviewReport"
    );

    const requestPrompt = `
${orchestratorPrompt}

Review this GitHub pull request.

Owner: ${target.owner}
Repository: ${target.repo}
Pull request number: ${target.pullRequestNumber}

First, use the GitHub MCP tools to retrieve the pull request details and changed files.

After retrieving the pull request information, use the Task tool to invoke these three subagents:

1. code-quality-analyzer
2. test-coverage-analyzer
3. refactoring-suggester

Provide the relevant pull request context to each subagent.

Combine the results from all three subagents into one final ReviewReport.

If a subagent fails, continue with the successful results when possible and include a concise description of the failure in the errors array.
`;

    let structuredOutput: unknown;

    for await (
      const message of query({
        prompt: requestPrompt,
        options: {
          allowedTools: [
            "Task",
            "mcp__github__*",
            "mcp__eslint__*",
          ],

          mcpServers,

          agents: {
            "code-quality-analyzer":
              codeQualityAnalyzer,

            "test-coverage-analyzer":
              testCoverageAnalyzer,

            "refactoring-suggester":
              refactoringSuggester,
          },

          outputFormat: {
            type: "json_schema",
            schema: reviewSchema,
          },
        },
      })
    ) {
      if (
        message.type === "result" &&
        "structured_output" in message
      ) {
        structuredOutput =
          message.structured_output;
      }
    }

    if (!structuredOutput) {
      throw new Error(
        "The review completed without structured output."
      );
    }

    const parsed =
      ReviewReportSchema.safeParse(
        structuredOutput
      );

    if (!parsed.success) {
      throw new Error(
        `The generated review report failed validation: ${parsed.error.message}`
      );
    }

    return parsed.data;
  }

  private validateTarget(
    target: PullRequestTarget
  ): void {
    if (!target.owner.trim()) {
      throw new Error(
        "GitHub repository owner is required."
      );
    }

    if (!target.repo.trim()) {
      throw new Error(
        "GitHub repository name is required."
      );
    }

    if (
      !Number.isInteger(
        target.pullRequestNumber
      ) ||
      target.pullRequestNumber <= 0
    ) {
      throw new Error(
        "Pull request number must be a positive integer."
      );
    }
  }
}
