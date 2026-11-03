import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { refactoringPrompt } from "../prompts/refactoring.prompt.js";

export const refactoringSuggester: AgentDefinition = {
  description:
    "Analyzes pull request changes and suggests meaningful refactoring opportunities that improve maintainability, readability, testability, type safety, complexity, and code reuse.",

  prompt: refactoringPrompt,

  model: "inherit",

  tools: [
    "Read",
    "Grep",
    "Glob",
    "Skill",
  ],
};
