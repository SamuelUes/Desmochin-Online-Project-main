import { ChipIcon, ShieldIcon, UsersIcon } from "@/components/ui/icons";
import type { ComponentType } from "react";

type FeatureIcon = "chip" | "shield" | "users";

type FeatureCardProps = {
  description: string;
  icon: FeatureIcon;
  id: string;
  title: string;
};

const icons: Record<FeatureIcon, ComponentType<{ className?: string }>> = {
  chip: ChipIcon,
  shield: ShieldIcon,
  users: UsersIcon,
};

export function FeatureCard({
  description,
  icon,
  id,
  title,
}: FeatureCardProps) {
  const Icon = icons[icon];

  return (
    <article
      id={id}
      className="group flex min-h-28 items-center gap-4 rounded-[8px] border border-white/8 bg-white/[0.055] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:border-[#f7b832]/50 hover:bg-white/[0.075]"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] border border-[#f7b832]/15 bg-[#f7b832]/10 text-[#f7b832] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-sm font-extrabold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
      </div>
    </article>
  );
}
