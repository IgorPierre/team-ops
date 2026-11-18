/** Where the browser goes back to when the person declines. */
export function denyURL(redirectUri: string, state: string | null) {
  const url = new URL(redirectUri);
  url.searchParams.set("error", "access_denied");
  url.searchParams.set("error_description", "The request was declined in Team-Ops.");
  if (state) url.searchParams.set("state", state);
  return url.toString();
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Same rule as the API: exact match, or a loopback URL on any port (RFC 8252). */
export function isRegisteredRedirect(registered: string[], requested: string) {
  let req: URL;
  try {
    req = new URL(requested);
  } catch {
    return false;
  }
  return registered.some((r) => {
    if (r === requested) return true;
    try {
      const u = new URL(r);
      return (
        u.protocol === "http:" &&
        req.protocol === "http:" &&
        LOOPBACK.has(u.hostname) &&
        u.hostname === req.hostname &&
        u.pathname === req.pathname &&
        u.search === req.search
      );
    } catch {
      return false;
    }
  });
}
