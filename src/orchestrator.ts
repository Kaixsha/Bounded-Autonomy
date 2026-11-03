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

import { reviewRateLimiter } from "./utils/rate-limiter.js";

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

    const release = await reviewRateLimiter.acquire();

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

Review this GitHub pull request:

Owner: ${target.owner}
Repository: ${target.repo}
Pull request number: ${target.pullRequestNumber}

First fetch the pull request details and changed files using the GitHub MCP tools.

Then use the Task tool to delegate analysis to all three registered subagents:

1. code-quality-analyzer
2. test-coverage-analyzer
3. refactoring-suggester

Combine their findings into the required ReviewReport structure.
`;

    let structuredOutput: unknown;

    for await (const message of query({
      prompt: requestPrompt,

      options: {
        allowedTools: [
          "Task",
          "mcp__github__*",
          "mcp__eslint__*",
        ],

        mcpServers
