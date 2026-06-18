import { NextResponse } from "next/server";

import { getBackendBaseUrl } from "@/lib/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    roomCode: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { roomCode } = await context.params;
    const backendUrl = getBackendBaseUrl();
    const response = await fetch(
      `${backendUrl}/api/rooms/${encodeURIComponent(roomCode)}`,
      { cache: "no-store" },
    );
    const data = await response.json().catch(() => null);

    const nextResponse = NextResponse.json(data, { status: response.status });
    nextResponse.headers.set("Cache-Control", "no-store");
    return nextResponse;
  } catch (error) {
    console.error("[rooms/:roomCode GET proxy]", error);
    return NextResponse.json(
      { error: "No pudimos cargar la sala." },
      { status: 500 },
    );
  }
}
