import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const panelUsername = process.env.PANEL_USERNAME?.trim();
const panelPassword = process.env.PANEL_PASSWORD?.trim();
const authEnabled = Boolean(panelUsername && panelPassword);
const expectedAuthHeader = authEnabled ? `Basic ${btoa(`${panelUsername}:${panelPassword}`)}` : null;

export function proxy(request: NextRequest) {
  if (!authEnabled) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === expectedAuthHeader) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Freight MVP"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
