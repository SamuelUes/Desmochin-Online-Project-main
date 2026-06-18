"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { socket, socketUrl } from "@/lib/socket";

type Card = {
  color?: "black" | "red" | string;
  id?: string;
  label?: string;
  rank?: string;
  rankName?: string;
  suit?: string;
  suitName?: string;
  suitSymbol?: string;
  value: number | string;
};

type PlayerSummary = {
  cardCount?: number;
  connected?: boolean;
  userId: string;
  username: string;
};

type PersonalGameState = {
  currentTurn?: string;
  mainDeck?: number | Card[];
  myHand?: Card[];
  phase?: string;
  players?: PlayerSummary[];
  roomCode?: string;
};

type DesmocheTableProps = {
  roomCode: string;
  user: {
    id: string;
    username: string;
  };
};

export function DesmocheTable({ roomCode, user }: DesmocheTableProps) {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [message, setMessage] = useState("Conectando con la sala...");
  const [isConnected, setIsConnected] = useState(false);
  const [gameHasStarted, setGameHasStarted] = useState(false);
  const [hostId, setHostId] = useState<string | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [roomStatus, setRoomStatus] = useState("waiting");

  useEffect(() => {
    localStorage.setItem("desmoche_userId", user.id);
    localStorage.setItem("desmoche_username", user.username);
    localStorage.setItem("desmoche_roomCode", roomCode);
    localStorage.setItem("desmoche_socketUrl", socketUrl);
    localStorage.removeItem("desmoche_gameState");

    function openGame(nextGameState?: PersonalGameState) {
      if (nextGameState?.players) {
        setPlayers(nextGameState.players);
      }
      setMessage("Partida iniciada.");
      setGameHasStarted(true);
    }

    function handleConnect() {
      setIsConnected(true);
      setMessage("Uniendote a la sala...");
      socket.emit("joinRoom", {
        roomCode,
        userId: user.id,
        username: user.username,
      });
    }

    function handleDisconnect() {
      setIsConnected(false);
      setMessage("Conexion cerrada.");
    }

    function handleRoomUpdated(payload: {
      hostId?: string;
      maxPlayers?: number;
      players: PlayerSummary[];
      status?: string;
    }) {
      setPlayers(payload.players);
      setHostId(payload.hostId ?? null);
      setMaxPlayers(payload.maxPlayers ?? 4);
      setRoomStatus(payload.status ?? "waiting");
      setMessage(
        payload.status === "playing"
          ? "Partida en curso."
          : `En sala: ${payload.players.length}/${payload.maxPlayers ?? 4}. Esperando jugadores...`,
      );
    }

    function handleGameStart(payload: { gameState: PersonalGameState }) {
      openGame(payload.gameState);
    }

    function handleGameStarted() {
      openGame();
    }

    function handleGameSnapshot(payload: { gameState: PersonalGameState }) {
      if (payload.gameState.phase && payload.gameState.phase !== "waiting") {
        openGame(payload.gameState);
      }
    }

    function handleSocketError(payload: { message?: string }) {
      setMessage(payload.message ?? "Ocurrio un error en la sala.");
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("roomUpdated", handleRoomUpdated);
    socket.on("gameStart", handleGameStart);
    socket.on("gameStarted", handleGameStarted);
    socket.on("gameSnapshot", handleGameSnapshot);
    socket.on("error", handleSocketError);
    socket.on("gameError", handleSocketError);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("roomUpdated", handleRoomUpdated);
      socket.off("gameStart", handleGameStart);
      socket.off("gameStarted", handleGameStarted);
      socket.off("gameSnapshot", handleGameSnapshot);
      socket.off("error", handleSocketError);
      socket.off("gameError", handleSocketError);
      socket.disconnect();
    };
  }, [roomCode, user.id, user.username]);

  function requestStartGame() {
    socket.emit("room:startGame", {
      roomCode,
      userId: user.id,
    });
  }

  const canStartGame =
    roomStatus === "waiting" && hostId === user.id && players.length >= 2;

  if (gameHasStarted) {
    return (
      <iframe
        className="fixed inset-0 z-[100] h-screen w-screen border-0 bg-[#211105]"
        src="/desmoche-game/index.html"
        title="Desmoche"
      />
    );
  }

  return (
    <main className="relative z-10 min-h-screen pb-10 pt-[116px] sm:pt-32">
      <section className="mx-auto grid min-h-[calc(100vh-160px)] max-w-5xl place-items-center rounded-[8px] border border-white/[0.12] bg-[#050914]/78 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-[#f7d273] bg-[#f7b832]/10 text-3xl font-black text-[#f7d273]">
            {maxPlayers}
          </div>
          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.22em] text-[#f7d273]">
            Sala {roomCode}
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-normal text-white sm:text-5xl">
            Esperando jugadores
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-6 text-slate-300">
            La partida inicia automaticamente cuando se llena la sala. El
            anfitrion tambien puede iniciarla con al menos 2 jugadores.
          </p>

          <p className="mt-5 rounded-[8px] border border-white/[0.1] bg-white/[0.055] px-4 py-3 text-sm font-bold text-slate-100">
            {message}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: maxPlayers }).map((_, index) => {
              const player = players[index];

              return (
                <div
                  className="flex min-h-14 items-center justify-between rounded-[8px] border border-white/[0.1] bg-[#070c16]/85 px-4 text-left"
                  key={player?.userId ?? index}
                >
                  <span className="min-w-0 truncate text-sm font-extrabold text-white">
                    {player?.username ?? "Esperando..."}
                  </span>
                  <span
                    className={`h-3 w-3 rounded-full ${
                      player?.connected ? "bg-emerald-300" : "bg-slate-600"
                    }`}
                    title={player?.connected ? "Conectado" : "Pendiente"}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-white/[0.14] bg-white/[0.06] px-5 text-sm font-extrabold text-white transition hover:bg-white/[0.1]"
              href="/salas"
            >
              Volver a salas
            </Link>
            <span
              className={`inline-flex min-h-11 items-center justify-center rounded-[8px] border px-5 text-sm font-extrabold ${
                isConnected
                  ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-200"
                  : "border-red-300/40 bg-red-400/10 text-red-200"
              }`}
            >
              {isConnected ? "Conectado" : "Desconectado"}
            </span>
            {hostId === user.id ? (
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[#ffd86a] bg-gradient-to-b from-[#ffe079] to-[#d99c22] px-5 text-sm font-extrabold text-[#130d04] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canStartGame}
                onClick={requestStartGame}
                type="button"
              >
                Iniciar partida
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
