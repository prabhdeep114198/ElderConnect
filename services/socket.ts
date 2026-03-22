import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api/config";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (!socket) {
    const SERVER_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_BASE_URL.replace('/api', '');

    socket = io(SERVER_URL);

    socket.on("connect", () => console.log(" Connected to Socket Server"));
    socket.on("connect_error", (err) => console.log("Connection failed:", err.message));
  }
  return socket;
}