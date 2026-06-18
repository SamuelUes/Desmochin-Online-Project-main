type PlayingCard = {
  color: string;
  rank: string;
  suit: string;
  transform: string;
  zIndex: number;
};

const cards: PlayingCard[] = [
  {
    color: "text-zinc-950",
    rank: "A",
    suit: "♠",
    transform: "translate(-50%, -50%) translateX(-72px) translateY(22px) rotate(-12deg)",
    zIndex: 1,
  },
  {
    color: "text-[#b91c1c]",
    rank: "A",
    suit: "♥",
    transform: "translate(-50%, -50%) translateX(-12px) translateY(-8px) rotate(-3deg)",
    zIndex: 2,
  },
  {
    color: "text-zinc-950",
    rank: "A",
    suit: "♣",
    transform: "translate(-50%, -50%) translateX(66px) translateY(22px) rotate(12deg)",
    zIndex: 3,
  },
];

export function CardShowcase() {
  return (
    <div
      className="relative mx-auto h-[330px] w-full min-w-0 max-w-full sm:h-[390px] sm:max-w-[560px] lg:h-[470px]"
      aria-label="Cartas de poker y ficha de casino"
      role="img"
    >
      <div className="absolute left-1/2 top-[52%] h-[76%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f7b832]/10 shadow-[0_0_70px_rgba(247,184,50,0.16)]" />
      <div className="absolute left-[52%] top-[56%] h-[52%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f7b832]/25" />
      <div className="absolute left-[18%] top-[42%] h-3 w-3 rounded-full bg-[#ffd86a] shadow-[0_0_28px_10px_rgba(247,184,50,0.45)]" />
      <div className="absolute bottom-[22%] right-[6%] h-3 w-3 rounded-full bg-[#ffd86a] shadow-[0_0_32px_10px_rgba(247,184,50,0.4)]" />

      <div className="absolute left-1/2 top-[42%] h-56 w-36 -translate-x-1/2 -translate-y-1/2 sm:h-72 sm:w-44 lg:h-80 lg:w-52">
        {cards.map((card) => (
          <div
            key={card.suit}
            className="absolute left-1/2 top-1/2 h-full w-full origin-bottom rounded-[8px] border border-black/10 bg-[#f3eadc] p-4 shadow-[0_32px_60px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.8)]"
            style={{ transform: card.transform, zIndex: card.zIndex }}
          >
            <div className={`text-4xl font-extrabold leading-none ${card.color}`}>
              {card.rank}
            </div>
            <div
              className={`mt-1 text-4xl leading-none sm:text-5xl ${card.color}`}
            >
              {card.suit}
            </div>
            <div
              className={`absolute bottom-4 right-4 rotate-180 text-6xl leading-none sm:text-7xl ${card.color}`}
            >
              {card.suit}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-[13%] left-1/2 z-10 h-32 w-32 -translate-x-1/2 rounded-full border-[10px] border-[#141414] bg-[#d7a33a] shadow-[0_22px_50px_rgba(0,0,0,0.55),0_0_45px_rgba(247,184,50,0.32)] sm:h-40 sm:w-40">
        <div
          className="absolute inset-[-10px] rounded-full"
          style={{
            background:
              "conic-gradient(#151515 0 12deg,#f3c65c 12deg 28deg,#151515 28deg 44deg,#f3c65c 44deg 60deg,#151515 60deg 80deg,#f3c65c 80deg 96deg,#151515 96deg 116deg,#f3c65c 116deg 132deg,#151515 132deg 152deg,#f3c65c 152deg 168deg,#151515 168deg 188deg,#f3c65c 188deg 204deg,#151515 204deg 224deg,#f3c65c 224deg 240deg,#151515 240deg 260deg,#f3c65c 260deg 276deg,#151515 276deg 296deg,#f3c65c 296deg 312deg,#151515 312deg 332deg,#f3c65c 332deg 348deg,#151515 348deg 360deg)",
          }}
        />
        <div className="absolute inset-[14px] rounded-full border border-[#ffd86a]/70 bg-[#171717] shadow-[inset_0_0_24px_rgba(0,0,0,0.7)]" />
        <div className="absolute inset-[34px] flex items-center justify-center rounded-full bg-gradient-to-b from-[#f6c556] to-[#bd8120] text-5xl text-[#16120b] shadow-[inset_0_2px_6px_rgba(255,255,255,0.35)] sm:inset-[42px] sm:text-6xl">
          ♠
        </div>
      </div>
    </div>
  );
}
