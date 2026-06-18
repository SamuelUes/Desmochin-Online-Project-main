import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { MainNavbar } from "@/components/navbar/main-navbar";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import { serializeRequestCookies } from "@/lib/request-cookies";

export default async function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const user = await getCurrentAuthUser(serializeRequestCookies(cookieStore));

  if (!user) {
    redirect("/auth/login");
  }

  const authenticatedUser = user!;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#03050d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_32%,rgba(247,184,50,0.16),transparent_27%),radial-gradient(circle_at_18%_28%,rgba(66,82,110,0.22),transparent_25%),linear-gradient(110deg,#03050d_0%,#07101e_48%,#04060d_100%)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:76px_76px]" />

      <div className="relative mx-auto min-h-screen w-full max-w-[1366px] px-4 sm:px-6 lg:px-[70px]">
        <MainNavbar user={authenticatedUser} />
        {children}
      </div>
    </section>
  );
}
