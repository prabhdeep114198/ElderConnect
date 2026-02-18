import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (!socket) {
    // 💡 TIP: If testing on a real phone, replace 'localhost' with your computer's IP
    const SERVER_URL = "http://localhost:3000"; 
    
    socket = io(SERVER_URL, {
      transports: ["websocket"], // Force websocket for better performance
    });

    socket.on("connect", () => console.log("✅ Connected to NestJS on port 3000"));
    socket.on("connect_error", (err) => console.log("❌ Connection failed:", err.message));
  }
  return socket;
}