import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { TeamOpsClient } from "@team-ops/api-client";
import { createTeamOpsServer } from "@team-ops/mcp-server";

/**
 * Hosted MCP endpoint (Streamable HTTP, stateless). Editors add
 * `<APP_URL>/mcp`; on the first 401 they discover the OAuth server through
 * /.well-known/oauth-protected-resource/mcp, open the browser for sign-in, and
 * come back with a bearer token. Each request builds a fresh server bound to
 * that token, so nothing is kept between calls.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");

function publicOrigin(req: Request) {
  return (process.env.APP_URL ?? new URL(req.url).origin).replace(/\/$/, "");
}

function unauthorized(req: Request, description: string) {
  const metadata = `${publicOrigin(req)}/.well-known/oauth-protected-resource/mcp`;
  return Response.json(
    { error: "invalid_token", error_description: description },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer error="invalid_token", error_description="${description}", resource_metadata="${metadata}"`,
      },
    },
  );
}

type WhoAmI = { actorType: string; organizationId?: string | null };

async function handle(req: Request): Promise<Response> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return unauthorized(req, "Sign in to Team-Ops to use this server.");

  const who = await fetch(`${API_URL}/v1/auth/whoami`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  }).catch(() => null);
  if (!who) return Response.json({ error: "temporarily_unavailable" }, { status: 503 });
  if (!who.ok) return unauthorized(req, "The token is invalid, expired or was disconnected.");
  const me = ((await who.json()) as { data: WhoAmI }).data;
  if (me.actorType !== "agent") return unauthorized(req, "Use a token issued to a coding agent.");

  const api = new TeamOpsClient({ baseUrl: `${API_URL}/v1`, token });
  const server = createTeamOpsServer(api, { organizationId: me.organizationId });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    void server.close();
  }
}

export { handle as DELETE, handle as GET, handle as POST };
