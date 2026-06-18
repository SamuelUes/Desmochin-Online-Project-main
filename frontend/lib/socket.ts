import { io } from "socket.io-client";

export const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

export const socket = io(socketUrl, {
  autoConnect: false,
});
