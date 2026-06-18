"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { getBackendBaseUrl } from "@/lib/backend";

type LogoutButtonVariant = "button" | "menu";

type LogoutButtonProps = {
  children?: ReactNode;
  className?: string;
  onLoggedOut?: () => void;
  redirectTo?: string;
  variant?: LogoutButtonVariant;
};

const variantClasses: Record<LogoutButtonVariant, string> = {
  button:
    "min-h-9 rounded-[8px] border border-[#d99c22]/80 bg-white/5 px-3 text-[10px] font-extrabold uppercase tracking-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-[#ffd86a] hover:bg-[#f7b832]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7b832] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4",
  menu:
    "w-full px-5 py-2.5 text-right text-sm font-extrabold text-[#f7d273] transition hover:bg-[#f7b832]/10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#f7b832] disabled:cursor-not-allowed disabled:opacity-60",
};

export function LogoutButton({
  children,
  className,
  onLoggedOut,
  redirectTo = "/",
  variant = "button",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      await fetch(`${getBackendBaseUrl()}/api/auth/logout`, {
        credentials: "include",
        method: "POST",
      });
      onLoggedOut?.();
      router.push(redirectTo);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      className={className ?? variantClasses[variant]}
      disabled={isLoading}
      onClick={handleLogout}
      type="button"
    >
      {isLoading ? "Saliendo..." : (children ?? "Logout")}
    </button>
  );
}
