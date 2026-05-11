import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "@octokit/rest";
import { tools } from "./tools/index.js";

const GITHUB_TOKEN = process.env["GITHUB_TOKEN"];
if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

const server = new Server(
  {
    name: "claude-github-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const toolMap = new Map(tools.map((t) => [t.definition.name, t]));

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => t.definition),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tool = toolMap.get(name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.handler(args, octokit);
});

async function main() {
  try {
    const { data } = await octokit.users.getAuthenticated();
    console.error(`GitHub token validated (authenticated as ${data.login})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`GITHUB_TOKEN failed authentication: ${message}`);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitHub MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
