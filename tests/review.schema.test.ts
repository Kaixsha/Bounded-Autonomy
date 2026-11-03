import { describe, expect, it } from "vitest";

import {
  ReviewReportSchema,
  SeveritySchema,
} from "../src/schemas/review.schema.js";

describe("ReviewReportSchema", () => {
  it("accepts a valid review report", () => {
    const validReport = {
      pullRequest: {
        owner: "octocat",
        repository: "Hello-World",
        pullRequestNumber: 1,
        title: "Example pull request",
        url: "https://github.com/octocat/Hello-World/pull/1",
      },

      generatedAt: new Date().toISOString(),

      summary:
        "The pull request was successfully analyzed.",

      codeQuality: {
        summary: "One maintainability issue was found.",
        issues: [
          {
            title: "Duplicated logic",
            description:
              "The same validation logic appears multiple times.",
            severity: "medium",
            file: "src/example.ts",
            line: 10,
            category: "maintainability",
            recommendation:
              "Extract the validation logic into a reusable function.",
          },
        ],
      },

      testCoverage: {
        summary:
          "Additional edge-case testing is recommended.",
        issues: [
          {
            title: "Missing invalid-input test",
            description:
              "The new validation behavior is not tested with invalid input.",
            severity: "medium",
            file: "src/example.ts",
            missingTests: [
              "Verify that invalid input produces the expected error.",
            ],
            recommendation:
              "Add a test covering invalid input.",
          },
        ],
      },

      refactoring: {
        summary:
          "One refactoring opportunity was identified.",
        suggestions: [
          {
            title: "Extract validation helper",
            description:
              "Validation logic could be reused.",
            priority: "low",
            file: "src/example.ts",
            rationale:
              "A helper would reduce duplicated logic.",
            suggestedChange:
              "Move the validation logic into a shared function.",
          },
        ],
      },

      errors: [],
    };

    const result =
      ReviewReportSchema.safeParse(validReport);

    expect(result.success).toBe(true);
  });

  it("rejects an invalid pull request number", () => {
    const invalidReport = {
      pullRequest: {
        owner: "octocat",
        repository: "Hello-World",
        pullRequestNumber: 0,
      },

      generatedAt: new Date().toISOString(),
      summary: "Example report",

      codeQuality: {
        summary: "No issues.",
        issues: [],
      },

      testCoverage: {
        summary: "No issues.",
        issues: [],
      },

      refactoring: {
        summary: "No suggestions.",
        suggestions: [],
      },

      errors: [],
    };

    const result =
      ReviewReportSchema.safeParse(invalidReport);

    expect(result.success).toBe(false);
  });
});

describe("SeveritySchema", () => {
  it("accepts supported severity levels", () => {
    expect(
      SeveritySchema.parse("low")
    ).toBe("low");

    expect(
      SeveritySchema.parse("medium")
    ).toBe("medium");

    expect(
      SeveritySchema.parse("high")
    ).toBe("high");

    expect(
      SeveritySchema.parse("critical")
    ).toBe("critical");
  });

  it("rejects unsupported severity levels", () => {
    const result =
      SeveritySchema.safeParse("extreme");

    expect(result.success).toBe(false);
  });
});
