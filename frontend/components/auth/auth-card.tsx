import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <section className="w-full max-w-[450px] rounded-[8px] border border-white/12 bg-[#101522]/86 px-7 py-9 shadow-[0_30px_90px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:px-9 sm:py-10">
      {children}
    </section>
  );
}
