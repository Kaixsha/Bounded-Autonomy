import { env } from "./env.js";

export const mcpServers = {
  github: {
    type: "stdio" as const,
    command: "npx",
    args: [
      "-y",
      "@modelcontextprotocol/server-github",
    ],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: env.githubToken,
    },
  },

  eslint: {
    type: "stdio" as const,
    command: "npx",
    args: [
      "-y",
      "@eslint/mcp",
    ],
  },
};

export type McpServerName = keyof typeof mcpServers;
