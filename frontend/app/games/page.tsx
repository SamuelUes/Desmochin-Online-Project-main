import type { Metadata } from "next";

import { GameCard } from "@/components/games/game-card";

export const metadata: Metadata = {
  title: "Juegos | Pharons Online" ,
};

const games = [
  {
    description: "Enfrenta a jugadores en mesas",
    href: "/games/poker",
    imageAlt: "Cartas de poker con ficha de casino",
    imageSrc: "/Image-poker.png",
    title: "POKER",
    variant: "poker" as const,
  },
  {
    description: "Juego cl\u00e1sico de cartas nicarag\u00fcense",
    href: "/games/desmoche-bots",
    imageAlt: "Cartas para jugar desmoche",
    imageSrc: "/Image-desmoche.png",
    title: "DESMOCHE",
    variant: "desmoche" as const,
  },
  {
    description: "Desaf\u00eda tu mente en solitario",
    href: "/games/solitario",
    imageAlt: "Cartas para jugar solitario",
    imageSrc: "/Image-solitario.png",
    title: "SOLITARIO",
    variant: "solitario" as const,
  },
];

export default function GamesPage() {
  return (
    <main className="relative z-10 pb-12 pt-[136px] sm:pt-36 lg:pt-[136px]">
      <section aria-labelledby="games-heading">
        <div className="mb-12">
          <h1
            id="games-heading"
            className="text-4xl leading-tight font-extrabold tracking-normal text-white sm:text-5xl"
          >
            &iquest;Qu&eacute; quieres jugar hoy?
          </h1>
          <p className="mt-2 text-xl font-medium text-white sm:text-2xl">
            Elige tu juego favorito
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 xl:gap-11">
          {games.map((game) => (
            <GameCard key={game.title} {...game} />
          ))}
        </div>
      </section>
    </main>
  );
}
