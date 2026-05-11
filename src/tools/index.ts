import type { Octokit } from "@octokit/rest";
import * as listRepos from "./list_repos.js";
import * as searchIssues from "./search_issues.js";
import * as getPrDetails from "./get_pr_details.js";
import * as getRepoReadme from "./get_repo_readme.js";

export interface Tool {
  definition: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  };
  handler: (
    args: Record<string, unknown> | undefined,
    octokit: Octokit,
  ) => Promise<{ content: Array<{ type: "text"; text: string }> }>;
}

export const tools: Tool[] = [
  listRepos,
  searchIssues,
  getPrDetails,
  getRepoReadme,
];
