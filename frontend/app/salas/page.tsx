import type { Metadata } from "next";

import { RoomsBoard } from "@/components/rooms/rooms-board";

export const metadata: Metadata = {
  title: "Salas | Pharons Online" ,
};

export default function RoomsPage() {
  return (
    <main className="relative z-10 pb-12 pt-[136px] sm:pt-36 lg:pt-[136px]">
      <RoomsBoard />
    </main>
  );
}
