import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MainNavbar } from "@/components/navbar/main-navbar";
import { getProfileImageOrDefault } from "@/lib/auth/profile-images";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return verifySessionToken(token);
}

export default async function GamesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#03050d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_48%,rgba(217,156,34,0.14),transparent_25%),radial-gradient(circle_at_20%_28%,rgba(77,92,118,0.16),transparent_28%),radial-gradient(circle_at_92%_60%,rgba(130,86,26,0.18),transparent_26%),linear-gradient(110deg,#050913_0%,#08101d_45%,#05070d_100%)]" />
      <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:78px_78px]" />
      <div className="absolute left-[7%] top-[22%] h-64 w-64 rounded-full bg-white/[0.08] blur-3xl" />
      <div className="absolute right-[10%] top-[24%] h-72 w-72 rounded-full bg-[#f7b832]/[0.12] blur-3xl" />

      <div className="relative mx-auto min-h-screen w-full max-w-[1366px] px-4 sm:px-6 lg:px-[70px]">
        <MainNavbar
          activeItem="juegos"
          user={{
            email: session.email,
            profileImage: getProfileImageOrDefault(
              session.profileImage,
              session.email,
            ),
            username: session.username,
          }}
        />
        {children}
      </div>
    </section>
  );
}
