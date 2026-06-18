import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md";

type ActionButtonProps = {
  children: ReactNode;
  href: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-[8px] border font-extrabold uppercase tracking-normal transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7b832]";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-[10px] sm:px-4",
  md: "min-h-12 px-6 text-xs sm:min-w-44 sm:px-8",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-[#ffd86a] bg-gradient-to-b from-[#ffe079] to-[#d99c22] text-[#130d04] shadow-[0_15px_35px_rgba(247,184,50,0.25)] hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(247,184,50,0.34)]",
  secondary:
    "border-[#d99c22]/80 bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5 hover:border-[#ffd86a] hover:bg-[#f7b832]/10",
};

export function ActionButton({
  children,
  href,
  size = "md",
  variant = "primary",
}: ActionButtonProps) {
  return (
    <Link
      href={href}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {children}
    </Link>
  );
}
