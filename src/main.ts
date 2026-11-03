import "./config/env.js";

import { Orchestrator } from "./orchestrator.js";
import { ReportGenerator } from "./report-generator.js";

interface CliArguments {
  owner: string;
  repo: string;
  pullRequestNumber: number;
}

function printUsage(): void {
  console.error(
    "Usage: npm start -- <owner> <repo> <pull-request-number>"
  );

  console.error(
    "Example: npm start -- octocat Hello-World 1"
  );
}

function parseArguments(
  args: string[]
): CliArguments {
  const [owner, repo, pullRequestNumberText] = args;

  if (
    !owner ||
    !repo ||
    !pullRequestNumberText
  ) {
    printUsage();

    throw new Error(
      "Repository owner, repository name, and pull request number are required."
    );
  }

  const pullRequestNumber = Number(
    pullRequestNumberText
  );

  if (
    !Number.isInteger(pullRequestNumber) ||
    pullRequestNumber <= 0
  ) {
    throw new Error(
      "Pull request number must be a positive integer."
    );
  }

  return {
    owner,
    repo,
    pullRequestNumber,
  };
}

function getFriendlyErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred while reviewing the pull request.";
}

async function main(): Promise<void> {
  try {
    const {
      owner,
      repo,
      pullRequestNumber,
    } = parseArguments(process.argv.slice(2));

    console.log(
      `Reviewing pull request ${owner}/${repo}#${pullRequestNumber}...`
    );

    const orchestrator = new Orchestrator();

    const report =
      await orchestrator.reviewPullRequest({
        owner,
        repo,
        pullRequestNumber,
      });

    const reportGenerator =
      new ReportGenerator("reports");

    await reportGenerator.generate(report);

    console.log("Pull request review completed successfully.");

    console.log(
      "Generated reports:"
    );

    console.log(
      "- reports/report.json"
    );

    console.log(
      "- reports/report.md"
    );

    console.log(
      "- reports/report.html"
    );
  } catch (error) {
    console.error(
      `Error: ${getFriendlyErrorMessage(error)}`
    );

    process.exitCode = 1;
  }
}

void main();
