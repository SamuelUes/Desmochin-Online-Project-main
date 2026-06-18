"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LogoutButton } from "@/components/navbar/logout-button";
import { getProfileImageOrDefault } from "@/lib/auth/profile-images";

type UserMenuProps = {
  user: {
    email: string;
    profileImage?: string | null;
    username: string;
  };
};

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const profileImage = getProfileImageOrDefault(user.profileImage, user.email);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-[8px] border border-[#b78622]/80 bg-[#17150d]/78 px-3 pr-4 text-sm font-extrabold uppercase tracking-normal text-[#f7d273] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_14px_32px_rgba(0,0,0,0.22)] transition hover:border-[#ffd86a] hover:bg-[#2a2110] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7b832]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="relative h-8 w-8 overflow-hidden rounded-full border border-[#ffe6a0] bg-white">
          <Image
            alt={`Avatar de ${user.username}`}
            className="object-cover"
            fill
            sizes="32px"
            src={profileImage}
          />
        </span>
        <span className="max-w-28 truncate">{user.username}</span>
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-full min-w-44 overflow-hidden rounded-[8px] border border-[#b78622]/80 bg-[#19160e]/95 py-2 shadow-[0_22px_44px_rgba(0,0,0,0.38)] backdrop-blur-xl"
          role="menu"
        >
          <Link
            className="block px-5 py-2.5 text-right text-sm font-extrabold text-[#f7d273] transition hover:bg-[#f7b832]/10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#f7b832]"
            href="/profile"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            Perfil
          </Link>
          <LogoutButton
            onLoggedOut={() => setIsOpen(false)}
            redirectTo="/"
            variant="menu"
          >
            Cerrar Sesión
          </LogoutButton>
        </div>
      ) : null}
    </div>
  );
}
