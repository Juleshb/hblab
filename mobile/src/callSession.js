import { AppState, Platform, Vibration } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { api } from './api';
import { liveOpen, reconnectLive, sendLive, subscribeLive } from './live';
import { stopVoice } from './components/voice';

const incomingRing = require('../assets/incoming-ring.wav');

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const listeners = new Set();

let call = null;
let pc = null;
let localStream = null;
let remoteAudio = null;
let remoteStream = null;
let remoteLive = false;
const mediaListeners = new Set();
let pendingOffer = null;
let pendingIce = [];
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
let ringPlayer = null;
let ringingId = '';
let armedAccept = '';

function unlockRing() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  if (!ringAudio) ringAudio = new Context();
  if (ringAudio.state === 'suspended') ringAudio.resume().catch(() => {});
  return ringAudio;
}

function tone(ctx, when, frequency, length) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, when);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(0.07, when + 0.02);
  gain.gain.setValueAtTime(0.07, when + Math.max(0.03, length - 0.04));
  gain.gain.linearRampToValueAtTime(0, when + length);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + length + 0.02);
  ringNodes.push(osc);
}

function ringBurst() {
  const ctx = unlockRing();
  if (!ctx || call?.phase !== 'ringing') return;
  const now = ctx.currentTime;
  if (call.direction === 'out') {
    tone(ctx, now, 440, 0.4);
    tone(ctx, now, 480, 0.4);
    tone(ctx, now + 0.55, 440, 0.4);
    tone(ctx, now + 0.55, 480, 0.4);
    return;
  }
  tone(ctx, now, 880, 0.16);
  tone(ctx, now + 0.24, 660, 0.16);
  tone(ctx, now + 0.48, 880, 0.22);
}

function clearLockNote(id) {
  if (Platform.OS === 'web' || !id) return;
  Notifications.dismissNotificationAsync(`incoming-${id}`).catch(() => {});
}

export function clearCallNotifications() {
  if (Platform.OS === 'web') return;
  Notifications.getPresentedNotificationsAsync().then((shown) => {
    shown.forEach((item) => {
      if (item.request.content.data?.type === 'call') {
        Notifications.dismissNotificationAsync(item.request.identifier).catch(() => {});
      }
    });
  }).catch(() => {});
}

function postLockNote(current) {
  if (Platform.OS === 'web' || !current || current.direction !== 'in') return;
  Notifications.scheduleNotificationAsync({
    identifier: `incoming-${current.id}`,
    content: {
      title: current.name || 'Incoming call',
      body: 'Tap to answer',
      sound: Platform.OS === 'ios' ? 'defaultRingtone' : 'default',
      interruptionLevel: 'time-sensitive',
      priority: Notifications.AndroidNotificationPriority.MAX,
      categoryIdentifier: 'incoming-call',
      sticky: true,
      autoDismiss: false,
      vibrate: [0, 450, 250, 450, 250, 800],
      data: {
        type: 'call',
        callId: current.id,
        conversationId: current.conversationId || '',
      },
    },
    trigger: null,
  }).catch(() => {});
}

export function noteIncomingAction(callId, action) {
  if (!callId) return;
  if (action === 'decline') {
    api.post(`/hbms/calls/${callId}/reject`).catch(() => {});
    clearLockNote(callId);
    if (call?.id === callId) rejectCall();
    return;
  }
  armedAccept = callId;
  if (call?.id === callId && call.direction === 'in' && call.phase === 'ringing' && supportsCalls()) acceptCall();
}

function stopRing() {
  clearLockNote(ringingId || (call?.direction === 'in' ? call.id : ''));
  clearInterval(ringLoop);
  ringLoop = null;
  ringingId = '';
  ringNodes.forEach((node) => {
    try { node.stop(); } catch { /* already finished */ }
    try { node.disconnect(); } catch { /* already released */ }
  });
  ringNodes = [];
  if (ringPlayer) {
    try {
      ringPlayer.pause();
      ringPlayer.remove();
    } catch { /* the player was already released */ }
    ringPlayer = null;
  }
  if (Platform.OS !== 'web') Vibration.cancel();
}

function startPhoneRing(id) {
  if (Platform.OS === 'android') Vibration.vibrate([0, 450, 250, 450, 1600], true);
  else {
    Vibration.vibrate();
    ringLoop = setInterval(() => Vibration.vibrate(), 1800);
  }
  setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: false,
    shouldRouteThroughEarpiece: false,
    interruptionMode: 'doNotMix',
  })
    .catch(() => {})
    .then(() => {
      if (ringingId !== id || call?.phase !== 'ringing' || ringPlayer) return;
      ringPlayer = createAudioPlayer(incomingRing);
      ringPlayer.loop = true;
      ringPlayer.play();
    });
}

function syncRing() {
  if (call?.phase === 'ringing') {
    if (ringingId === call.id) return;
    const id = call.id;
    const incoming = call.direction === 'in';
    stopRing();
    ringingId = id;
    if (Platform.OS !== 'web' && incoming) {
      startPhoneRing(id);
      return;
    }
    ringBurst();
    ringLoop = setInterval(ringBurst, incoming ? 2200 : 3000);
    return;
  }
  if (ringingId || ringLoop || ringPlayer) stopRing();
}

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.addEventListener('pointerdown', () => unlockSpeaker(), true);
  document.addEventListener('pointerdown', () => {
    if (remoteAudio?.srcObject) remoteAudio.play().catch(() => {});
  }, true);
}

function emit() {
  listeners.forEach((listener) => listener(call));
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
  listeners.add(listener);
  listener(call);
  return () => listeners.delete(listener);
}

export function currentCall() {
  return call;
}

function supportsCalls() {
  return Platform.OS === 'web'
    && typeof RTCPeerConnection !== 'undefined'
    && typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia);
}

function ensureSpeaker() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
  if (!remoteAudio) {
    remoteAudio = document.createElement('audio');
    remoteAudio.autoplay = true;
    remoteAudio.playsInline = true;
    remoteAudio.setAttribute('playsinline', 'true');
    remoteAudio.volume = 1;
    remoteAudio.style.position = 'fixed';
    remoteAudio.style.width = '1px';
    remoteAudio.style.height = '1px';
    remoteAudio.style.opacity = '0';
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

function playRemote(stream) {
  const audio = ensureSpeaker();
  if (!audio) return;
  if (audio.srcObject !== stream) audio.srcObject = stream;
  audio.muted = false;
  audio.volume = 1;
  audio.play().catch(() => {});
  watchRemote(stream);
}

function stopMedia() {
  clearTimeout(ringTimer);
  ringTimer = null;
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
    pc.onicecandidate = null;
    pc.ontrack = null;
    pc.onconnectionstatechange = null;
    pc.close();
  }
  pc = null;
  pendingOffer = null;
  pendingIce = [];
  localIce = [];
  signalOpen = false;
  makingOffer = false;
  if (remoteAudio) remoteAudio.srcObject = null;
  stopRing();
}

function show(next) {
  call = next;
  syncRing();
  emit();
}

function dismiss(reason) {
  const current = call;
  stopMedia();
  if (!current) return;
  show({ ...current, phase: 'ended', reason });
  setTimeout(() => {
    if (call?.phase === 'ended' && call.id === current.id) {
      call = null;
      emit();
    }
  }, 1600);
}

function makePeer(callId) {
  const peer = new RTCPeerConnection(ICE);
  peer.onicecandidate = (event) => {
    if (!event.candidate || call?.id !== callId) return;
    const candidate = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
    const payload = { type: 'call', action: 'ice', callId, candidate };
    if (!signalOpen) localIce.push(payload);
    else sendLive(payload);
  };
  peer.ontrack = (event) => {
    takeRemote(event.streams?.[0], event.track);
    if (call?.id === callId && call.phase !== 'ended') show({ ...call, phase: 'active', startedAt: call.startedAt || Date.now() });
  };
  peer.onconnectionstatechange = () => {
    if (call?.id !== callId) return;
    if (peer.connectionState === 'connected' && call.phase !== 'active') {
      show({ ...call, phase: 'active', startedAt: call.startedAt || Date.now() });
    }
    if (peer.connectionState === 'failed') dismiss('Could not connect the call');
  };
  return peer;
}

async function addIce(candidate) {
  if (!candidate) return;
  if (pc?.remoteDescription) {
    await pc.addIceCandidate(candidate).catch(() => {});
    return;
  }
  pendingIce.push(candidate);
}

async function flushIce() {
  const queued = pendingIce;
  pendingIce = [];
  for (const candidate of queued) {
    await pc?.addIceCandidate(candidate).catch(() => {});
  }
}

export async function startCall(peer, options = {}) {
  if (call || !peer?.conversationId) return;
  unlockSpeaker();
  stopVoice();
  if (!supportsCalls()) {
    show({
      id: 'local',
      phase: 'ended',
      direction: 'out',
      name: peer.name,
      employeeId: peer.employeeId,
      photoKey: peer.photoKey,
      video: Boolean(options.video),
      reason: 'Video and audio calls work in the browser. This phone cannot place a call yet.',
    });
    setTimeout(() => {
      if (call?.id === 'local') {
        call = null;
        emit();
      }
    }, 2200);
    return;
  }
  let stream;
  try {
    stream = await capture(Boolean(options.video));
  } catch {
    show({
      id: 'local',
      phase: 'ended',
      direction: 'out',
      name: peer.name,
      employeeId: peer.employeeId,
      photoKey: peer.photoKey,
      reason: options.video ? 'Allow the camera and microphone to place a video call' : 'Allow the microphone to place a call',
    });
    setTimeout(() => {
      if (call?.id === 'local') {
        call = null;
        emit();
      }
    }, 1800);
    return;
  }
  const id = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const video = stream.getVideoTracks().length > 0;
  localStream = stream;
  emitMedia();
  show({
    id,
    phase: 'ringing',
    direction: 'out',
    conversationId: String(peer.conversationId),
    name: peer.name || 'Call',
    employeeId: peer.employeeId || null,
    photoKey: peer.photoKey || null,
    muted: false,
    video,
    cameraOff: false,
  });
  try {
    pc = makePeer(id);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
  } catch {
    dismiss('Could not start the call');
    return;
  }
  const sent = sendLive({
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
  localIce.splice(0).forEach((payload) => sendLive(payload));
  ringTimer = setTimeout(() => {
    if (call?.id === id && call.phase === 'ringing') {
      sendLive({ type: 'call', action: 'hangup', callId: id });
      dismiss('No answer');
    }
  }, 45000);
}

export async function acceptCall() {
  if (!call || call.direction !== 'in' || call.phase !== 'ringing') return;
  if (!supportsCalls()) {
    sendLive({ type: 'call', action: 'reject', callId: call.id });
    dismiss(call.video ? 'Video calls work in the browser. This phone cannot answer yet.' : 'Audio calls work in the browser. This phone cannot place a call yet.');
    return;
  }
  unlockSpeaker();
  const current = call;
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
  if (!liveOpen()) reconnectLive();
  const opened = await new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (liveOpen()) {
        clearInterval(timer);
        resolve(true);
      } else if (Date.now() - started > 8000) {
        clearInterval(timer);
        resolve(false);
      }
    }, 200);
  });
  if (!opened || !pendingOffer || call?.id !== id) {
    stream.getTracks().forEach((track) => track.stop());
    if (localStream === stream) localStream = null;
    emitMedia();
    if (call?.id === id) show({ ...current, phase: 'ringing', notice: 'Tap Accept again' });
    return;
  }
  try {
    signalOpen = true;
    pc = makePeer(id);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    await pc.setRemoteDescription(pendingOffer);
    pendingOffer = null;
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    const sent = sendLive({ type: 'call', action: 'answer', callId: id, sdp: pc.localDescription });
    if (!sent) throw new Error('offline');
    await flushIce();
  } catch {
    try { pc?.close(); } catch { /* the peer was already closed */ }
    pc = null;
    signalOpen = false;
    stream.getTracks().forEach((track) => track.stop());
    if (localStream === stream) localStream = null;
    emitMedia();
    if (call?.id === id) show({ ...current, phase: 'ringing', notice: 'Tap Accept again' });
  }
}

export function rejectCall() {
  if (!call) return;
  sendLive({ type: 'call', action: 'reject', callId: call.id });
  stopMedia();
  call = null;
  emit();
}

export function hangup() {
  if (!call) return;
  if (call.id !== 'local') sendLive({ type: 'call', action: 'hangup', callId: call.id });
  const reason = call.phase === 'active' || call.phase === 'connecting' ? 'Call ended' : '';
  if (reason) dismiss(reason);
  else {
    stopMedia();
    call = null;
    emit();
  }
}

export async function switchToVideo() {
  if (!call || !pc || call.phase !== 'active' || makingOffer || pc.signalingState !== 'stable') return;
  if (!supportsCalls()) return;
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
    const sent = sendLive({ type: 'call', action: 'upgrade', callId: previous.id, video: true, sdp: pc.localDescription });
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
  if (!call || call.phase !== 'active' || screenTrack || !supportsCalls()) return;
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
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
    const error = new Error('unsupported');
    error.name = 'NotSupportedError';
    throw error;
  }
  return navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
}

export async function toggleShare() {
  if (!call || call.phase !== 'active') return;
  if (!pc || !supportsCalls()) {
    show({ ...call, notice: 'Allow screen sharing in the browser to continue' });
    return;
  }
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
    const sent = sendLive({ type: 'call', action: 'upgrade', callId: previous.id, video: true, sdp: pc.localDescription });
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
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !muted;
  });
  show({ ...call, muted });
}

async function onCall(event) {
  if (event?.type !== 'call') return;
  if (event.action === 'clear') {
    clearCallNotifications();
    const mine = !event.callId || event.callId === call?.id;
    const ringing = mine && call?.direction === 'in' && call.phase === 'ringing';
    const lost = event.dropped && mine && call?.direction === 'in' && call.phase !== 'active';
    if (ringing || lost) {
      stopMedia();
      call = null;
      emit();
    }
    return;
  }
  if (event.action === 'invite') {
    if (call?.id === event.callId) {
      if (event.sdp && call.phase === 'ringing') pendingOffer = event.sdp;
      return;
    }
    if (call) {
      sendLive({ type: 'call', action: 'busy', callId: event.callId });
      return;
    }
    stopVoice();
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
    postLockNote(call);
    if (armedAccept === event.callId) {
      armedAccept = '';
      if (supportsCalls()) acceptCall();
    }
    ringTimer = setTimeout(() => {
      if (call?.id === event.callId && call.phase === 'ringing') {
        stopMedia();
        call = null;
        emit();
      }
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
      sendLive({ type: 'call', action: 'upgrade', callId: call.id, sdp: pc.localDescription });
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
    await flushIce();
    show({ ...call, phase: 'connecting' });
    return;
  }
  if (event.action === 'ice') {
    await addIce(event.candidate);
    return;
  }
  if (event.action === 'reject') dismiss('Call declined');
  else if (event.action === 'busy') dismiss('On another call');
  else if (event.action === 'unavailable') dismiss('Not available right now');
  else if (event.action === 'hangup') {
    if (call.phase === 'ringing' && call.direction === 'in') {
      stopMedia();
      call = null;
      emit();
    } else dismiss(call.phase === 'ringing' ? 'No answer' : 'Call ended');
  }
}

subscribeLive(onCall);

AppState.addEventListener('change', (next) => {
  if (next === 'active') return;
  if (call?.phase === 'ringing' && call.direction === 'in') postLockNote(call);
});
