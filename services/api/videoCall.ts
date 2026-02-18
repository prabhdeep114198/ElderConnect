import { client } from './client';
import type { CallType } from './videoCallTypes';

export interface InitiateCallPayload {
  callee_id:  string;
  call_type?: CallType;
}

export interface InitiateCallResponse {
  call_id: string;
  room_id: string;       // WebRTC room identifier (no Agora token needed)
}

export interface JoinCallResponse {
  room_id:   string;
  call_type: CallType;
}

export interface CallHistoryItem {
  id:               string;
  caller_id:        string;
  callee_id:        string;
  room_id:          string;
  status:           string;
  call_type:        CallType;
  accepted_at:      string | null;
  ended_at:         string | null;
  duration_seconds: number;
  reason:           string | null;
  created_at:       string;
}

const BASE = '/api/v1/videocalls';

export async function initiateCall(payload: InitiateCallPayload): Promise<InitiateCallResponse> {
  const { data } = await client.post<InitiateCallResponse>(`${BASE}/initiate`, payload);
  return data;
}

export async function joinCall(callId: string): Promise<JoinCallResponse> {
  const { data } = await client.post<JoinCallResponse>(`${BASE}/join`, { call_id: callId });
  return data;
}

export async function rejectCall(callId: string, reason?: string): Promise<void> {
  await client.post(`${BASE}/reject`, { call_id: callId, reason });
}

export async function endCall(callId: string, reason?: string): Promise<void> {
  await client.post(`${BASE}/end`, { call_id: callId, reason });
}

export async function getCallHistory(page = 1, limit = 20) {
  const { data } = await client.get(`${BASE}/history`, { params: { page, limit } });
  return data;
}