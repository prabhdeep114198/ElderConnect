import React, { createContext, useContext, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  return useContext(SocketContext)!;
};

export const SocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const socket = useMemo(() => {
    return io('192.168.1.9:3000'); // NestJS default port
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};