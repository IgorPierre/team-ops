import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/register"]);
const SESSION_COOKIE = "teamops_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!session && !isPublic) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    if (pathname !== "/") {
      // Keep the query: /oauth/authorize carries the editor's request in it.
      login.searchParams.set("next", pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(login);
  }

  if (session && pathname === "/login") {
    // The app sends a dead session here (e.g. after a database reset): drop
    // the cookie and show the form, instead of bouncing back to the board.
    if (request.nextUrl.searchParams.has("expired")) {
      const response = NextResponse.next();
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // API proxies (see next.config.ts) and the MCP endpoint authenticate themselves
  // with bearer tokens; they must never redirect to /login.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|v1/|healthz$|mcp$|\\.well-known/|oauth/(?:token|register|revoke)$).*)"],
};
