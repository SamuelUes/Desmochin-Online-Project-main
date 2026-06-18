import type { Metadata } from "next";

import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

import { RegisterForm } from "@/components/auth/register-form";

async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return verifySessionToken(token);
}

export const metadata: Metadata = {
  title: "Registrarme",
  description: "Crea una cuenta para jugar en Cartas Casino.",
};

export default async function Page() {
  const session = await getCurrentSession();
    if (session) {
      redirect("/");
    }

  return <RegisterForm />;
}
