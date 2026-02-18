export type CallType   = 'video' | 'voice';
export type CallStatus = 'pending' | 'accepted' | 'rejected' | 'missed' | 'ended' | 'failed';

export interface IncomingCallPayload {
  call_id:     string;
  caller_id:   string;
  call_type:   CallType;
  caller_name?: string;
}