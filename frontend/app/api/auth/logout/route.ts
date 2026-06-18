import { NextResponse } from "next/server";

import { getBackendBaseUrl } from "@/lib/backend";

export const runtime = "nodejs";

export async function POST() {
  try {
    const backendUrl = getBackendBaseUrl();

    const response = await fetch(`${backendUrl}/api/auth/logout`, {
      credentials: "include",
      method: "POST",
    });

    const data = (await response.json().catch(() => null)) as
      | { message?: string; ok?: boolean }
      | null;

    const nextResponse = NextResponse.json(data, { status: response.status });

    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader);
    }

    return nextResponse;
  } catch (error) {
    console.error("[auth/logout proxy]", error);

    return NextResponse.json(
      { message: "No pudimos cerrar sesion." },
      { status: 500 },
    );
  }
}
