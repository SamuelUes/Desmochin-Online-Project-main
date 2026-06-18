import type { ReactNode } from "react";

type SocialButtonProps = {
  children: ReactNode;
  icon: ReactNode;
};

export function SocialButton({ children, icon }: SocialButtonProps) {
  return (
    <button
      className="flex h-11 items-center justify-center gap-3 rounded-[8px] border border-white/14 bg-white/[0.025] px-4 text-xs font-semibold text-white transition hover:border-[#f7b832]/45 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7b832]"
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}
