import Link from "next/link";

import { ActionButton } from "@/components/buttons/action-button";
import { UserMenu } from "@/components/navbar/user-menu";
import { SpadeIcon } from "@/components/ui/icons";

const navItems = [
  { href: "/", id: "inicio", label: "Inicio" },
  { href: "/games", id: "juegos", label: "Juegos" },
  { href: "/salas", id: "salas", label: "Salas" },
  { href: "/faqs", id: "faqs", label: "FAQs" },
] as const;

type NavbarActiveItem = (typeof navItems)[number]["id"];

type NavbarUser = {
  email: string;
  profileImage?: string | null;
  username: string;
};

type MainNavbarProps = {
  activeItem?: NavbarActiveItem | null;
  user?: NavbarUser | null;
};

export function MainNavbar({ activeItem = null, user }: MainNavbarProps) {
  return (
    <header className="absolute inset-x-4 top-4 z-30 sm:inset-x-6 lg:inset-x-8">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:gap-4"
      >
        <Link
          href="/"
          className="flex items-center gap-3 text-xl font-extrabold text-white sm:text-2xl"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f7b832]/70 text-[#f7b832] shadow-[0_0_20px_rgba(247,184,50,0.2)]">
            <SpadeIcon className="h-5 w-5" />
          </span>
          Pharons Online
        </Link>

        {user ? (
          <div className="order-3 flex w-full basis-full flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-extrabold text-slate-100 sm:gap-x-10 md:order-2 md:w-auto md:basis-auto">
            {navItems.map((item) => (
              <Link
                data-active={activeItem === item.id}
                key={item.label}
                href={item.href}
                className="navbar-link"
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : (
          <></>
        )}

        <div className="order-2 flex w-full basis-full items-center justify-start gap-2 sm:w-auto sm:basis-auto md:order-3 md:justify-end">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <ActionButton href="/auth/login" size="sm" variant="secondary">
                Iniciar sesion
              </ActionButton>
              <ActionButton href="/auth/register" size="sm">
                Registrarme
              </ActionButton>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
