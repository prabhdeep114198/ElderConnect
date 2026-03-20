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
    const url = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://elderconnect-api-esfdawb8drara7ge.centralindia-01.azurewebsites.net';
    return io(url);
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};