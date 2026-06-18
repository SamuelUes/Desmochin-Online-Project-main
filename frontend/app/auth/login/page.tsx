import type { Metadata } from "next";

import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesion",
  description: "Accede a tu cuenta de Cartas Casino.",
};

async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return verifySessionToken(token);
}

export default async function Page() {
  const session = await getCurrentSession();
  
    if (session) {
      redirect("/");
    }

  return <LoginForm />;
}
