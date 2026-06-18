import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { DesmocheTable } from "@/components/game/desmoche-table";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import { serializeRequestCookies } from "@/lib/request-cookies";

type DesmochePageProps = {
  searchParams: Promise<{
    roomCode?: string;
  }>;
};

export default async function DesmochePage({
  searchParams,
}: DesmochePageProps) {
  const cookieStore = await cookies();
  const user = await getCurrentAuthUser(serializeRequestCookies(cookieStore));
  const resolvedSearchParams = await searchParams;

  if (!user) {
    redirect("/auth/login");
  }

  const roomCode = resolvedSearchParams.roomCode?.trim().toUpperCase() ?? "";

  if (!roomCode) {
    redirect("/salas");
  }

  const authenticatedUser = user!;

  return (
    <DesmocheTable
      roomCode={roomCode}
      user={{
        id: authenticatedUser.id,
        username: authenticatedUser.username,
      }}
    />
  );
}
