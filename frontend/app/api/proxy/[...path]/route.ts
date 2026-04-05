/**
 * API Proxy — временная архитектура для раздельного деплоя (Vercel + Railway).
 *
 * ЗАЧЕМ: браузер не отправляет httpOnly-куки, установленные на домене Railway,
 * в запросы к домену Vercel. Прокси пропускает все API-запросы через Next.js,
 * чтобы куки ставились на домен фронтенда и были доступны middleware.
 *
 * КОГДА УБИРАТЬ: при переезде на единый сервер (бэкенд и фронтенд на одном домене).
 * Достаточно изменить NEXT_PUBLIC_API_URL с "/api/proxy" на прямой URL бэкенда
 * и удалить этот файл. Никакой другой код менять не нужно.
 *
 * БЕЗОПАСНОСТЬ: прокси только пересылает запросы и заголовки, не хранит данные.
 * Set-Cookie заголовки от бэкенда прокидываются в браузер без изменений.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_URL || "http://localhost:8200";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetPath = path.join("/");
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/${targetPath}${search}`;

  // Пробрасываем все заголовки кроме host
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });

  // Пробрасываем куки из браузера на бэкенд
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) headers.set("cookie", cookieHeader);

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.arrayBuffer()
      : undefined;

  const backendRes = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    // @ts-expect-error — duplex нужен для стриминга body в Node.js runtime
    duplex: "half",
  });

  // Копируем ответ
  const responseHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    // Set-Cookie прокидываем как есть — браузер сохранит на домене Vercel
    if (key.toLowerCase() !== "transfer-encoding") {
      responseHeaders.append(key, value);
    }
  });

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
