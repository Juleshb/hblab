import { wsOrigin } from '../../apiOrigin';
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const listeners = new Set();
const callListeners = new Set();
const desk = globalThis.__hbmsDesk || (globalThis.__hbmsDesk = {});
export const deskEpoch = Date.now();

let socket = desk.socket || null;
let deskToken = desk.deskToken || '';
let deskRetry = null;
let call = desk.call || null;
let pc = desk.pc || null;
let localStream = desk.localStream || null;
let remoteAudio = null;
let remoteStream = null;
let remoteLive = false;
const mediaListeners = new Set();
let pendingOffer = desk.pendingOffer || null;
let pendingIce = desk.pendingIce || [];
let localIce = [];
let signalOpen = false;
let makingOffer = false;
let screenTrack = null;
let heldCamera = null;
let sourceCamera = null;
let effectName = 'none';
let effectFrame = 0;
let effectVideo = null;
let effectCanvas = null;
let effectStream = null;
let effectTrack = null;

export const VIDEO_EFFECTS = [
  { id: 'none', label: 'None' },
  { id: 'clean', label: 'Clean' },
  { id: 'soft', label: 'Soft' },
  { id: 'vivid', label: 'Vivid' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'mono', label: 'Mono' },
];

const EFFECT_FILTER = {
  soft: 'blur(1.6px) brightness(1.08) saturate(1.08)',
  vivid: 'contrast(1.16) saturate(1.5) brightness(1.04)',
  warm: 'sepia(0.3) saturate(1.25) brightness(1.05)',
  cool: 'saturate(0.9) hue-rotate(16deg) contrast(1.06) brightness(1.03)',
  mono: 'grayscale(1) contrast(1.12)',
};
let ringTimer = null;
let ringAudio = null;
let ringLoop = null;
let ringNodes = [];

function keep() {
  desk.socket = socket;
  desk.deskToken = deskToken;
  desk.call = call;
  desk.pc = pc;
  desk.localStream = localStream;
  desk.pendingOffer = pendingOffer;
  desk.pendingIce = pendingIce;
  desk.signalOpen = signalOpen;
}

function emitCall() {
  keep();
  callListeners.forEach((listener) => listener(call));
}

function send(event) {
  if (!socket || socket.readyState !== 1) return false;
  socket.send(JSON.stringify(event));
  return true;
}

export function subscribeDesk(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let openConversationId = '';
let noticeAt = 0;

export function setOpenConversation(id) {
  openConversationId = id || '';
}

export function currentOpenConversation() {
  return openConversationId;
}

export function playNotice() {
  const now = Date.now();
  if (now - noticeAt < 1200) return;
  if (call?.phase === 'ringing' || call?.phase === 'active') return;
  noticeAt = now;
  const ctx = unlockRing();
  if (!ctx) return;
  const start = ctx.currentTime;
  [740, 988].forEach((frequency, index) => {
    const when = start + index * 0.14;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.08, when + 0.02);
    gain.gain.linearRampToValueAtTime(0, when + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + 0.2);
  });
}

function emitMedia() {
  const snap = { local: localStream, remote: remoteStream, remoteLive };
  mediaListeners.forEach((listener) => listener(snap));
}

function watchRemote(stream) {
  remoteStream = stream || null;
  const update = () => {
    const tracks = remoteStream?.getVideoTracks?.() || [];
    remoteLive = tracks.some((track) => track.readyState === 'live' && !track.muted);
    emitMedia();
  };
  (remoteStream?.getTracks?.() || []).forEach((track) => {
    track.onmute = update;
    track.onunmute = update;
    track.onended = update;
  });
  update();
}

function takeRemote(stream, track) {
  if (!remoteStream) {
    remoteStream = stream || new MediaStream();
    if (!stream && track) remoteStream.addTrack(track);
  } else {
    const extras = stream && stream !== remoteStream ? [...stream.getTracks()] : [];
    if (track) extras.push(track);
    extras.forEach((item) => {
      if (item && !remoteStream.getTracks().some((have) => have.id === item.id)) remoteStream.addTrack(item);
    });
  }
  playRemote(remoteStream);
}

export function subscribeMedia(listener) {
  mediaListeners.add(listener);
  listener({ local: localStream, remote: remoteStream, remoteLive });
  return () => mediaListeners.delete(listener);
}

async function capture(video) {
  if (video) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch {
      /* the camera was blocked, so the call continues with voice */
    }
  }
  return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
}

export function subscribeCall(listener) {
  callListeners.add(listener);
  listener(call);
  return () => callListeners.delete(listener);
}

export function deskCall() {
  return call;
}

export function disconnectDesk() {
  deskToken = '';
  clearTimeout(deskRetry);
  deskRetry = null;
  if (!socket) return;
  const current = socket;
  socket = null;
  current.onclose = null;
  current.onerror = null;
  current.close();
}

let ringPrimed = false;
let ringSilenced = false;

export function primeRing() {
  if (ringPrimed) return;
  ringPrimed = true;
  window.addEventListener('pointerdown', () => {
    unlockSpeaker();
    if (deskToken) connectDesk(deskToken);
  }, { once: true });
  window.addEventListener('pointerdown', () => {
    if (remoteAudio?.srcObject) remoteAudio.play().catch(() => {});
  });
}

export function hushRing(quiet) {
  if (quiet) {
    ringSilenced = true;
    stopRing();
    if (ringAudio?.state === 'running') ringAudio.suspend().catch(() => {});
    return;
  }
  ringSilenced = false;
  if (ringAudio?.state === 'suspended') ringAudio.resume().catch(() => {});
  if (call?.phase === 'ringing') startRing(call.direction);
}

let socketOpenedAt = socket ? Date.now() : 0;
let lastRx = Date.now();

function socketFresh() {
  if (!socket) return false;
  if (socket.readyState === 1) return true;
  return socket.readyState === 0 && Date.now() - socketOpenedAt < 8000;
}

function bindSocket(next) {
  next.onmessage = (message) => {
    lastRx = Date.now();
    try {
      const event = JSON.parse(message.data);
      if (event?.type === 'pong') return;
      if (event?.type === 'call') onCall(event);
      listeners.forEach((listener) => listener(event));
    } catch {
      /* ignore a malformed live event */
    }
  };
  next.onclose = () => {
    if (socket === next) socket = null;
    keep();
    if (deskToken) deskRetry = setTimeout(() => connectDesk(deskToken), 1500);
  };
  next.onerror = () => next.close();
}

export function connectDesk(token) {
  if (token) deskToken = token;
  if (!deskToken) return;
  if (socketFresh()) {
    bindSocket(socket);
    keep();
    return;
  }
  clearTimeout(deskRetry);
  if (socket) {
    const stale = socket;
    socket = null;
    stale.onclose = null;
    stale.onerror = null;
    stale.close();
  }
  const next = new WebSocket(`${wsOrigin}/api/hbms/live?token=${encodeURIComponent(deskToken)}`);
  socket = next;
  socketOpenedAt = Date.now();
  lastRx = Date.now();
  bindSocket(next);
  keep();
}

function waitForSocket() {
  if (socket?.readyState === 1) return Promise.resolve(true);
  connectDesk(deskToken);
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (socket?.readyState === 1) {
        clearInterval(timer);
        resolve(true);
      } else if (!deskToken || Date.now() - started > 8000) {
        clearInterval(timer);
        resolve(false);
      }
    }, 200);
  });
}

desk.tick = () => {
  if (!deskToken) return;
  const live = call?.phase === 'active' || call?.phase === 'connecting';
  if (!socket || socket.readyState !== 1) {
    connectDesk(deskToken);
    return;
  }
  if (!live && Date.now() - lastRx > 25000) {
    const stale = socket;
    socket = null;
    if (stale) {
      stale.onclose = null;
      stale.onerror = null;
      stale.close();
    }
    connectDesk(deskToken);
    return;
  }
  send({ type: 'ping' });
};
if (typeof document !== 'undefined' && !desk.watching) {
  desk.watching = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') desk.tick?.();
  });
  setInterval(() => desk.tick?.(), 10000);
}
if (typeof document !== 'undefined' && socket) bindSocket(socket);

function unlockRing() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  if (!ringAudio) ringAudio = new Context();
  if (ringAudio.state === 'suspended') ringAudio.resume().catch(() => {});
  return ringAudio;
}

function ensureSpeaker() {
  if (typeof document === 'undefined') return null;
  if (!remoteAudio) {
    remoteAudio = document.createElement('audio');
    remoteAudio.autoplay = true;
    remoteAudio.playsInline = true;
    remoteAudio.setAttribute('playsinline', 'true');
    remoteAudio.volume = 1;
    document.body.appendChild(remoteAudio);
  }
  return remoteAudio;
}

function unlockSpeaker() {
  const ctx = unlockRing();
  const audio = ensureSpeaker();
  if (!audio) return;
  if (audio.srcObject) {
    audio.play().catch(() => {});
    return;
  }
  if (!ctx) return;
  const dest = ctx.createMediaStreamDestination();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(dest);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
  audio.srcObject = dest.stream;
  audio.play().catch(() => {});
}

function tone(ctx, when, frequency, length) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(frequency, when);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(0.07, when + 0.02);
  gain.gain.linearRampToValueAtTime(0, when + length);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + length + 0.02);
  ringNodes.push(osc);
}

function stopRing() {
  clearInterval(ringLoop);
  ringLoop = null;
  ringNodes.forEach((node) => {
    try { node.stop(); } catch { /* already finished */ }
  });
  ringNodes = [];
}

function startRing(direction) {
  if (ringSilenced) return;
  stopRing();
  const burst = () => {
    const ctx = unlockRing();
    if (ringSilenced || !ctx || call?.phase !== 'ringing') return;
    const now = ctx.currentTime;
    if (direction === 'out') {
      tone(ctx, now, 440, 0.4);
      tone(ctx, now, 480, 0.4);
      tone(ctx, now + 0.55, 440, 0.4);
      tone(ctx, now + 0.55, 480, 0.4);
      return;
    }
    tone(ctx, now, 880, 0.16);
    tone(ctx, now + 0.24, 660, 0.16);
    tone(ctx, now + 0.48, 880, 0.22);
  };
  burst();
  ringLoop = setInterval(burst, direction === 'out' ? 3000 : 2200);
}

function stopMedia() {
  clearTimeout(ringTimer);
  ringTimer = null;
  stopRing();
  if (screenTrack) {
    screenTrack.onended = null;
    screenTrack.stop();
    screenTrack = null;
  }
  if (heldCamera) {
    heldCamera.stop();
    heldCamera = null;
  }
  releaseEffect(true);
  effectName = 'none';
  localStream?.getTracks().forEach((track) => track.stop());
  localStream = null;
  remoteStream = null;
  remoteLive = false;
  emitMedia();
  if (pc) {
    pc.close();
    pc = null;
  }
  pendingOffer = null;
  pendingIce = [];
  localIce = [];
  signalOpen = false;
  makingOffer = false;
  if (remoteAudio) remoteAudio.srcObject = null;
}

function show(next) {
  if (!next || next.id !== call?.id) ringSilenced = false;
  const wasRinging = call?.phase === 'ringing';
  call = next;
  if (next?.phase === 'ringing' && !wasRinging && !ringSilenced) startRing(next.direction);
  if (next?.phase !== 'ringing') stopRing();
  emitCall();
}

function dropIncoming() {
  stopMedia();
  ringSilenced = false;
  call = null;
  emitCall();
}

function dismiss(reason) {
  const current = call;
  stopMedia();
  if (!current) return;
  show({ ...current, phase: 'ended', reason });
  setTimeout(() => {
    if (call?.phase === 'ended' && call.id === current.id) {
      call = null;
      emitCall();
    }
  }, 1600);
}

function playRemote(stream) {
  const audio = ensureSpeaker();
  if (!audio) return;
  if (audio.srcObject !== stream) audio.srcObject = stream;
  audio.muted = false;
  audio.volume = 1;
  audio.play().catch(() => {});
  watchRemote(stream);
}

function makePeer(callId) {
  const peer = new RTCPeerConnection(ICE);
  peer.onicecandidate = (event) => {
    if (!event.candidate || call?.id !== callId) return;
    const payload = { type: 'call', action: 'ice', callId, candidate: event.candidate.toJSON() };
    if (!signalOpen) localIce.push(payload);
    else send(payload);
  };
  peer.ontrack = (event) => {
    takeRemote(event.streams?.[0], event.track);
    if (call?.id === callId) show({ ...call, phase: 'active', startedAt: call.startedAt || Date.now() });
  };
  peer.onconnectionstatechange = () => {
    if (call?.id !== callId) return;
    if (peer.connectionState === 'connected') show({ ...call, phase: 'active', startedAt: call.startedAt || Date.now() });
    if (peer.connectionState === 'failed') dismiss('Could not connect the call');
  };
  return peer;
}

function finishEnded() {
  if (call?.phase !== 'ended') return;
  stopMedia();
  call = null;
  emitCall();
}

export async function startCall(peer, options = {}) {
  if (!peer?.conversationId) return;
  finishEnded();
  if (call) return;
  const id = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const wantVideo = Boolean(options.video);
  unlockSpeaker();
  show({
    id,
    phase: 'ringing',
    direction: 'out',
    conversationId: String(peer.conversationId),
    name: peer.name || 'Call',
    employeeId: peer.employeeId || null,
    photoKey: peer.photoKey || null,
    muted: false,
    video: wantVideo,
    cameraOff: false,
  });
  let stream;
  try {
    stream = await capture(wantVideo);
  } catch {
    if (call?.id === id) dismiss(wantVideo ? 'Allow the camera and microphone to place a call' : 'Allow the microphone to place a call');
    return;
  }
  if (call?.id !== id) {
    stream.getTracks().forEach((track) => track.stop());
    return;
  }
  const video = stream.getVideoTracks().length > 0;
  localStream = stream;
  emitMedia();
  show({ ...call, video, cameraOff: wantVideo && !video });
  try {
    pc = makePeer(id);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
  } catch {
    dismiss('Could not start the call');
    return;
  }
  const open = await waitForSocket();
  if (call?.id !== id) return;
  const sent = open && send({
    type: 'call',
    action: 'invite',
    callId: id,
    conversationId: String(peer.conversationId),
    video,
    sdp: pc.localDescription,
  });
  if (!sent) {
    dismiss('Connecting');
    return;
  }
  signalOpen = true;
  localIce.splice(0).forEach((payload) => send(payload));
  ringTimer = setTimeout(() => {
    if (call?.id === id && call.phase === 'ringing') {
      send({ type: 'call', action: 'hangup', callId: id });
      dismiss('No answer');
    }
  }, 45000);
}

async function answerCall(stream, id) {
  const open = await waitForSocket();
  if (!open || call?.id !== id) return false;
  signalOpen = true;
  pc = makePeer(id);
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  const offer = pendingOffer;
  if (!offer) return false;
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  const sent = send({ type: 'call', action: 'answer', callId: id, sdp: pc.localDescription });
  if (!sent) return false;
  pendingOffer = null;
  for (const candidate of pendingIce) {
    await pc.addIceCandidate(candidate).catch(() => {});
  }
  pendingIce = [];
  keep();
  return true;
}

function closePeer() {
  try { pc?.close(); } catch { /* the peer was already closed */ }
  pc = null;
  signalOpen = false;
}

export async function acceptCall() {
  if ((!call || call.direction !== 'in') && desk.call?.direction === 'in' && desk.call?.phase === 'ringing') {
    call = desk.call;
    pendingOffer = desk.pendingOffer || pendingOffer;
    pendingIce = desk.pendingIce || pendingIce;
  }
  if (!call || call.direction !== 'in' || call.phase !== 'ringing') return;
  const current = call;
  unlockSpeaker();
  let stream;
  try {
    stream = await capture(Boolean(current.video));
  } catch {
    if (call?.id === current.id) show({ ...call, phase: 'ringing', notice: 'Allow the microphone, then tap Accept' });
    return;
  }
  if (!call || call.id !== current.id || call.phase !== 'ringing') {
    stream.getTracks().forEach((track) => track.stop());
    return;
  }
  const id = current.id;
  const video = stream.getVideoTracks().length > 0;
  localStream = stream;
  emitMedia();
  clearTimeout(ringTimer);
  show({ ...call, phase: 'connecting', video: Boolean(call.video) || video, cameraOff: !video, notice: '' });
  let answered = false;
  try {
    answered = await answerCall(stream, id);
    if (!answered && call?.id === id) {
      closePeer();
      const stale = socket;
      socket = null;
      if (stale) {
        stale.onclose = null;
        stale.onerror = null;
        stale.close();
      }
      answered = await answerCall(stream, id);
    }
  } catch {
    answered = false;
  }
  if (answered || call?.id !== id) return;
  closePeer();
  stream.getTracks().forEach((track) => track.stop());
  if (localStream === stream) localStream = null;
  emitMedia();
  show({ ...current, phase: 'ringing', notice: 'Tap Accept again' });
}

export function rejectCall() {
  if (!call) return;
  send({ type: 'call', action: 'reject', callId: call.id });
  stopMedia();
  call = null;
  emitCall();
}

export function hangup() {
  if (!call) return;
  if (call.id !== 'local') send({ type: 'call', action: 'hangup', callId: call.id });
  const reason = call.phase === 'active' || call.phase === 'connecting' ? 'Call ended' : '';
  if (reason) dismiss(reason);
  else {
    stopMedia();
    call = null;
    emitCall();
  }
}

export async function switchToVideo() {
  if (!call || !pc || call.phase !== 'active' || makingOffer || pc.signalingState !== 'stable') return;
  const live = localStream?.getVideoTracks?.().find((track) => track.readyState === 'live');
  if (live) {
    live.enabled = true;
    show({ ...call, video: true, cameraOff: false });
    return;
  }
  let videoStream;
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    });
  } catch {
    return;
  }
  const track = videoStream.getVideoTracks()[0];
  if (!track || !call || !pc) {
    videoStream.getTracks().forEach((item) => item.stop());
    return;
  }
  if (!localStream) localStream = new MediaStream();
  localStream.addTrack(track);
  const sender = pc.addTrack(track, localStream);
  const previous = call;
  emitMedia();
  show({ ...previous, video: true, cameraOff: false });
  try {
    makingOffer = true;
    await pc.setLocalDescription(await pc.createOffer());
    const sent = send({ type: 'call', action: 'upgrade', callId: previous.id, video: true, sdp: pc.localDescription });
    if (!sent) throw new Error('offline');
  } catch {
    try { pc.removeTrack(sender); } catch { /* the sender was already gone */ }
    track.stop();
    localStream.removeTrack(track);
    emitMedia();
    if (call?.id === previous.id) show({ ...call, video: previous.video === true, cameraOff: previous.video !== true });
  } finally {
    makingOffer = false;
  }
}

function releaseEffect(stopCamera) {
  cancelAnimationFrame(effectFrame);
  effectFrame = 0;
  effectTrack?.stop();
  effectTrack = null;
  effectStream = null;
  if (effectVideo) {
    effectVideo.srcObject = null;
    effectVideo = null;
  }
  effectCanvas = null;
  if (stopCamera && sourceCamera) {
    sourceCamera.stop();
    sourceCamera = null;
  }
}

function paintEffect(now) {
  effectFrame = requestAnimationFrame(paintEffect);
  if (!effectVideo || !effectCanvas || effectVideo.readyState < 2) return;
  if (now - (paintEffect.stamp || 0) < 42) return;
  paintEffect.stamp = now;
  const ctx = effectCanvas.getContext('2d', { alpha: false });
  const width = effectCanvas.width;
  const height = effectCanvas.height;
  ctx.globalAlpha = 1;
  if (effectName === 'clean') {
    ctx.filter = 'blur(1.4px) brightness(1.06) saturate(1.05)';
    ctx.drawImage(effectVideo, 0, 0, width, height);
    ctx.globalAlpha = 0.72;
    ctx.filter = 'contrast(1.1) saturate(1.14) brightness(1.05)';
    ctx.drawImage(effectVideo, 0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    return;
  }
  ctx.filter = EFFECT_FILTER[effectName] || 'none';
  ctx.drawImage(effectVideo, 0, 0, width, height);
  ctx.filter = 'none';
}

function ensureEffect(camera) {
  const current = effectVideo?.srcObject?.getVideoTracks?.()[0];
  if (effectTrack?.readyState === 'live' && current === camera) return effectTrack;
  releaseEffect(false);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.srcObject = new MediaStream([camera]);
  video.play().catch(() => {});
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  effectVideo = video;
  effectCanvas = canvas;
  effectStream = canvas.captureStream(24);
  effectTrack = effectStream.getVideoTracks()[0];
  effectFrame = requestAnimationFrame(paintEffect);
  return effectTrack;
}

export async function setVideoEffect(id) {
  const name = VIDEO_EFFECTS.some((item) => item.id === id) ? id : 'none';
  if (!call || call.phase !== 'active' || screenTrack) return;
  if (name === 'none') {
    effectName = 'none';
    const camera = sourceCamera;
    releaseEffect(false);
    const sender = videoSender();
    if (camera && camera.readyState === 'live' && sender) {
      await sender.replaceTrack(camera);
      useLocalVideo(camera);
    }
    emitMedia();
    if (call) show({ ...call, effect: 'none' });
    return;
  }
  const sender = videoSender();
  const camera = sourceCamera?.readyState === 'live' ? sourceCamera : sender?.track;
  if (!camera || camera === screenTrack || camera === effectTrack) return;
  sourceCamera = camera;
  effectName = name;
  const track = ensureEffect(camera);
  if (sender && sender.track !== track) await sender.replaceTrack(track);
  if (localStream?.getVideoTracks?.()[0] !== track) useLocalVideo(track);
  emitMedia();
  show({ ...call, effect: name, video: true, cameraOff: !camera.enabled });
}

function videoSender() {
  const senders = pc?.getSenders?.() || [];
  return senders.find((sender) => sender.track && sender.track.kind === 'video') || null;
}

function useLocalVideo(track) {
  const next = new MediaStream();
  (localStream?.getAudioTracks?.() || []).forEach((item) => next.addTrack(item));
  next.addTrack(track);
  localStream = next;
}

async function stopShare() {
  const track = screenTrack;
  if (!track) return;
  screenTrack = null;
  track.onended = null;
  track.stop();
  localStream?.removeTrack(track);
  const sender = pc?.getSenders?.().find((item) => item.track === track) || videoSender();
  const camera = heldCamera;
  heldCamera = null;
  if (camera && camera.readyState === 'live' && sender) {
    camera.enabled = true;
    await sender.replaceTrack(camera);
    useLocalVideo(camera);
    if (call) show({ ...call, video: true, sharing: false, cameraOff: false });
  } else if (sender) {
    await sender.replaceTrack(null).catch(() => {});
    camera?.stop();
    if (call) show({ ...call, sharing: false, cameraOff: true });
  } else if (call) {
    camera?.stop();
    show({ ...call, sharing: false });
  }
  emitMedia();
}

async function captureScreen() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    const error = new Error('unsupported');
    error.name = 'NotSupportedError';
    throw error;
  }
  return navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
}

export async function toggleShare() {
  if (!call || !pc || call.phase !== 'active') return;
  if (screenTrack) {
    await stopShare();
    return;
  }
  let display;
  try {
    display = await captureScreen();
  } catch (error) {
    if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') return;
    if (call) show({ ...call, notice: 'Allow screen sharing in the browser to continue' });
    return;
  }
  const track = display.getVideoTracks()[0];
  if (!track || call?.phase !== 'active' || !pc) {
    display.getTracks().forEach((item) => item.stop());
    return;
  }
  track.onended = () => {
    if (screenTrack === track) stopShare();
  };
  const sender = videoSender();
  if (sender?.track && sender.track !== track) {
    heldCamera = sourceCamera?.readyState === 'live' ? sourceCamera : sender.track;
    releaseEffect(false);
    sourceCamera = null;
    heldCamera.enabled = false;
    localStream?.removeTrack(heldCamera);
    try {
      await sender.replaceTrack(track);
    } catch {
      heldCamera.enabled = true;
      heldCamera = null;
      track.onended = null;
      track.stop();
      return;
    }
    screenTrack = track;
    useLocalVideo(track);
    emitMedia();
    show({ ...call, video: true, sharing: true, cameraOff: false, notice: '' });
    return;
  }
  if (!localStream) localStream = new MediaStream();
  localStream.addTrack(track);
  const added = pc.addTrack(track, localStream);
  screenTrack = track;
  const previous = call;
  emitMedia();
  show({ ...previous, video: true, sharing: true, cameraOff: false, notice: '' });
  try {
    makingOffer = true;
    await pc.setLocalDescription(await pc.createOffer());
    const sent = send({ type: 'call', action: 'upgrade', callId: previous.id, video: true, sdp: pc.localDescription });
    if (!sent) throw new Error('offline');
  } catch {
    try { pc.removeTrack(added); } catch { /* the sender was already gone */ }
    track.onended = null;
    track.stop();
    screenTrack = null;
    localStream.removeTrack(track);
    emitMedia();
    if (call?.id === previous.id) show({ ...call, sharing: false, video: previous.video === true, cameraOff: previous.video !== true });
  } finally {
    makingOffer = false;
  }
}

export function toggleCamera() {
  if (screenTrack) return;
  const track = sourceCamera?.readyState === 'live'
    ? sourceCamera
    : localStream?.getVideoTracks?.().find((item) => item !== effectTrack && item.readyState === 'live');
  if (!call) return;
  if (!track) {
    switchToVideo();
    return;
  }
  track.enabled = !track.enabled;
  if (effectTrack) effectTrack.enabled = track.enabled;
  show({ ...call, video: true, cameraOff: !track.enabled });
}

export function toggleMute() {
  if (!call || !localStream) return;
  const muted = !call.muted;
  localStream.getAudioTracks().forEach((track) => { track.enabled = !muted; });
  show({ ...call, muted });
}

async function onCall(event) {
  if (event.action === 'clear') {
    if (!event.callId || event.callId !== call?.id) return;
    const ringing = call.direction === 'in' && call.phase === 'ringing';
    const lost = event.dropped && call.direction === 'in' && call.phase !== 'active';
    if (ringing || lost) dropIncoming();
    return;
  }
  if (event.action === 'invite') {
    if (call?.id === event.callId) {
      if (event.sdp && call.phase === 'ringing') pendingOffer = event.sdp;
      keep();
      return;
    }
    finishEnded();
    if (call && call.phase !== 'ended') {
      send({ type: 'call', action: 'busy', callId: event.callId });
      return;
    }
    pendingOffer = event.sdp || null;
    pendingIce = [];
    show({
      id: event.callId,
      phase: 'ringing',
      direction: 'in',
      conversationId: event.conversationId,
      name: event.name || 'Incoming call',
      employeeId: event.employeeId || null,
      photoKey: event.photoKey || null,
      muted: false,
      video: event.video === true,
      cameraOff: false,
    });
    ringTimer = setTimeout(() => {
      if (call?.id === event.callId && call.phase === 'ringing') dropIncoming();
    }, 45000);
    return;
  }
  if (!call || event.callId !== call.id) return;
  if (event.action === 'upgrade' && event.sdp && pc) {
    if (event.sdp.type === 'offer') {
      const collision = makingOffer || pc.signalingState !== 'stable';
      if (collision && call.direction !== 'in') return;
      if (collision) await pc.setLocalDescription({ type: 'rollback' }).catch(() => {});
      await pc.setRemoteDescription(event.sdp);
      await pc.setLocalDescription(await pc.createAnswer());
      send({ type: 'call', action: 'upgrade', callId: call.id, sdp: pc.localDescription });
      const cameraOn = localStream?.getVideoTracks?.().some((track) => track.enabled && track.readyState === 'live');
      show({ ...call, video: true, cameraOff: !cameraOn });
      return;
    }
    if (event.sdp.type === 'answer' && pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription(event.sdp);
      show({ ...call, video: true });
    }
    return;
  }
  if (event.action === 'answer' && event.sdp && pc) {
    await pc.setRemoteDescription(event.sdp);
    for (const candidate of pendingIce) await pc.addIceCandidate(candidate).catch(() => {});
    pendingIce = [];
    show({ ...call, phase: 'connecting' });
    return;
  }
  if (event.action === 'ice') {
    if (pc?.remoteDescription) await pc.addIceCandidate(event.candidate).catch(() => {});
    else pendingIce.push(event.candidate);
    return;
  }
  if (event.action === 'reject') dismiss('Call declined');
  else if (event.action === 'busy') dismiss('On another call');
  else if (event.action === 'unavailable') dismiss('Not available right now');
  else if (event.action === 'hangup') {
    if (call.phase === 'ringing' && call.direction === 'in') {
      stopMedia();
      call = null;
      emitCall();
    } else dismiss(call.phase === 'ringing' ? 'No answer' : 'Call ended');
  }
}
