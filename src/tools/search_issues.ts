import type { Octokit } from "@octokit/rest";

export const definition = {
  name: "search_issues",
  description:
    "Search GitHub issues and pull requests across all of GitHub. Use this when the user wants to find issues or PRs by keyword, label, state, or repo - for example 'find open issues about auth in my repos', 'search PRs labelled bug'. Combines free-text query with filters and returns matching items.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Free-text search keywords. Combined with state/labels into a GitHub search query (e.g. extra qualifiers like 'repo:owner/name' can be included here).",
      },
      state: {
        type: "string",
        enum: ["open", "closed"],
        description: "Filter by issue/PR state.",
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Filter by labels. Issues must have ALL listed labels.",
      },
      sort: {
        type: "string",
        enum: ["comments", "reactions", "created", "updated"],
        description: "Sort field. Default: best match.",
      },
      direction: {
        type: "string",
        enum: ["asc", "desc"],
        description: "Sort direction. Default: desc.",
      },
    },
    required: ["query"],
  },
};

export async function handler(
  args: Record<string, unknown> | undefined,
  octokit: Octokit,
) {
  const { query, state, labels, sort, direction } = (args ?? {}) as {
    query: string;
    state?: "open" | "closed";
    labels?: string[];
    sort?: "comments" | "reactions" | "created" | "updated";
    direction?: "asc" | "desc";
  };

  const qParts = [query];
  if (state) qParts.push(`state:${state}`);
  if (labels?.length) {
    for (const l of labels) qParts.push(`label:"${l}"`);
  }

  const { data } = await octokit.search.issuesAndPullRequests({
    q: qParts.join(" "),
    ...(sort ? { sort } : {}),
    ...(direction ? { order: direction } : {}),
    per_page: 20,
  });

  const items = data.items.map((i) => ({
    title: i.title,
    number: i.number,
    state: i.state,
    is_pr: Boolean(i.pull_request),
    repo: i.repository_url.replace("https://api.github.com/repos/", ""),
    author: i.user?.login,
    labels: i.labels.map((l) => (typeof l === "string" ? l : l.name)),
    comments: i.comments,
    url: i.html_url,
    created_at: i.created_at,
    updated_at: i.updated_at,
  }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ total: data.total_count, items }, null, 2),
      },
    ],
  };
}
