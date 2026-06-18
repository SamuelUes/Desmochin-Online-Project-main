import Image from "next/image";
import Link from "next/link";

type GameVariant = "desmoche" | "poker" | "solitario";

type GameCardProps = {
  description: string;
  href: string;
  imageAlt: string;
  imageSrc: string;
  title: string;
  variant: GameVariant;
};

const accentGlow: Record<GameVariant, string> = {
  desmoche: "bg-[#f7d273]/[0.13]",
  poker: "bg-[#6ea8ff]/[0.12]",
  solitario: "bg-[#f7b832]/[0.13]",
};

export function GameCard({
  description,
  href,
  imageAlt,
  imageSrc,
  title,
  variant,
}: GameCardProps) {
  return (
    <article className="group relative flex min-h-[450px] overflow-hidden rounded-[42px] border border-white/[0.28] bg-white/[0.075] shadow-[inset_0_1px_0_rgba(255,255,255,0.48),inset_0_-28px_70px_rgba(7,15,31,0.52),0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
      <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_5%,rgba(255,255,255,0.42),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.025)_42%,rgba(2,8,19,0.56))]" />
      <div
        className={`absolute left-1/2 top-0 h-44 w-44 -translate-x-1/2 rounded-full blur-3xl ${accentGlow[variant]}`}
      />

      <div className="relative z-10 flex w-full flex-col items-center px-8 pt-9 pb-10 text-center">
        <div className="relative mb-2 h-[232px] w-full max-w-[290px] transition duration-300 group-hover:-translate-y-1">
          <Image
            alt={imageAlt}
            className="object-contain drop-shadow-[0_24px_26px_rgba(0,0,0,0.34)]"
            fill
            priority
            sizes="(min-width: 1024px) 290px, 72vw"
            src={imageSrc}
          />
        </div>

        <div className="mt-auto flex w-full flex-col items-center">
          <h2 className="text-3xl font-extrabold tracking-normal text-white">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-[260px] text-[22px] leading-[1.12] font-medium text-white">
            {description}
          </p>

          <Link
            className="mt-5 inline-flex h-11 min-w-36 items-center justify-center rounded-[8px] border-2 border-[#d69a16] px-7 text-2xl font-extrabold leading-none text-white transition duration-200 hover:-translate-y-0.5 hover:border-[#ffd86a] hover:bg-[#f7b832]/[0.12] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7b832]"
            href={href}
          >
            JUGAR
          </Link>
        </div>
      </div>
    </article>
  );
}
