import { NextRequest, NextResponse } from "next/server";

const ROLE_PATHS: Record<string, string[]> = {
  student: ["/student"],
  university_staff: ["/university"],
  super_admin: ["/admin"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/student") ||
    pathname.startsWith("/university") ||
    pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const apiUrl = process.env.API_URL || "http://localhost:8200";
    const res = await fetch(`${apiUrl}/api/v1/me`, {
      headers: { Cookie: `access_token=${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const user = await res.json();
    const role: string = user.role;

    for (const [allowedRole, paths] of Object.entries(ROLE_PATHS)) {
      for (const path of paths) {
        if (pathname.startsWith(path) && role !== allowedRole) {
          const home =
            role === "student"
              ? "/student"
              : role === "university_staff"
                ? "/university"
                : role === "super_admin"
                  ? "/admin"
                  : "/login";
          return NextResponse.redirect(new URL(home, request.url));
        }
      }
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/university/:path*", "/admin/:path*"],
};
