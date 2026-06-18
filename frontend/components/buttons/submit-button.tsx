import type { ButtonHTMLAttributes } from "react";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function SubmitButton({
  children,
  className = "",
  type = "submit",
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-12 w-full rounded-[8px] border border-[#ffd86a] bg-gradient-to-b from-[#ffe079] to-[#d99c22] px-6 text-xs font-extrabold uppercase tracking-normal text-[#130d04] shadow-[0_16px_34px_rgba(247,184,50,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(247,184,50,0.32)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7b832] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_16px_34px_rgba(247,184,50,0.22)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
