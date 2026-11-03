import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { ReviewReport } from "./schemas/review.schema.js";

export class ReportGenerator {
  constructor(
    private readonly outputDirectory = "reports"
  ) {}

  public async generate(
    report: ReviewReport
  ): Promise<void> {
    await mkdir(this.outputDirectory, {
      recursive: true,
    });

    await Promise.all([
      this.writeJson(report),
      this.writeMarkdown(report),
      this.writeHtml(report),
    ]);
  }

  private async writeJson(
    report: ReviewReport
  ): Promise<void> {
    const filePath = join(
      this.outputDirectory,
      "report.json"
    );

    await writeFile(
      filePath,
      JSON.stringify(report, null, 2),
      "utf8"
    );
  }

  private async writeMarkdown(
    report: ReviewReport
  ): Promise<void> {
    const filePath = join(
      this.outputDirectory,
      "report.md"
    );

    const content = this.toMarkdown(report);

    await writeFile(filePath, content, "utf8");
  }

  private async writeHtml(
    report: ReviewReport
  ): Promise<void> {
    const filePath = join(
      this.outputDirectory,
      "report.html"
    );

    const content = this.toHtml(report);

    await writeFile(filePath, content, "utf8");
  }

  private toMarkdown(
    report: ReviewReport
  ): string {
    const codeQualityIssues =
      report.codeQuality.issues.length > 0
        ? report.codeQuality.issues
            .map(
              (issue) => `
### ${issue.title}

- **Severity:** ${issue.severity}
- **Category:** ${issue.category}
- **File:** ${issue.file ?? "Not specified"}
- **Line:** ${issue.line ?? "Not specified"}

${issue.description}

**Recommendation:** ${issue.recommendation}
`
            )
            .join("\n")
        : "No code quality issues were reported.";

    const testCoverageIssues =
      report.testCoverage.issues.length > 0
        ? report.testCoverage.issues
            .map(
              (issue) => `
### ${issue.title}

- **Severity:** ${issue.severity}
- **File:** ${issue.file ?? "Not specified"}

${issue.description}

**Missing tests:**

${issue.missingTests
  .map((test) => `- ${test}`)
  .join("\n")}

**Recommendation:** ${issue.recommendation}
`
            )
            .join("\n")
        : "No test coverage issues were reported.";

    const refactoringSuggestions =
      report.refactoring.suggestions.length > 0
        ? report.refactoring.suggestions
            .map(
              (suggestion) => `
### ${suggestion.title}

- **Priority:** ${suggestion.priority}
- **File:** ${suggestion.file ?? "Not specified
