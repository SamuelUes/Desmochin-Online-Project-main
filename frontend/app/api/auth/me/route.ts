import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getBackendBaseUrl } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendBaseUrl();
    const cookieHeader = request.headers.get("cookie") ?? "";

    const response = await fetch(`${backendUrl}/api/auth/me`, {
      credentials: "include",
      headers: {
        cookie: cookieHeader,
      },
      method: "GET",
    });

    const data = (await response.json().catch(() => null)) as
      | { message?: string; ok?: boolean; user?: unknown }
      | null;

    const nextResponse = NextResponse.json(data, { status: response.status });

    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader);
    }

    return nextResponse;
  } catch (error) {
    console.error("[auth/me GET proxy]", error);

    return NextResponse.json(
      { message: "No pudimos obtener la sesion." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const backendUrl = getBackendBaseUrl();
    const cookieHeader = request.headers.get("cookie") ?? "";

    const response = await fetch(`${backendUrl}/api/auth/me`, {
      body: JSON.stringify(body),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      method: "PATCH",
    });

    const data = (await response.json().catch(() => null)) as
      | { message?: string; ok?: boolean; user?: unknown }
      | null;

    const nextResponse = NextResponse.json(data, { status: response.status });

    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader);
    }

    return nextResponse;
  } catch (error) {
    console.error("[auth/me PATCH proxy]", error);

    return NextResponse.json(
      { message: "No pudimos actualizar el perfil." },
      { status: 500 },
    );
  }
}
