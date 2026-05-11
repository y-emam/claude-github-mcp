import { RequestError } from "@octokit/request-error";

export type ToolResult = {
  isError?: boolean;
  content: Array<{ type: "text"; text: string }>;
};

export function toolError(text: string): ToolResult {
  return { isError: true, content: [{ type: "text", text }] };
}

export function classifyGithubError(e: unknown, ctx: string): ToolResult {
  if (e instanceof RequestError) {
    if (e.status === 404) return toolError(`Not found: ${ctx}`);
    if (e.status === 401) {
      return toolError("GitHub auth failed (check GITHUB_TOKEN).");
    }
    if (e.status === 403) {
      const reset = e.response?.headers?.["x-ratelimit-reset"];
      const remaining = e.response?.headers?.["x-ratelimit-remaining"];
      if (remaining === "0" && reset) {
        const resetAt = new Date(Number(reset) * 1000).toISOString();
        return toolError(`GitHub rate limit exceeded (resets at ${resetAt}).`);
      }
      return toolError(`Forbidden by GitHub: ${e.message}`);
    }
    if (e.status === 422) {
      return toolError(`Invalid request to GitHub (${ctx}): ${e.message}`);
    }
    return toolError(`GitHub error ${e.status} for ${ctx}: ${e.message}`);
  }
  const message = e instanceof Error ? e.message : String(e);
  return toolError(`Unexpected error for ${ctx}: ${message}`);
}
