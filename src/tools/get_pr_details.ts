import type { Octokit } from "@octokit/rest";
import { classifyGithubError, type ToolResult } from "./_errors.js";

export const definition = {
  name: "get_pr_details",
  description:
    "Get detailed information about a specific pull request: title, body, state, author, base/head branches, mergeable status, review/comment counts, diff stats, and links. Use when the user asks about a specific PR by number.",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "Repository owner (user or organization login).",
      },
      repo: { type: "string", description: "Repository name." },
      pr_number: { type: "number", description: "Pull request number." },
    },
    required: ["owner", "repo", "pr_number"],
  },
};

export async function handler(
  args: Record<string, unknown> | undefined,
  octokit: Octokit,
): Promise<ToolResult> {
  const { owner, repo, pr_number } = (args ?? {}) as {
    owner: string;
    repo: string;
    pr_number: number;
  };

  try {
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pr_number,
    });

    const details = {
      number: data.number,
      title: data.title,
      state: data.state,
      draft: data.draft,
      author: data.user?.login,
      body: data.body,
      base: data.base.ref,
      head: data.head.ref,
      mergeable: data.mergeable,
      merged: data.merged,
      comments: data.comments,
      review_comments: data.review_comments,
      commits: data.commits,
      additions: data.additions,
      deletions: data.deletions,
      changed_files: data.changed_files,
      created_at: data.created_at,
      updated_at: data.updated_at,
      url: data.html_url,
    };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(details, null, 2) },
      ],
    };
  } catch (e) {
    return classifyGithubError(e, `PR ${owner}/${repo}#${pr_number}`);
  }
}
