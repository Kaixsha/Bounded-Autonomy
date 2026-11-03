import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { testCoveragePrompt } from "../prompts/test-coverage.prompt.js";

export const testCoverageAnalyzer: AgentDefinition = {
  description:
    "Analyzes pull request changes for missing tests, weak assertions, untested edge cases, regression risks, and other test coverage gaps.",

  prompt: testCoveragePrompt,

  model: "inherit",

  tools: [
    "Read",
    "Grep",
    "Glob",
    "Skill",
  ],
};
