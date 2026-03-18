// services/peer.ts
// Manages the WebRTC RTCPeerConnection lifecycle.
// Kept intentionally stateless w/ respect to signaling — all socket
// communication lives in room.tsx so concerns remain separated.

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

class PeerService {
  public peer: RTCPeerConnection | null = null;

  // Called once on startup and whenever we need a fresh connection (after hangup).
  init(): RTCPeerConnection | null {
    if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') {
      console.warn('[PeerService] RTCPeerConnection unavailable (non-browser env).');
      return null;
    }
    this.peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    return this.peer;
  }

  // Tear down any existing peer and create a brand-new one.
  recreate(): RTCPeerConnection | null {
    if (this.peer) {
      this.peer.getSenders().forEach((s) => this.peer?.removeTrack(s));
      this.peer.close();
      this.peer = null;
    }
    return this.init();
  }

  // Caller side: create & store local offer, return SDP for signaling.
  async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peer) return null;
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  // Callee side: apply remote offer, create & store local answer, return SDP.
  async createAnswer(
    remoteSdp: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peer) return null;
    await this.peer.setRemoteDescription(new RTCSessionDescription(remoteSdp));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  // Caller side: apply callee's answer.
  async applyAnswer(remoteSdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peer) return;
    await this.peer.setRemoteDescription(new RTCSessionDescription(remoteSdp));
  }

  // Add a single ICE candidate (call once per buffered or live candidate).
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peer?.remoteDescription) {
      // Silently skip — the caller should buffer and retry after applyAnswer.
      return;
    }
    try {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[PeerService] Failed to add ICE candidate', err);
    }
  }
}

export const peerService = new PeerService();