/** Normalize what people paste: no trailing slash, no /mcp or /v1 suffix. */
export function baseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "").replace(/\/(mcp|v1)$/, "");
}

export function mcpUrl(url: string): string {
  return `${baseUrl(url)}/mcp`;
}

/**
 * Make sure the URL is a Team-Ops server with OAuth for MCP: the protected
 * resource document must name <url>/mcp.
 */
export async function checkServer(url: string): Promise<{ resource: string; authorizationServer: string }> {
  const metadataUrl = `${baseUrl(url)}/.well-known/oauth-protected-resource/mcp`;
  let res: Response;
  try {
    res = await fetch(metadataUrl, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error(`Cannot reach Team-Ops at ${baseUrl(url)}. Check the URL and that the server is running.`);
  }
  const body = (await res.json().catch(() => null)) as { resource?: string; authorization_servers?: string[] } | null;
  if (!res.ok || !body?.resource || !body.authorization_servers?.length) {
    throw new Error(
      `${baseUrl(url)} doesn't look like a Team-Ops server with MCP sign-in (no ${metadataUrl}). Use the URL people open in the browser.`,
    );
  }
  return { resource: body.resource, authorizationServer: body.authorization_servers[0] };
}

/** Project keys look like API, WEB, ERP2 (what the web app accepts). */
export function normalizeProjectKey(raw: string | undefined): string | undefined {
  const key = raw?.trim().toUpperCase();
  if (!key) return undefined;
  if (!/^[A-Z][A-Z0-9]{1,9}$/.test(key)) throw new Error(`"${raw}" is not a project key (2–10 letters or digits, e.g. API, WEB).`);
  return key;
}
