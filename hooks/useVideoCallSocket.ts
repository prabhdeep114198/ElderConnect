import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IncomingCallPayload } from '../services/api/videoCallTypes';

export interface VideoCallSocketCallbacks {
  onIncomingCall?:  (payload: IncomingCallPayload) => void;
  onCallAccepted?:  (callId: string) => void;
  onCallRejected?:  (callId: string, reason: string) => void;
  onCallEnded?:     (callId: string, durationSeconds: number) => void;
  onCallMissed?:    (callId: string) => void;
}

export function useVideoCallSocket(callbacks: VideoCallSocketCallbacks = {}) {
  const socketRef = useRef<Socket | null>(null);
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    // Read API base URL directly from env – no import needed
    const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';
    // Strip /api suffix to get just the origin for Socket.IO
    const origin = base.replace(/\/api\/?$/, '');

    const socket = io(origin, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Authenticate once connected
    // Uses auth_token and user_session — matching your AuthContext.tsx
    socket.on('connect', async () => {
      try {
        const token       = await AsyncStorage.getItem('auth_token');
        const sessionRaw  = await AsyncStorage.getItem('user_session');
        const userId      = sessionRaw ? JSON.parse(sessionRaw).id : null;
        if (userId) {
          socket.emit('authenticate', { userId, token });
        }
      } catch (e) {
        console.warn('[VideoCallSocket] Auth error:', e);
      }
    });

    socket.on('call:incoming', (data: IncomingCallPayload) => {
      cbRef.current.onIncomingCall?.(data);
    });

    socket.on('call:accepted', (data: { call_id: string }) => {
      cbRef.current.onCallAccepted?.(data.call_id);
    });

    socket.on('call:rejected', (data: { call_id: string; reason: string }) => {
      cbRef.current.onCallRejected?.(data.call_id, data.reason);
    });

    socket.on('call:ended', (data: { call_id: string; duration_seconds: number }) => {
      cbRef.current.onCallEnded?.(data.call_id, data.duration_seconds);
    });

    socket.on('call:missed', (data: { call_id: string }) => {
      cbRef.current.onCallMissed?.(data.call_id);
    });

    return () => {
      socket.off('connect');
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('call:missed');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emitInitiate = useCallback((callId: string) => {
    socketRef.current?.emit('call:initiate', { call_id: callId });
  }, []);

  const emitAccept = useCallback((callId: string) => {
    socketRef.current?.emit('call:accept', { call_id: callId });
  }, []);

  const emitReject = useCallback((callId: string, reason?: string) => {
    socketRef.current?.emit('call:reject', { call_id: callId, reason });
  }, []);

  const emitEnd = useCallback((callId: string) => {
    socketRef.current?.emit('call:end', { call_id: callId });
  }, []);

  return { emitInitiate, emitAccept, emitReject, emitEnd };
}