"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type GameFilter = "Todas" | "Poker" | "Desmoche" | "Solitario";

type BackendRoom = {
  _id: string;
  game: Exclude<GameFilter, "Todas">;
  hostId: string;
  maxPlayers: number;
  minPlayers?: number;
  players: {
    connected: boolean;
    userId: string;
    username: string;
  }[];
  roomCode: string;
  status: "waiting" | "playing" | string;
};

type AuthUser = {
  email: string;
  id: string;
  profileImage: string;
  username: string;
};

const gameImages: Record<Exclude<GameFilter, "Todas">, string> = {
  Desmoche: "/Image-desmoche.png",
  Poker: "/Image-poker.png",
  Solitario: "/Image-solitario.png",
};

const filters: GameFilter[] = ["Todas", "Poker", "Desmoche", "Solitario"];

export function RoomsBoard() {
  const router = useRouter();
  const [rooms, setRooms] = useState<BackendRoom[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [filter, setFilter] = useState<GameFilter>("Todas");
  const [query, setQuery] = useState("");
  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Cargando salas...");
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(4);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const userResponse = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!userResponse.ok) {
          router.push("/auth/login");
          return;
        }

        const userData = (await userResponse.json()) as { user: AuthUser };

        if (!isMounted) return;

        setCurrentUser(userData.user);
        setStatusMessage("Cargando salas...");
      } catch (error) {
        if (!isMounted) return;
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "No pudimos cargar las salas.",
        );
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    async function loadRooms(showStatus = false) {
      try {
        const roomsResponse = await fetch("/api/rooms", {
          cache: "no-store",
        });

        if (!roomsResponse.ok) {
          if (!isMounted) return;
          setRooms([]);
          setSelectedRoomCode(null);
          setStatusMessage("No pudimos cargar las salas, pero puedes crear una nueva.");
          return;
        }

        const roomsData = (await roomsResponse.json()) as BackendRoom[];

        if (!isMounted) return;

        setRooms(roomsData);
        setSelectedRoomCode((current) => {
          if (current && roomsData.some((room) => room.roomCode === current)) {
            return current;
          }
          return roomsData[0]?.roomCode ?? null;
        });
        if (showStatus) {
          setStatusMessage(
            roomsData.length
              ? "Selecciona una sala o crea una mesa nueva."
              : "Todavia no hay salas activas.",
          );
        }
      } catch (error) {
        if (!isMounted) return;
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "No pudimos cargar las salas.",
        );
      }
    }

    loadRooms(true);
    const intervalId = window.setInterval(() => loadRooms(false), 3000);
    const handleFocus = () => loadRooms(false);
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentUser]);

  const visibleRooms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchesFilter = filter === "Todas" || room.game === filter;
      const matchesQuery =
        room.roomCode.toLowerCase().includes(normalizedQuery) ||
        room.players.some((player) =>
          player.username.toLowerCase().includes(normalizedQuery),
        );

      return matchesFilter && matchesQuery;
    });
  }, [filter, query, rooms]);

  const selectedRoom =
    rooms.find((room) => room.roomCode === selectedRoomCode) ?? visibleRooms[0];

  async function createRoom() {
    if (!currentUser) {
      setStatusMessage("Tu sesion aun no esta lista. Intenta de nuevo en un momento.");
      return;
    }

    setIsCreating(true);
    setStatusMessage("Creando sala...");

    try {
      const roomCode = `DES-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const response = await fetch("/api/rooms", {
        body: JSON.stringify({
          game: "Desmoche",
          hostId: currentUser.id,
          hostUsername: currentUser.username,
          maxPlayers: newRoomMaxPlayers,
          minPlayers: 2,
          players: [
            {
              connected: true,
              userId: currentUser.id,
              username: currentUser.username,
            },
          ],
          roomCode,
          status: "waiting",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(data?.error ?? "No pudimos crear la sala.");
      }

      const data = (await response.json()) as { roomCode?: string };
      const createdRoomCode = data.roomCode ?? roomCode;
      router.push(`/games/desmoche?roomCode=${encodeURIComponent(createdRoomCode)}`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "No pudimos crear la sala.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function enterRoom(room: BackendRoom) {
    if (room.game !== "Desmoche") {
      router.push(`/games/${room.game.toLowerCase()}`);
      return;
    }

    router.push(`/games/desmoche?roomCode=${encodeURIComponent(room.roomCode)}`);
  }

  return (
    <section className="rounded-[8px] border border-white/[0.12] bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-5">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-[#f7d273]">
            Salas / lobbies
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-normal text-white sm:text-5xl">
            Salas de juego
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-300">
            {statusMessage}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-h-11 items-center gap-2 rounded-[8px] border border-white/[0.12] bg-[#050914]/70 px-3 text-sm font-extrabold text-white">
            <span>Jugadores</span>
            <select
              className="bg-transparent text-[#f7d273] outline-none"
              onChange={(event) => setNewRoomMaxPlayers(Number(event.target.value))}
              value={newRoomMaxPlayers}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[#ffd86a] bg-gradient-to-b from-[#ffe079] to-[#d99c22] px-6 text-sm font-extrabold text-[#130d04] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCreating}
            onClick={createRoom}
            type="button"
          >
            {isCreating ? "Creando..." : "Crear sala Desmoche"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  className={`rounded-[8px] px-4 py-2 text-sm font-extrabold transition ${
                    filter === item
                      ? "bg-[#f7b832]/15 text-[#f7d273]"
                      : "bg-white/[0.045] text-slate-300 hover:bg-white/[0.08] hover:text-white"
                  }`}
                  key={item}
                  onClick={() => setFilter(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="w-full md:max-w-xs">
              <span className="sr-only">Buscar sala</span>
              <input
                className="min-h-10 w-full rounded-[8px] border border-white/[0.12] bg-[#050914]/70 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-[#f7d273]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por codigo o jugador..."
                value={query}
              />
            </label>
          </div>

          <div className="mt-4 overflow-hidden rounded-[8px] border border-white/[0.1]">
            <div className="grid grid-cols-[1.1fr_0.8fr_0.7fr_0.8fr] bg-[#070c16] px-4 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-400">
              <span>Sala</span>
              <span>Juego</span>
              <span>Jugadores</span>
              <span className="text-right">Acciones</span>
            </div>

            <div className="divide-y divide-white/[0.07]">
              {visibleRooms.map((room) => (
                <button
                  className={`grid w-full grid-cols-[1.1fr_0.8fr_0.7fr_0.8fr] items-center px-4 py-3 text-left text-sm transition ${
                    selectedRoom?.roomCode === room.roomCode
                      ? "bg-[#f7b832]/12"
                      : "bg-[#050914]/55 hover:bg-white/[0.055]"
                  }`}
                  key={room.roomCode}
                  onClick={() => setSelectedRoomCode(room.roomCode)}
                  type="button"
                >
                  <span className="font-bold text-white">{room.roomCode}</span>
                  <span className="text-slate-300">{room.game}</span>
                  <span className="font-bold text-white">
                    {room.players.length} / {room.maxPlayers}
                  </span>
                  <span className="text-right">
                    <span
                      className="inline-flex min-h-8 items-center justify-center rounded-[8px] border border-[#d99c22] px-4 text-xs font-extrabold text-[#f7d273] transition hover:bg-[#f7b832]/10"
                      onClick={(event) => {
                        event.stopPropagation();
                        enterRoom(room);
                      }}
                    >
                      Unirse
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {visibleRooms.length === 0 ? (
              <div className="bg-[#050914]/55 px-4 py-10 text-center text-sm font-semibold text-slate-300">
                No encontramos salas con ese criterio.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="w-full rounded-[8px] border border-white/[0.1] bg-[#070c16]/78 p-4 lg:w-72">
          {selectedRoom ? (
            <>
              <h2 className="text-lg font-extrabold text-white">
                Informacion de la sala
              </h2>
              <div className="relative mx-auto mt-4 h-28 w-full max-w-52">
                <Image
                  alt={selectedRoom.game}
                  className="object-contain"
                  fill
                  sizes="208px"
                  src={gameImages[selectedRoom.game]}
                />
              </div>
              <dl className="mt-5 space-y-2 text-sm">
                <InfoRow label="Sala" value={selectedRoom.roomCode} />
                <InfoRow label="Juego" value={selectedRoom.game} />
                <InfoRow
                  label="Jugadores"
                  value={`${selectedRoom.players.length} / ${selectedRoom.maxPlayers}`}
                />
                <InfoRow label="Estado" value={selectedRoom.status} />
              </dl>
              <button
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[8px] border border-[#ffd86a] bg-gradient-to-b from-[#ffe079] to-[#d99c22] px-5 text-sm font-extrabold text-[#130d04] transition hover:-translate-y-0.5"
                onClick={() => enterRoom(selectedRoom)}
                type="button"
              >
                Entrar a la sala
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-300">Selecciona una sala.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="font-semibold text-slate-400">{label}</dt>
      <dd className="text-right font-bold text-white">{value}</dd>
    </div>
  );
}
