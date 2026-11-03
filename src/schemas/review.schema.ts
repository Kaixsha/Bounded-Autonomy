import { z } from "zod";

export const SeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const CodeQualityIssueSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: SeveritySchema,
  file: z.string().optional(),
  line: z.number().int().positive().optional(),
  category: z.enum([
    "security",
    "performance",
    "maintainability",
    "readability",
    "best-practice",
  ]),
  recommendation: z.string(),
});

export const TestCoverageIssueSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: SeveritySchema,
  file: z.string().optional(),
  missingTests: z.array(z.string()),
  recommendation: z.string(),
});

export const RefactoringSuggestionSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: SeveritySchema,
  file: z.string().optional(),
  rationale: z.string(),
  suggestedChange: z.string(),
});

export const CodeQualityAnalysisSchema = z.object({
  summary: z.string(),
  issues: z.array(CodeQualityIssueSchema),
});

export const TestCoverageAnalysisSchema = z.object({
  summary: z.string(),
  issues: z.array(TestCoverageIssueSchema),
});

export const RefactoringAnalysisSchema = z.object({
  summary: z.string(),
  suggestions: z.array(RefactoringSuggestionSchema),
});

export const PullRequestSchema = z.object({
  owner: z.string(),
  repository: z.string(),
  pullRequestNumber: z.number().int().positive(),
  title: z.string().optional(),
  url: z.string().url().optional(),
});

export const ReviewReportSchema = z.object({
  pullRequest: PullRequestSchema,
  generatedAt: z.string(),
  summary: z.string(),

  codeQuality: CodeQualityAnalysisSchema,

  testCoverage: TestCoverageAnalysisSchema,

  refactoring: RefactoringAnalysisSchema,

  errors: z.array(z.string()).default([]),
});

export type Severity = z.infer<typeof SeveritySchema>;

export type CodeQualityIssue = z.infer<
  typeof CodeQualityIssueSchema
>;

export type TestCoverageIssue = z.infer<
  typeof TestCoverageIssueSchema
>;

export type RefactoringSuggestion = z.infer<
  typeof RefactoringSuggestionSchema
>;

export type CodeQualityAnalysis = z.infer<
  typeof CodeQualityAnalysisSchema
>;

export type TestCoverageAnalysis = z.infer<
  typeof TestCoverageAnalysisSchema
>;

export type RefactoringAnalysis = z.infer<
  typeof RefactoringAnalysisSchema
>;

export type PullRequestInfo = z.infer<
  typeof PullRequestSchema
>;

export type ReviewReport = z.infer<
  typeof ReviewReportSchema
>;
