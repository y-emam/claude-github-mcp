import type { Octokit } from "@octokit/rest";
import { classifyGithubError, type ToolResult } from "./_errors.js";

export const definition = {
  name: "list_repos",
  description:
    "List the user's GitHub repositories. Use this whenever the user asks about their repos, projects, or code on GitHub - for example 'what are my recent projects', 'show me my repos', 'what am I working on'. Returns repo name, description, language, stars, and last updated date. Supports filtering by visibility and sorting.",
  inputSchema: {
    type: "object",
    properties: {
      visibility: {
        type: "string",
        enum: ["all", "public", "private"],
        description: "Filter by visibility. Default: all",
      },
      sort: {
        type: "string",
        enum: ["created", "updated", "pushed", "full_name"],
        description: "Sort field. Default: updated",
      },
      per_page: {
        type: "number",
        description: "Number of repositories to return. Default: 10, max: 30",
      },
    },
  },
};

export async function handler(
  args: Record<string, unknown> | undefined,
  octokit: Octokit,
): Promise<ToolResult> {
  const visibility =
    (args?.["visibility"] as "all" | "public" | "private" | undefined) ?? "all";
  const sort =
    (args?.["sort"] as
      | "created"
      | "updated"
      | "pushed"
      | "full_name"
      | undefined) ?? "updated";
  const per_page = Math.min((args?.["per_page"] as number | undefined) ?? 10, 30);

  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      visibility,
      sort,
      per_page,
    });

    const repos = data.map((r) => ({
      name: r.full_name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      private: r.private,
      updated_at: r.updated_at,
      created_at: r.created_at,
      url: r.html_url,
    }));

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(repos, null, 2) },
      ],
    };
  } catch (e) {
    return classifyGithubError(e, "list_repos");
  }
}
