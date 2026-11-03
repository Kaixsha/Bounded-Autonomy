import "dotenv/config";

const requiredEnvVars = ["GITHUB_TOKEN"] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

function getRequiredEnv(name: RequiredEnvVar): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        "Please configure it before starting the application."
    );
  }

  return value;
}

function getClaudeAuthentication(): {
  anthropicApiKey?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
} {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicApiKey?.trim()) {
    return {
      anthropicApiKey,
    };
  }

  const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.AWS_REGION;

  if (
    awsAccessKeyId?.trim() &&
    awsSecretAccessKey?.trim() &&
    awsRegion?.trim()
  ) {
    return {
      awsAccessKeyId,
      awsSecretAccessKey,
      awsRegion,
    };
  }

  throw new Error(
    "Missing Claude authentication. Configure ANTHROPIC_API_KEY " +
      "or AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION."
  );
}

const claudeAuth = getClaudeAuthentication();

export const env = {
  githubToken: getRequiredEnv("GITHUB_TOKEN"),
  ...claudeAuth,
};
