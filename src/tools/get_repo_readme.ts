import type { Octokit } from "@octokit/rest";
import { classifyGithubError, type ToolResult } from "./_errors.js";

export const definition = {
  name: "get_repo_readme",
  description:
    "Fetch the README content of a GitHub repository. Returns the decoded text of the repo's README file. Use when the user wants to read or summarize the README of a specific repo.",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "Repository owner (user or organization login).",
      },
      repo: { type: "string", description: "Repository name." },
    },
    required: ["owner", "repo"],
  },
};

export async function handler(
  args: Record<string, unknown> | undefined,
  octokit: Octokit,
): Promise<ToolResult> {
  const { owner, repo } = (args ?? {}) as { owner: string; repo: string };

  try {
    const { data } = await octokit.repos.getReadme({ owner, repo });
    const text = Buffer.from(
      data.content,
      data.encoding as BufferEncoding,
    ).toString("utf-8");

    return {
      content: [{ type: "text" as const, text }],
    };
  } catch (e) {
    return classifyGithubError(e, `README for ${owner}/${repo}`);
  }
}
