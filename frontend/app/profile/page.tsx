import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ProfilePanel } from "@/components/profile/profile-panel";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import { serializeRequestCookies } from "@/lib/request-cookies";

export const metadata: Metadata = {
  title: "Perfil | Pharons Online",
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const user = await getCurrentAuthUser(serializeRequestCookies(cookieStore));

  if (!user) {
    redirect("/auth/login");
  }

  const authenticatedUser = user!;

  return (
    <main className="relative z-10 pb-12 pt-[136px] sm:pt-36 lg:pt-[136px]">
      <ProfilePanel initialUser={authenticatedUser} />
    </main>
  );
}
