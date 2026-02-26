// services/peer.ts
class PeerService {
  public peer: RTCPeerConnection | null = null;

  constructor() {
    this.init();
  }

  init() {
    if (typeof window !== "undefined" && typeof RTCPeerConnection !== "undefined") {
      this.peer = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      });
    } else {
      console.warn("RTCPeerConnection is not available in this environment");
    }
  }

  recreatePeer() {
    if (this.peer) {
      this.peer.getSenders().forEach(sender => this.peer?.removeTrack(sender));
      this.peer.close();
    }
    this.init();
    return this.peer;
  }

  async getOffer() {
    if (!this.peer) return;
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async getAnswer(offer: any) {
    if (!this.peer) return;
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const ans = await this.peer.createAnswer();
    await this.peer.setLocalDescription(ans);
    return ans;
  }

  async setRemoteDescription(ans: any) {
    if (!this.peer) return;
    await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
  }
}
export default new PeerService();