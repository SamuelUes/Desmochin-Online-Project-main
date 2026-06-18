import { NextResponse } from "next/server";

import { getBackendBaseUrl } from "@/lib/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const backendUrl = getBackendBaseUrl();
    const response = await fetch(`${backendUrl}/api/rooms`, {
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);

    const nextResponse = NextResponse.json(data, { status: response.status });
    nextResponse.headers.set("Cache-Control", "no-store");
    return nextResponse;
  } catch (error) {
    console.error("[rooms GET proxy]", error);
    return NextResponse.json(
      { error: "No pudimos cargar las salas." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const backendUrl = getBackendBaseUrl();
    const response = await fetch(`${backendUrl}/api/rooms`, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const data = await response.json().catch(() => null);

    const nextResponse = NextResponse.json(data, { status: response.status });
    nextResponse.headers.set("Cache-Control", "no-store");
    return nextResponse;
  } catch (error) {
    console.error("[rooms POST proxy]", error);
    return NextResponse.json(
      { error: "No pudimos crear la sala." },
      { status: 500 },
    );
  }
}
