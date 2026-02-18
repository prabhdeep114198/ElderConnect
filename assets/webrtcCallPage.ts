/**
 * assets/webrtcCallPage.ts
 *
 * The WebRTC call page HTML embedded as a TypeScript string.
 * Used by VideoCallScreen.tsx:
 *   - Mobile: passed to WebView's html prop
 *   - Web: converted to a Blob URL for an iframe
 *
 * To regenerate after editing webrtc_call.html:
 *   node scripts/embedHtml.js
 */

export const WEBRTC_HTML: string = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>ElderConnect Video Call</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0a0e1a;
    --surface:   rgba(255,255,255,0.06);
    --border:    rgba(255,255,255,0.10);
    --accent:    #4fc3f7;
    --green:     #43d17a;
    --red:       #f25c5c;
    --text:      #f0f4ff;
    --muted:     rgba(240,244,255,0.55);
    --radius:    20px;
    --font:      'DM Sans', system-ui, sans-serif;
  }

  html, body {
    width: 100%; height: 100%;
    background: var(--bg);
    font-family: var(--font);
    color: var(--text);
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── VIDEO LAYER ──────────────────────────────────────────────── */
  #videoLayer {
    position: fixed; inset: 0;
    display: none;
  }

  #remoteVideo {
    width: 100%; height: 100%;
    object-fit: cover;
    background: #111;
  }

  #localVideo {
    position: absolute;
    top: 16px; right: 16px;
    width: 120px; height: 160px;
    border-radius: 16px;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,0.3);
    background: #222;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  }

  /* Voice-only avatar shown when camera is off / voice call */
  #voiceAvatar {
    position: absolute; inset: 0;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: linear-gradient(135deg, #0d1b2a 0%, #1a2e4a 100%);
  }

  #voiceAvatarRing {
    width: 120px; height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), #0277bd);
    display: flex; align-items: center; justify-content: center;
    animation: pulse 2s ease-in-out infinite;
    box-shadow: 0 0 0 0 rgba(79,195,247,0.4);
  }

  #voiceAvatarInitial {
    font-size: 52px; font-weight: 700; color: #fff;
  }

  #voiceAvatarName {
    font-size: 22px; font-weight: 600; color: var(--text);
  }

  @keyframes pulse {
    0%   { box-shadow: 0 0 0 0 rgba(79,195,247,0.5); }
    70%  { box-shadow: 0 0 0 20px rgba(79,195,247,0); }
    100% { box-shadow: 0 0 0 0 rgba(79,195,247,0); }
  }

  /* ── TOP HUD ──────────────────────────────────────────────────── */
  #topHud {
    position: fixed; top: 0; left: 0; right: 0;
    padding: 48px 20px 20px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  #durationBadge {
    display: flex; align-items: center; gap: 8px;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    border-radius: 40px;
    padding: 8px 18px;
  }

  #redDot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--red);
    animation: blink 1.2s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.2; }
  }

  #durationText {
    font-size: 16px; font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.05em;
  }

  /* ── CONTROL BAR ──────────────────────────────────────────────── */
  #controlBar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    padding: 24px 32px 48px;
    background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
    display: none;
    align-items: center;
    justify-content: center;
    gap: 20px;
    z-index: 10;
  }

  .ctrl-btn {
    width: 68px; height: 68px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 4px;
    font-family: var(--font);
    font-size: 11px; font-weight: 600;
    color: #fff;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
    transition: transform 0.15s ease, background 0.2s;
    -webkit-tap-highlight-color: transparent;
  }

  .ctrl-btn:active { transform: scale(0.92); }

  .ctrl-btn.active {
    background: rgba(255,255,255,0.1);
    border-color: var(--accent);
  }

  .ctrl-btn svg { width: 28px; height: 28px; }

  #endBtn {
    width: 80px; height: 80px;
    background: var(--red);
    border-color: transparent;
    font-size: 12px;
  }

  #endBtn:hover { background: #d32f2f; }

  /* ── WAITING SCREEN ───────────────────────────────────────────── */
  #waitingScreen {
    position: fixed; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 28px;
    padding: 32px;
    background: linear-gradient(135deg, #0a0e1a 0%, #0d1b35 100%);
  }

  .waiting-ring-outer {
    width: 140px; height: 140px; border-radius: 50%;
    background: var(--surface);
    border: 2px solid var(--accent);
    display: flex; align-items: center; justify-content: center;
    animation: spin-pulse 2.5s ease-in-out infinite;
  }

  .waiting-ring-inner {
    width: 110px; height: 110px; border-radius: 50%;
    background: linear-gradient(135deg, #1565c0, var(--accent));
    display: flex; align-items: center; justify-content: center;
    font-size: 52px; font-weight: 700;
  }

  @keyframes spin-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(79,195,247,0.5), 0 0 0 0 rgba(79,195,247,0.3); }
    50%  { box-shadow: 0 0 0 15px rgba(79,195,247,0.2), 0 0 0 30px rgba(79,195,247,0.05); }
    100% { box-shadow: 0 0 0 0 rgba(79,195,247,0.5), 0 0 0 0 rgba(79,195,247,0.3); }
  }

  #waitingTitle {
    font-size: 26px; font-weight: 700;
    text-align: center;
  }

  #waitingSubtitle {
    font-size: 16px; color: var(--muted);
    text-align: center;
  }

  .dots::after {
    content: '...';
    animation: dots 1.5s steps(4, end) infinite;
  }

  @keyframes dots {
    0%   { content: ''; }
    25%  { content: '.'; }
    50%  { content: '..'; }
    75%  { content: '...'; }
  }

  #cancelCallBtn {
    margin-top: 12px;
    width: 80px; height: 80px; border-radius: 50%;
    background: var(--red);
    border: none; cursor: pointer;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 4px; color: #fff;
    font-family: var(--font); font-size: 12px; font-weight: 600;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.15s;
  }

  #cancelCallBtn:active { transform: scale(0.92); }
  #cancelCallBtn svg { width: 30px; height: 30px; }

  /* ── ENDED SCREEN ─────────────────────────────────────────────── */
  #endedScreen {
    position: fixed; inset: 0;
    display: none; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 20px;
    padding: 32px;
    background: linear-gradient(135deg, #0a0e1a 0%, #0d1b35 100%);
  }

  #endedIcon { font-size: 80px; }

  #endedTitle {
    font-size: 28px; font-weight: 700;
    text-align: center;
  }

  #endedDuration {
    font-size: 18px; color: var(--muted);
  }

  #endedError {
    font-size: 15px; color: var(--red);
    text-align: center;
    max-width: 280px;
  }

  #goBackBtn {
    margin-top: 16px;
    background: var(--accent);
    color: #000;
    font-family: var(--font); font-size: 18px; font-weight: 700;
    border: none; border-radius: 50px;
    padding: 16px 48px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.15s, opacity 0.15s;
  }

  #goBackBtn:active { transform: scale(0.96); opacity: 0.85; }

  /* ── STATUS TOAST ─────────────────────────────────────────────── */
  #statusToast {
    position: fixed; bottom: 140px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    border-radius: 40px;
    padding: 10px 22px;
    font-size: 13px; font-weight: 500; color: var(--muted);
    opacity: 0; transition: opacity 0.3s;
    white-space: nowrap; z-index: 20;
  }

  #statusToast.show { opacity: 1; }
</style>
</head>
<body>

<!-- ── WAITING SCREEN ─────────────────────────────────────────── -->
<div id="waitingScreen">
  <div class="waiting-ring-outer">
    <div class="waiting-ring-inner" id="callerInitial">?</div>
  </div>
  <div>
    <div id="waitingTitle">Connecting<span class="dots"></span></div>
    <div id="waitingSubtitle" style="margin-top:8px">Setting up your call</div>
  </div>
  <button id="cancelCallBtn" onclick="cancelCall()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
    Cancel
  </button>
</div>

<!-- ── ENDED SCREEN ───────────────────────────────────────────── -->
<div id="endedScreen">
  <div id="endedIcon">✅</div>
  <div id="endedTitle">Call Ended</div>
  <div id="endedDuration"></div>
  <div id="endedError"></div>
  <button id="goBackBtn" onclick="notifyParent('go_back')">Go Back</button>
</div>

<!-- ── VIDEO LAYER ────────────────────────────────────────────── -->
<div id="videoLayer">
  <video id="remoteVideo" autoplay playsinline></video>
  <div id="voiceAvatar">
    <div id="voiceAvatarRing">
      <span id="voiceAvatarInitial">?</span>
    </div>
    <span id="voiceAvatarName">In call</span>
  </div>
  <video id="localVideo" autoplay playsinline muted></video>
</div>

<!-- ── TOP HUD ────────────────────────────────────────────────── -->
<div id="topHud">
  <div id="durationBadge">
    <div id="redDot"></div>
    <span id="durationText">0:00</span>
  </div>
</div>

<!-- ── CONTROL BAR ────────────────────────────────────────────── -->
<div id="controlBar">

  <button class="ctrl-btn" id="muteBtn" onclick="toggleMute()">
    <svg id="muteIcon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/>
      <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 10z"/>
    </svg>
    <span id="muteLabel">Mute</span>
  </button>

  <button class="ctrl-btn" id="cameraBtn" onclick="toggleCamera()">
    <svg id="cameraIcon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.868V15.13a1 1 0 0 1-1.447.937L15 14v-4z"/>
      <rect x="1" y="6" width="15" height="12" rx="2"/>
    </svg>
    <span id="cameraLabel">Camera</span>
  </button>

  <button class="ctrl-btn" id="flipBtn" onclick="flipCamera()">
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 5h-3.17L15 3H9L7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-8 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
    </svg>
    Flip
  </button>

  <button class="ctrl-btn" id="endBtn" onclick="endCall()">
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11.4 21 3 12.6 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
    </svg>
    End
  </button>

</div>

<!-- ── STATUS TOAST ───────────────────────────────────────────── -->
<div id="statusToast"></div>

<!-- ── Socket.IO from CDN (no npm needed) ────────────────────── -->
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>

<script>
// ══════════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════════

let socket        = null;
let pc            = null;           // RTCPeerConnection
let localStream   = null;
let callId        = null;
let roomId        = null;
let isCaller      = false;
let isMuted       = false;
let isCameraOff   = false;
let callType      = 'video';
let isVoiceOnly   = false;
let useRearCamera = false;
let durationSecs  = 0;
let durationTimer = null;

// Injected from React Native / URL params
let userId        = '';
let authToken     = '';
let apiBase       = '';
let calleeId      = '';
let incomingCallId= '';
let callerName    = '';
let mode          = 'outgoing';     // 'outgoing' | 'incoming'

// ══════════════════════════════════════════════════════════════════
//  INIT – Read params (from URL or postMessage from RN)
// ══════════════════════════════════════════════════════════════════

function initFromParams() {
  const p = new URLSearchParams(window.location.search);
  userId       = p.get('userId')        || '';
  authToken    = p.get('token')         || '';
  apiBase      = p.get('apiBase')       || '';
  calleeId     = p.get('calleeId')      || '';
  incomingCallId = p.get('callId')      || '';
  callerName   = p.get('callerName')    || 'Family';
  mode         = p.get('mode')          || 'outgoing';
  callType     = p.get('callType')      || 'video';
  isVoiceOnly  = callType === 'voice';

  // Update UI
  document.getElementById('callerInitial').textContent =
    (mode === 'incoming' ? callerName : 'You').charAt(0).toUpperCase();

  if (mode === 'incoming') {
    document.getElementById('waitingTitle').textContent = 'Connecting';
    document.getElementById('waitingSubtitle').textContent =
      \`Joining call with \${callerName}\`;
  }
}

// React Native sends params via postMessage too (for WebView)
window.addEventListener('message', (e) => {
  try {
    const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    if (data.type === 'init') {
      userId       = data.userId       || userId;
      authToken    = data.token        || authToken;
      apiBase      = data.apiBase      || apiBase;
      calleeId     = data.calleeId     || calleeId;
      incomingCallId = data.callId     || incomingCallId;
      callerName   = data.callerName   || callerName;
      mode         = data.mode         || mode;
      callType     = data.callType     || callType;
      isVoiceOnly  = callType === 'voice';
      start();
    }
  } catch {}
});

// ══════════════════════════════════════════════════════════════════
//  SOCKET.IO  (signaling)
// ══════════════════════════════════════════════════════════════════

function connectSocket() {
  const origin = apiBase.replace(/\\/api\\/?$/, '');
  socket = io(\`\${origin}/videocall\`, { transports: ['websocket'] });

  socket.on('connect', () => {
    socket.emit('authenticate', { userId, token: authToken });
    showToast('Connected to server');
  });

  socket.on('call:accepted', async ({ call_id, room_id: rid }) => {
    callId = call_id;
    roomId = rid;
    showToast('Call accepted – connecting video…');
    await startWebRTC(true); // caller creates offer
  });

  socket.on('call:rejected', ({ reason }) => {
    showEnded('Call Declined', reason || 'The other person declined.', true);
  });

  socket.on('call:ended', ({ duration_seconds }) => {
    durationSecs = duration_seconds || durationSecs;
    showEnded('Call Ended', null, false);
  });

  socket.on('call:missed', () => {
    showEnded('No Answer', 'The other person did not answer.', true);
  });

  // ── WebRTC signaling relay ─────────────────────────────────────
  socket.on('webrtc:offer', async ({ sdp }) => {
    if (!pc) await startWebRTC(false);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('webrtc:answer', { call_id: callId, sdp: pc.localDescription });
  });

  socket.on('webrtc:answer', async ({ sdp }) => {
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  });

  socket.on('webrtc:ice-candidate', async ({ candidate }) => {
    try {
      if (candidate && pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (e) { console.warn('ICE error', e); }
  });
}

// ══════════════════════════════════════════════════════════════════
//  API CALLS
// ══════════════════════════════════════════════════════════════════

async function apiPost(path, body) {
  const res = await fetch(\`\${apiBase}\${path}\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${authToken}\`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || \`HTTP \${res.status}\`);
  }
  return res.status === 204 ? null : res.json();
}

// ══════════════════════════════════════════════════════════════════
//  WEBRTC PEER CONNECTION
// ══════════════════════════════════════════════════════════════════

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Add TURN servers here for production:
  // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
];

async function startWebRTC(isInitiator) {
  showActiveUI();

  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // ── Get local media ──────────────────────────────────────────────
  try {
    const constraints = isVoiceOnly
      ? { audio: true, video: false }
      : { audio: true, video: { facingMode: useRearCamera ? 'environment' : 'user' } };

    localStream = await navigator.mediaDevices.getUserMedia(constraints);

    if (!isVoiceOnly) {
      document.getElementById('localVideo').srcObject = localStream;
    }

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  } catch (e) {
    showToast('Could not access camera/microphone');
    console.error(e);
  }

  // ── ICE candidate handler ────────────────────────────────────────
  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit('webrtc:ice-candidate', { call_id: callId, candidate });
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log('ICE state:', pc.iceConnectionState);
    if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
      showToast('Connected ✓');
      startDurationTimer();
    }
    if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
      showToast('Connection lost, reconnecting…');
    }
  };

  // ── Remote stream ────────────────────────────────────────────────
  pc.ontrack = (event) => {
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];

      if (isVoiceOnly || isCameraOff) {
        showVoiceAvatar(true);
      } else {
        showVoiceAvatar(false);
      }
    }
  };

  // ── If initiator (caller), create and send offer ─────────────────
  if (isInitiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('webrtc:offer', { call_id: callId, sdp: pc.localDescription });
  }
}

// ══════════════════════════════════════════════════════════════════
//  ENTRY POINT
// ══════════════════════════════════════════════════════════════════

async function start() {
  connectSocket();

  if (mode === 'outgoing') {
    isCaller = true;
    try {
      const res = await apiPost('/v1/videocalls/initiate', {
        callee_id: calleeId,
        call_type: callType,
      });
      callId = res.call_id;
      roomId = res.room_id;

      // Tell the callee via WS
      socket.on('connect', () => {
        setTimeout(() => socket.emit('call:invite', { call_id: callId }), 200);
      });
      // Socket might already be connected
      if (socket.connected) {
        setTimeout(() => socket.emit('call:invite', { call_id: callId }), 200);
      }

      document.getElementById('waitingTitle').textContent = 'Calling…';
      document.getElementById('waitingSubtitle').textContent = 'Waiting for answer';

    } catch (e) {
      showEnded('Failed to Start Call', e.message, true);
    }

  } else {
    // Incoming – callee side
    isCaller = false;
    callId   = incomingCallId;

    // Signal WS that we accepted (REST already called from RN before navigating here)
    socket.on('connect', () => {
      setTimeout(() => socket.emit('call:accept', { call_id: callId }), 200);
    });
    if (socket.connected) {
      setTimeout(() => socket.emit('call:accept', { call_id: callId }), 200);
    }

    // Start WebRTC as receiver (wait for offer)
    await startWebRTC(false);
  }
}

// ══════════════════════════════════════════════════════════════════
//  CONTROLS
// ══════════════════════════════════════════════════════════════════

function toggleMute() {
  if (!localStream) return;
  isMuted = !isMuted;
  localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);

  const btn = document.getElementById('muteBtn');
  const lbl = document.getElementById('muteLabel');
  const ico = document.getElementById('muteIcon');
  btn.classList.toggle('active', isMuted);
  lbl.textContent = isMuted ? 'Unmute' : 'Mute';

  ico.innerHTML = isMuted
    ? \`<path d="M19 11a7 7 0 0 1-.78 3.23L4.92 2.69A4 4 0 0 1 16 5v5.17l3 3V11zM5 11a7 7 0 0 0 11.81 5.19l-1.42-1.42A5 5 0 0 1 7 11V8.83L3.27 5.1A6.97 6.97 0 0 0 5 11zm7 9a7 7 0 0 0 7-7v-.17l-2-2V13a5 5 0 0 1-9.95.63l-1.45-1.45A7 7 0 0 0 12 20zm0-13a3 3 0 0 0-3 3v.17l6 6V11a3 3 0 0 0-3-3z"/>\`
    : \`<path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/><path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 10z"/>\`;

  showToast(isMuted ? 'Microphone off' : 'Microphone on');
}

function toggleCamera() {
  if (!localStream || isVoiceOnly) return;
  isCameraOff = !isCameraOff;
  localStream.getVideoTracks().forEach(t => t.enabled = !isCameraOff);
  document.getElementById('localVideo').style.opacity = isCameraOff ? '0' : '1';

  const btn = document.getElementById('cameraBtn');
  const lbl = document.getElementById('cameraLabel');
  btn.classList.toggle('active', isCameraOff);
  lbl.textContent = isCameraOff ? 'Camera On' : 'Camera';

  showVoiceAvatar(isCameraOff);
  showToast(isCameraOff ? 'Camera off' : 'Camera on');
}

async function flipCamera() {
  if (!localStream || isVoiceOnly) return;
  useRearCamera = !useRearCamera;

  try {
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { facingMode: useRearCamera ? 'environment' : 'user' },
    });

    const videoTrack = newStream.getVideoTracks()[0];
    const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
    if (sender) await sender.replaceTrack(videoTrack);

    localStream.getVideoTracks().forEach(t => t.stop());
    document.getElementById('localVideo').srcObject = newStream;

    // Keep audio from original stream
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) newStream.addTrack(audioTrack);
    localStream = newStream;

    showToast(useRearCamera ? 'Rear camera' : 'Front camera');
  } catch (e) {
    showToast('Could not switch camera');
  }
}

async function endCall() {
  cleanup();
  try { await apiPost('/api/v1/videocalls/end', { call_id: callId }); } catch {}
  socket?.emit('call:end', { call_id: callId });
  showEnded('Call Ended', null, false);
}

async function cancelCall() {
  cleanup();
  try { await apiPost('/api/v1/videocalls/end', { call_id: callId }); } catch {}
  socket?.emit('call:end', { call_id: callId });
  notifyParent('go_back');
}

// ══════════════════════════════════════════════════════════════════
//  UI HELPERS
// ══════════════════════════════════════════════════════════════════

function showActiveUI() {
  document.getElementById('waitingScreen').style.display = 'none';
  document.getElementById('endedScreen').style.display = 'none';
  document.getElementById('videoLayer').style.display  = 'block';
  document.getElementById('topHud').style.display      = 'flex';
  document.getElementById('controlBar').style.display  = 'flex';

  if (isVoiceOnly) {
    document.getElementById('remoteVideo').style.display = 'none';
    showVoiceAvatar(true);
    document.getElementById('localVideo').style.display  = 'none';
    document.getElementById('cameraBtn').style.display   = 'none';
    document.getElementById('flipBtn').style.display     = 'none';
  }
}

function showVoiceAvatar(show) {
  document.getElementById('voiceAvatar').style.display = show ? 'flex' : 'none';
  document.getElementById('voiceAvatarInitial').textContent =
    callerName.charAt(0).toUpperCase();
  document.getElementById('voiceAvatarName').textContent = callerName;
}

function showEnded(title, errorMsg, isError) {
  cleanup();
  document.getElementById('waitingScreen').style.display = 'none';
  document.getElementById('videoLayer').style.display    = 'none';
  document.getElementById('topHud').style.display        = 'none';
  document.getElementById('controlBar').style.display    = 'none';
  document.getElementById('endedScreen').style.display   = 'flex';

  document.getElementById('endedIcon').textContent     = isError ? '❌' : '✅';
  document.getElementById('endedTitle').textContent    = title;
  document.getElementById('endedError').textContent    = errorMsg || '';
  document.getElementById('endedDuration').textContent =
    durationSecs > 0 ? \`Duration: \${formatTime(durationSecs)}\` : '';
}

function startDurationTimer() {
  if (durationTimer) return;
  durationSecs = 0;
  durationTimer = setInterval(() => {
    durationSecs++;
    document.getElementById('durationText').textContent = formatTime(durationSecs);
  }, 1000);
}

function formatTime(s) {
  return \`\${Math.floor(s / 60)}:\${String(s % 60).padStart(2, '0')}\`;
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('statusToast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

function cleanup() {
  if (durationTimer) { clearInterval(durationTimer); durationTimer = null; }
  localStream?.getTracks().forEach(t => t.stop());
  localStream = null;
  pc?.close();
  pc = null;
}

// ══════════════════════════════════════════════════════════════════
//  REACT NATIVE BRIDGE
//  Called from inside WebView to send messages back to RN
// ══════════════════════════════════════════════════════════════════

function notifyParent(action, payload = {}) {
  const msg = JSON.stringify({ action, ...payload });
  // React Native WebView bridge
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(msg);
  }
  // Web fallback – dispatch custom event
  window.dispatchEvent(new CustomEvent('elderconnect', { detail: { action, ...payload } }));
}

// ══════════════════════════════════════════════════════════════════
//  AUTO-START if params are in the URL (web browser mode)
// ══════════════════════════════════════════════════════════════════
initFromParams();
if (userId && apiBase) {
  start();
}
</script>
</body>
</html>
`;