import { NextResponse } from "next/server";

import { getBackendBaseUrl } from "@/lib/backend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const backendUrl = getBackendBaseUrl();

    const response = await fetch(`${backendUrl}/api/auth/register`, {
      body: JSON.stringify(body),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
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
    console.error("[auth/register proxy]", error);

    return NextResponse.json(
      { message: "No pudimos crear la cuenta." },
      { status: 500 },
    );
  }
}
