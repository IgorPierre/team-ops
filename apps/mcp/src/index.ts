// stdio transport for scripts and CI, authenticated with TEAM_OPS_TOKEN.
// People connect their editors to the hosted endpoint instead
// (https://<your-team-ops>/mcp) and sign in with OAuth — no key to copy.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createApiFromEnv, createTeamOpsServer } from "@team-ops/mcp-server";

const server = createTeamOpsServer(createApiFromEnv());
await server.connect(new StdioServerTransport());
