import { cookies } from "next/headers";

import { ActionButton } from "@/components/buttons/action-button";
import { FeatureCard } from "@/components/cards/feature-card";
import { CardShowcase } from "@/components/game/card-showcase";
import { MainNavbar } from "@/components/navbar/main-navbar";
import { getProfileImageOrDefault } from "@/lib/auth/profile-images";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const guestFeatures = [
  {
    id: "juegos",
    icon: "users" as const,
    title: "Juega en linea",
    description: "Con jugadores reales en tiempo real.",
  },
  {
    id: "salas",
    icon: "chip" as const,
    title: "Mesas para todos",
    description: "Desde principiante hasta profesional.",
  },
  {
    id: "ayuda",
    icon: "shield" as const,
    title: "Seguro y justo",
    description: "Ambiente protegido y juego limpio.",
  },
];

const authenticatedFeatures = [
  {
    id: "juegos",
    icon: "users" as const,
    title: "Mesa activa",
    description: "Tu perfil ya esta listo para entrar a partidas.",
  },
  {
    id: "salas",
    icon: "chip" as const,
    title: "Salas disponibles",
    description: "Explora mesas publicas o prepara una privada.",
  },
  {
    id: "ayuda",
    icon: "shield" as const,
    title: "Sesion protegida",
    description: "Tu acceso esta firmado con cookie segura.",
  },
];

async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return verifySessionToken(token);
}

export default async function Home() {
  const session = await getCurrentSession();
  const features = session ? authenticatedFeatures : guestFeatures;

  return (
    <main
      id="inicio"
      className="relative min-h-screen overflow-hidden bg-[#03050d] text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(247,184,50,0.2),transparent_27%),radial-gradient(circle_at_18%_28%,rgba(60,74,102,0.24),transparent_26%),linear-gradient(110deg,#02040b_0%,#07101e_48%,#05070e_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:76px_76px]" />
      <div className="absolute left-[8%] top-[18%] h-48 w-48 rounded-full bg-[#f7b832]/10 blur-3xl" />
      <div className="absolute bottom-[-18%] right-[-8%] h-80 w-80 rounded-full bg-[#f7b832]/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 max-[520px]:mx-0 max-[520px]:max-w-[390px] sm:px-6 lg:px-8">
        <MainNavbar
          activeItem="inicio"
          user={
            session
              ? {
                  email: session.email,
                  profileImage: getProfileImageOrDefault(
                    session.profileImage,
                    session.email,
                  ),
                  username: session.username,
                }
              : null
          }
        />

        <section className="grid min-w-0 flex-1 items-center gap-10 pt-32 pb-8 sm:pt-36 lg:grid-cols-[0.92fr_1.08fr] lg:gap-4 lg:pt-24">
          <div className="min-w-0 max-w-2xl">
            {session ? (
              <>
                <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.22em] text-[#f7b832]">
                  Sesion iniciada
                </p>
                <h1 className="max-w-[780px] text-4xl leading-[1.05] font-extrabold tracking-normal text-balance text-white sm:text-6xl lg:text-7xl">
                  Bienvenido,{" "}
                  <span className="text-[#f7b832]">{session.username}.</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                  Tu mesa esta lista. Entra a una sala, reta a otros jugadores.
                </p>
              </>
            ) : (
              <>
                <h1 className="max-w-[780px] text-4xl leading-[1.05] font-extrabold tracking-normal text-balance text-white sm:text-6xl lg:text-7xl">
                  Tus cartas, tu mesa,{" "}
                  <span className="text-[#f7b832]">tus reglas.</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                  Disfruta los mejores juegos de cartas con jugadores reales,
                  salas privadas y dinamicas unicas.
                </p>
              </>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {session ? (
                <>

                </>
              ) : (
                <>
                  <ActionButton href="/auth/register">Jugar ahora</ActionButton>
                  <ActionButton href="/salas" variant="secondary">
                    Explorar salas
                  </ActionButton>
                </>
              )}
            </div>
          </div>

          <CardShowcase />
        </section>

        <section
          aria-label="Beneficios de Cartas"
          className="grid gap-3 pb-4 sm:grid-cols-3 sm:pb-5 lg:pb-6"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </section>
      </div>
    </main>
  );
}
