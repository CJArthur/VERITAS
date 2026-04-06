import { NextRequest, NextResponse } from "next/server";

const ROLE_PATHS: Record<string, string[]> = {
  student: ["/student"],
  university_staff: ["/issuer", "/university"],
  super_admin: ["/admin"],
};

const API_URL = process.env.API_URL || "http://localhost:8200";

async function fetchUser(accessToken: string): Promise<{ role: string } | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/me`, {
      headers: { Cookie: `access_token=${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function tryRefresh(
  refreshToken: string
): Promise<{ user: { role: string }; setCookies: string[] } | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/refresh`, {
      method: "POST",
      headers: { Cookie: `refresh_token=${refreshToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;

    // Достаём все Set-Cookie заголовки (Edge Runtime поддерживает getSetCookie)
    const setCookies: string[] =
      typeof (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie ===
      "function"
        ? (res.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
        : [res.headers.get("set-cookie") ?? ""].filter(Boolean);

    // Извлекаем новый access_token чтобы сразу получить данные пользователя
    const newAccessToken = setCookies
      .map((c) => c.match(/^access_token=([^;]+)/)?.[1])
      .find(Boolean);

    if (!newAccessToken) return null;

    const user = await fetchUser(newAccessToken);
    if (!user) return null;

    return { user, setCookies };
  } catch {
    return null;
  }
}

function roleHomePath(role: string): string {
  if (role === "student") return "/student";
  if (role === "university_staff") return "/issuer";
  if (role === "super_admin") return "/admin";
  return "/login";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect legacy /university/* paths to /issuer/*
  if (pathname.startsWith("/university/") || pathname === "/university") {
    const newPath = pathname.replace(/^\/university/, "/issuer");
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, { status: 308 });
  }

  const isProtected =
    pathname.startsWith("/student") ||
    pathname.startsWith("/issuer") ||
    pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Нет ни одного токена — на логин
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let user: { role: string } | null = null;
  let newCookies: string[] = [];

  // Пробуем текущий access token
  if (accessToken) {
    user = await fetchUser(accessToken);
  }

  // Access token протух или отсутствует — тихо обновляем через refresh token
  if (!user && refreshToken) {
    const refreshed = await tryRefresh(refreshToken);
    if (refreshed) {
      user = refreshed.user;
      newCookies = refreshed.setCookies;
    }
  }

  // Оба токена невалидны — на логин
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Проверяем что роль соответствует запрошенному пути
  const { role } = user;
  for (const [allowedRole, paths] of Object.entries(ROLE_PATHS)) {
    for (const path of paths) {
      if (pathname.startsWith(path) && role !== allowedRole) {
        return NextResponse.redirect(
          new URL(roleHomePath(role), request.url)
        );
      }
    }
  }

  const response = NextResponse.next();

  // Если обновили токены — прокидываем новые куки в браузер
  for (const cookie of newCookies) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}

export const config = {
  matcher: ["/student/:path*", "/issuer/:path*", "/university/:path*", "/admin/:path*"],
};
