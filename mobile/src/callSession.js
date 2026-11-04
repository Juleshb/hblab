import { AppState, Platform, Vibration } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { api } from './api';
import { sendLive, subscribeLive } from './live';
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
  document.addEventListener('pointerdown', () => unlockRing(), true);
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

function playRemote(stream) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (!remoteAudio) {
    remoteAudio = document.createElement('audio');
    remoteAudio.autoplay = true;
    remoteAudio.setAttribute('playsinline', 'true');
    remoteAudio.style.display = 'none';
    document.body.appendChild(remoteAudio);
  }
  if (remoteAudio.srcObject !== stream) remoteAudio.srcObject = stream;
  remoteAudio.play().catch(() => {});
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
  unlockRing();
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
  let stream;
  try {
    stream = await capture(Boolean(call.video));
  } catch {
    sendLive({ type: 'call', action: 'reject', callId: call.id });
    dismiss(call.video ? 'Allow the camera and microphone to answer' : 'Allow the microphone to answer');
    return;
  }
  const id = call.id;
  const video = stream.getVideoTracks().length > 0;
  localStream = stream;
  emitMedia();
  signalOpen = true;
  clearTimeout(ringTimer);
  show({ ...call, phase: 'connecting', video: Boolean(call.video) || video, cameraOff: !video });
  pc = makePeer(id);
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  if (pendingOffer) {
    await pc.setRemoteDescription(pendingOffer);
    pendingOffer = null;
  }
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  sendLive({ type: 'call', action: 'answer', callId: id, sdp: pc.localDescription });
  await flushIce();
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
    heldCamera = sender.track;
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
  const track = localStream?.getVideoTracks?.().find((item) => item.readyState === 'live');
  if (!call) return;
  if (!track) {
    switchToVideo();
    return;
  }
  track.enabled = !track.enabled;
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
    if (call?.id === event.callId) return;
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
