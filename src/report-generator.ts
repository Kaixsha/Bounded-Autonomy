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

    await writeFile(
      filePath,
      this.toMarkdown(report),
      "utf8"
    );
  }

  private async writeHtml(
    report: ReviewReport
  ): Promise<void> {
    const filePath = join(
      this.outputDirectory,
      "report.html"
    );

    await writeFile(
      filePath,
      this.toHtml(report),
      "utf8"
    );
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
- **File:** ${suggestion.file ?? "Not specified"}

${suggestion.description}

**Rationale:** ${suggestion.rationale}

**Suggested change:** ${suggestion.suggestedChange}
`
            )
            .join("\n")
        : "No refactoring suggestions were reported.";

    const errors =
      report.errors.length > 0
        ? report.errors
            .map((error) => `- ${error}`)
            .join("\n")
        : "No agent errors were reported.";

    return `# Pull Request Review Report

## Pull Request

- **Owner:** ${report.pullRequest.owner}
- **Repository:** ${report.pullRequest.repository}
- **PR Number:** ${report.pullRequest.pullRequestNumber}
- **Title:** ${report.pullRequest.title ?? "Not available"}
- **URL:** ${report.pullRequest.url ?? "Not available"}
- **Generated:** ${report.generatedAt}

## Overall Summary

${report.summary}

## Code Quality

${report.codeQuality.summary}

${codeQualityIssues}

## Test Coverage

${report.testCoverage.summary}

${testCoverageIssues}

## Refactoring Suggestions

${report.refactoring.summary}

${refactoringSuggestions}

## Errors

${errors}
`;
  }

  private toHtml(
    report: ReviewReport
  ): string {
    const escapeHtml = (
      value: string
    ): string =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const codeQualityIssues =
      report.codeQuality.issues
        .map(
          (issue) => `
<article class="card">
  <h3>${escapeHtml(issue.title)}</h3>

  <p>
    <strong>Severity:</strong>
    ${escapeHtml(issue.severity)}
  </p>

  <p>
    <strong>Category:</strong>
    ${escapeHtml(issue.category)}
  </p>

  <p>
    <strong>File:</strong>
    ${escapeHtml(issue.file ?? "Not specified")}
  </p>

  <p>
    <strong>Line:</strong>
    ${issue.line ?? "Not specified"}
  </p>

  <p>
    ${escapeHtml(issue.description)}
  </p>

  <p>
    <strong>Recommendation:</strong>
    ${escapeHtml(issue.recommendation)}
  </p>
</article>
`
        )
        .join("");

    const testCoverageIssues =
      report.testCoverage.issues
        .map(
          (issue) => `
<article class="card">
  <h3>${escapeHtml(issue.title)}</h3>

  <p>
    <strong>Severity:</strong>
    ${escapeHtml(issue.severity)}
  </p>

  <p>
    <strong>File:</strong>
    ${escapeHtml(issue.file ?? "Not specified")}
  </p>

  <p>
    ${escapeHtml(issue.description)}
  </p>

  <p>
    <strong>Missing tests:</strong>
  </p>

  <ul>
    ${issue.missingTests
      .map(
        (test) =>
          `<li>${escapeHtml(test)}</li>`
      )
      .join("")}
  </ul>

  <p>
    <strong>Recommendation:</strong>
    ${escapeHtml(issue.recommendation)}
  </p>
</article>
`
        )
        .join("");

    const refactoringSuggestions =
      report.refactoring.suggestions
        .map(
          (suggestion) => `
<article class="card">
  <h3>${escapeHtml(suggestion.title)}</h3>

  <p>
    <strong>Priority:</strong>
    ${escapeHtml(suggestion.priority)}
  </p>

  <p>
    <strong>File:</strong>
    ${escapeHtml(
      suggestion.file ?? "Not specified"
    )}
  </p>

  <p>
    ${escapeHtml(suggestion.description)}
  </p>

  <p>
    <strong>Rationale:</strong>
    ${escapeHtml(suggestion.rationale)}
  </p>

  <p>
    <strong>Suggested change:</strong>
    ${escapeHtml(suggestion.suggestedChange)}
  </p>
</article>
`
        )
        .join("");

    const errors =
      report.errors.length > 0
        ? `<ul>${report.errors
            .map(
              (error) =>
                `<li>${escapeHtml(error)}</li>`
            )
            .join("")}</ul>`
        : "<p>No agent errors were reported.</p>";

    const pullRequestUrl =
      report.pullRequest.url
        ? `<p>
            <strong>URL:</strong>
            ${escapeHtml(report.pullRequest.url)}
          </p>`
        : `<p>
            <strong>URL:</strong>
            Not available
          </p>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Pull Request Review Report</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      padding: 32px;
      line-height: 1.6;
      color: #1f2937;
      background: #f8fafc;
    }

    h1,
    h2,
    h3 {
      color: #111827;
    }

    section {
      margin-bottom: 32px;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }

    .summary {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 16px;
    }
  </style>
</head>

<body>
  <h1>Pull Request Review Report</h1>

  <section>
    <h2>Pull Request</h2>

    <p>
      <strong>Owner:</strong>
      ${escapeHtml(report.pullRequest.owner)}
    </p>

    <p>
      <strong>Repository:</strong>
      ${escapeHtml(report.pullRequest.repository)}
    </p>

    <p>
      <strong>PR Number:</strong>
      ${report.pullRequest.pullRequestNumber}
    </p>

    <p>
      <strong>Title:</strong>
      ${escapeHtml(
        report.pullRequest.title ?? "Not available"
      )}
    </p>

    ${pullRequestUrl}

    <p>
      <strong>Generated:</strong>
      ${escapeHtml(report.generatedAt)}
    </p>
  </section>

  <section>
    <h2>Overall Summary</h2>

    <div class="summary">
      ${escapeHtml(report.summary)}
    </div>
  </section>

  <section>
    <h2>Code Quality</h2>

    <p>
      ${escapeHtml(report.codeQuality.summary)}
    </p>

    ${
      codeQualityIssues ||
      "<p>No code quality issues were reported.</p>"
    }
  </section>

  <section>
    <h2>Test Coverage</h2>

    <p>
      ${escapeHtml(report.testCoverage.summary)}
    </p>

    ${
      testCoverageIssues ||
      "<p>No test coverage issues were reported.</p>"
    }
  </section>

  <section>
    <h2>Refactoring Suggestions</h2>

    <p>
      ${escapeHtml(report.refactoring.summary)}
    </p>

    ${
      refactoringSuggestions ||
      "<p>No refactoring suggestions were reported.</p>"
    }
  </section>

  <section>
    <h2>Errors</h2>

    ${errors}
  </section>
</body>
</html>`;
  }
}
