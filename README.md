# claude-github-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes
GitHub data to Claude (or any MCP-compatible client) as tools. Backed by
[`@octokit/rest`](https://github.com/octokit/rest.js) and authenticated with a
GitHub personal access token.

## Tools

| Tool | Description |
| --- | --- |
| `list_repos` | List the authenticated user's repositories. Supports `visibility`, `sort`, and `per_page`. |
| `search_issues` | Search issues and pull requests across GitHub. Combines a free-text `query` with optional `state`, `labels`, `sort`, and `direction` filters. |
| `get_pr_details` | Fetch a single pull request by `owner`, `repo`, and `pr_number`. Returns title, body, state, branches, mergeable status, and diff stats. |
| `get_repo_readme` | Fetch and decode a repository's README by `owner` and `repo`. |

## Setup

Requirements: Node.js 20+ and a GitHub personal access token with the scopes
needed for the data you want to query (typically `repo` for private repos,
`public_repo` for public-only).

```bash
npm install
cp .env.example .env
# edit .env and set GITHUB_TOKEN=...
```

## Run

Development (watch mode via `tsx`):

```bash
GITHUB_TOKEN=ghp_xxx npm run dev
```

Production build:

```bash
npm run build
GITHUB_TOKEN=ghp_xxx npm start
```

The server speaks MCP over stdio.

## Example prompts

Once the server is connected to Claude, natural-language prompts like these
will trigger the corresponding tool:

| Prompt | Tool |
| --- | --- |
| "What are my 5 most recently updated repos?" | `list_repos` |
| "Summarize the README of y-emam/claude-github-mcp" | `get_repo_readme` |
| "Find open issues mentioning 'bug' in my repos" | `search_issues` |
| "Show me PR #12 in y-emam/claude-github-mcp" | `get_pr_details` |
| "List my private repos sorted by last push" | `list_repos` |

## Use with Claude Desktop

Add an entry to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/absolute/path/to/claude-github-mcp/build/index.js"],
      "env": { "GITHUB_TOKEN": "ghp_xxx" }
    }
  }
}
```

Restart Claude Desktop. The tools above will appear in the tool picker.

## Project layout

```
src/
  index.ts               # MCP server: stdio transport + tool dispatch
  tools/
    index.ts             # tool registry (Tool interface + tools[])
    list_repos.ts
    search_issues.ts
    get_pr_details.ts
    get_repo_readme.ts
```

Each file under `src/tools/` exports a `definition` (advertised by
`ListTools`) and a `handler(args, octokit)` (invoked by `CallTool`). To add a
new tool, drop a file in `src/tools/` and append it to the array in
`src/tools/index.ts`.

## License

[MIT](./LICENSE) © Yasser Emam
