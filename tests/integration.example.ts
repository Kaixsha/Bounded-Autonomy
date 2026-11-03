import { Orchestrator } from "../src/orchestrator.js";

/**
 * Integration test example using a real public GitHub repository.
 *
 * This is intentionally not executed as part of the standard unit-test
 * suite because it requires valid GitHub and Claude credentials and makes
 * external API/MCP calls.
 *
 * Example target:
 * https://github.com/octocat/Hello-World/pull/1
 */
export async function runIntegrationExample(): Promise<void> {
  const orchestrator = new Orchestrator();

  const report = await orchestrator.reviewPullRequest({
    owner: "octocat",
    repo: "Hello-World",
    pullRequestNumber: 1,
  });

  console.log(
    "Integration review completed:",
    report.summary
  );
}
