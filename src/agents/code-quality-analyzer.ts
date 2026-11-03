import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { codeQualityPrompt } from "../prompts/code-quality.prompt.js";

export const codeQualityAnalyzer: AgentDefinition = {
  description:
    "Analyzes pull request code for security, performance, maintainability, readability, and software engineering best-practice issues.",

  prompt: codeQualityPrompt,

  model: "inherit",

  tools: [
    "Read",
    "Grep",
    "Glob",
    "Skill",
  ],
};
