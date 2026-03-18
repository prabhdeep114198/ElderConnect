import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api/config";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (!socket) {
    // 💡 Dynamically resolve IP from API config instead of hardcoded localhost
    const SERVER_URL = API_BASE_URL.replace('/api', '');

    socket = io(SERVER_URL, {
      transports: ["websocket"], // Force websocket for better performance
    });

    socket.on("connect", () => console.log(" Connected to NestJS on port 3000"));
    socket.on("connect_error", (err) => console.log("Connection failed:", err.message));
  }
  return socket;
}