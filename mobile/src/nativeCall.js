import { setAudioModeAsync } from 'expo-audio';

let ready = false;

try {
  const webrtc = require('react-native-webrtc');
  webrtc.registerGlobals();
  ready = typeof global.RTCPeerConnection === 'function';
} catch {
  ready = false;
}

export function nativeCallsReady() {
  return ready;
}

export function prepareCallAudio() {
  setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldRouteThroughEarpiece: false,
    interruptionMode: 'doNotMix',
    shouldPlayInBackground: true,
  }).catch(() => {});
}

export function releaseCallAudio() {
  setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    shouldRouteThroughEarpiece: false,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  }).catch(() => {});
}
