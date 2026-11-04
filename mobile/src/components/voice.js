import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  createAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { apiOrigin } from '../api';
import { colors } from '../theme';

const MAX_VOICE_MS = 300000;
const RECORDING = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

let player = null;
let currentId = null;
let snapshot = { id: null, playing: false, currentTime: 0, duration: 0 };
const listeners = new Set();

function publish(next) {
  snapshot = next;
  listeners.forEach((listener) => listener(snapshot));
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function stopVoice() {
  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      /* the player was already released */
    }
  }
  player = null;
  currentId = null;
  publish({ id: null, playing: false, currentTime: 0, duration: 0 });
}

function beginVoicePlayback(id, url) {
  stopVoice();
  player = createAudioPlayer(url, { updateInterval: 200 });
  currentId = id;
  player.addListener('playbackStatusUpdate', (status) => {
    if (currentId !== id) return;
    if (status.didJustFinish) {
      player?.pause();
      player?.seekTo(0).catch(() => {});
      publish({ id, playing: false, currentTime: 0, duration: status.duration || 0 });
      return;
    }
    publish({
      id,
      playing: Boolean(status.playing),
      currentTime: status.currentTime || 0,
      duration: status.duration || 0,
    });
  });
  player.play();
  publish({ id, playing: true, currentTime: 0, duration: 0 });
}

export function toggleVoice(id, url) {
  if (!url) return;
  if (currentId === id && player) {
    if (player.playing) player.pause();
    else player.play();
    publish({
      id,
      playing: Boolean(player.playing),
      currentTime: player.currentTime || 0,
      duration: player.duration || snapshot.duration || 0,
    });
    return;
  }
  // On the web, playback has to start in the same tap. Waiting for the audio
  // session first makes the browser reject it.
  if (Platform.OS === 'web') {
    beginVoicePlayback(id, url);
    return;
  }
  setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
    .then(() => beginVoicePlayback(id, url))
    .catch(() => beginVoicePlayback(id, url));
}

export function voiceClock(ms) {
  const total = Math.max(0, Math.round((Number(ms) || 0) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function voiceLabel(message) {
  if (message?.audio && !String(message.body || '').trim()) return 'Voice message';
  return message?.body || '';
}

export function voiceSrc(audio) {
  const url = audio?.url || '';
  if (!url) return '';
  if (/^(https?:|blob:|file:|data:)/i.test(url)) return url;
  return `${apiOrigin()}${url}`;
}

export async function voiceForm(audio, extra = {}) {
  const form = new FormData();
  form.append('duration', String(Math.round(audio.duration || 0)));
  if (extra.replyToId) form.append('replyToId', String(extra.replyToId));
  if (extra.asDepartment) form.append('asDepartment', 'true');
  if (extra.forwarded) form.append('forwarded', 'true');
  if (Platform.OS === 'web') {
    const blob = audio.blob || await (await fetch(audio.uri)).blob();
    const type = String(blob.type || audio.type || 'audio/webm');
    const name = type.includes('mp4') || type.includes('m4a') ? 'voice.m4a' : (type.includes('ogg') ? 'voice.ogg' : 'voice.webm');
    form.append('audio', blob, audio.name || name);
  } else {
    form.append('audio', {
      uri: audio.uri,
      name: audio.name || 'voice.m4a',
      type: audio.type || 'audio/mp4',
    });
  }
  return form;
}

function barsFor(id) {
  let seed = 7;
  const text = String(id || 'voice');
  for (let index = 0; index < text.length; index += 1) seed = (seed * 33 + text.charCodeAt(index)) % 997;
  return Array.from({ length: 26 }, (_, index) => {
    seed = (seed * 17 + index * 13) % 100;
    return 5 + (seed % 16);
  });
}

export function VoiceNote({ id, audio, onPressIn }) {
  const [state, setState] = useState(snapshot);
  useEffect(() => subscribe(setState), []);
  const active = state.id === id;
  const durationMs = active && state.duration ? state.duration * 1000 : (audio?.duration || 0);
  const positionMs = active ? state.currentTime * 1000 : 0;
  const progress = durationMs ? Math.min(1, positionMs / durationMs) : 0;
  const bars = barsFor(id);
  const src = voiceSrc(audio);

  return (
    <View style={styles.note}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={active && state.playing ? 'Pause voice message' : 'Play voice message'}
        onPressIn={onPressIn}
        onPress={() => toggleVoice(id, src)}
        style={styles.play}
      >
        <Ionicons name={active && state.playing ? 'pause' : 'play'} size={18} color={colors.onAccent} style={active && state.playing ? null : styles.playNudge} />
      </Pressable>
      <View style={styles.bars}>
        {bars.map((height, index) => (
          <View
            key={`${id}-${index}`}
            style={[styles.bar, { height }, index / bars.length < progress ? styles.barOn : null]}
          />
        ))}
      </View>
      <Text style={styles.clock}>{voiceClock(active && state.playing ? positionMs : durationMs)}</Text>
    </View>
  );
}

export function MicButton({ onStart, onMove, onEnd }) {
  const handlers = useRef({ onStart, onMove, onEnd });
  handlers.current = { onStart, onMove, onEnd };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => handlers.current.onStart(),
    onPanResponderMove: (_, gesture) => handlers.current.onMove(gesture),
    onPanResponderRelease: () => handlers.current.onEnd(),
    onPanResponderTerminate: () => handlers.current.onEnd(),
  })).current;
  return (
    <View
      accessibilityRole="button"
      accessibilityLabel="Hold to record a voice message"
      style={styles.mic}
      {...pan.panHandlers}
    >
      <Ionicons name="mic" size={22} color={colors.onAccent} />
    </View>
  );
}

export function RecordingBar({ elapsed, dx, locked }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.35, duration: 550, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [pulse]);
  const armed = !locked && dx < -72;
  return (
    <View style={styles.record}>
      <Animated.View style={[styles.dot, { opacity: pulse }]} />
      <Text style={styles.timer}>{voiceClock(elapsed)}</Text>
      <Text style={[styles.hint, armed && styles.hintArmed]} numberOfLines={1}>
        {locked ? 'Recording' : (armed ? 'Release to cancel' : '‹  Slide to cancel')}
      </Text>
    </View>
  );
}

export const VoiceRecorder = forwardRef(function VoiceRecorder({ onTick, onAutoSend }, ref) {
  const recorder = useAudioRecorder(RECORDING);
  const status = useAudioRecorderState(recorder, 200);
  const session = useRef(0);
  const live = useRef(false);
  const stopping = useRef(false);
  const tick = useRef(onTick);
  const auto = useRef(onAutoSend);
  tick.current = onTick;
  auto.current = onAutoSend;

  async function finish(cancel) {
    session.current += 1;
    live.current = false;
    const duration = recorder.getStatus().durationMillis || 0;
    let uri = null;
    try {
      if (recorder.isRecording) await recorder.stop();
      uri = recorder.uri;
    } catch {
      uri = recorder.uri;
    }
    if (cancel || !uri || duration < 700) {
      return { error: cancel ? 'cancel' : 'short' };
    }
    const web = Platform.OS === 'web';
    return {
      uri,
      duration,
      name: web ? 'voice.webm' : 'voice.m4a',
      type: web ? 'audio/webm' : 'audio/mp4',
    };
  }

  useEffect(() => {
    if (!live.current) return;
    tick.current?.(status.durationMillis || 0);
    if (status.durationMillis >= MAX_VOICE_MS && !stopping.current) {
      stopping.current = true;
      finish(false).then((audio) => {
        stopping.current = false;
        if (audio?.uri) auto.current?.(audio);
      });
    }
  }, [status.durationMillis]);

  useImperativeHandle(ref, () => ({
    async start() {
      const token = ++session.current;
      live.current = false;
      stopVoice();
      try {
        const permission = await requestRecordingPermissionsAsync();
        if (session.current !== token) return { ok: false, error: 'cancel' };
        if (!permission.granted) return { ok: false, error: 'denied' };
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        if (session.current !== token) return { ok: false, error: 'cancel' };
        await recorder.prepareToRecordAsync();
        if (session.current !== token) {
          try {
            if (!recorder.isRecording) recorder.record();
            await recorder.stop();
          } catch {
            /* the microphone closes when the recording stops */
          }
          return { ok: false, error: 'cancel' };
        }
        recorder.record();
        live.current = true;
        return { ok: true };
      } catch {
        live.current = false;
        return { ok: false, error: 'denied' };
      }
    },
    stop: (cancel) => finish(cancel),
    cancel() {
      live.current = false;
      session.current += 1;
      if (recorder.isRecording) recorder.stop().catch(() => {});
    },
  }));

  return null;
});

const styles = StyleSheet.create({
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 210, paddingVertical: 2 },
  play: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playNudge: { marginLeft: 2 },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 22 },
  bar: { width: 3, borderRadius: 2, backgroundColor: colors.accentMuted },
  barOn: { backgroundColor: colors.accentDark },
  clock: { fontSize: 12, color: colors.muted, fontVariant: ['tabular-nums'], minWidth: 32, textAlign: 'right' },
  mic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  record: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  timer: { fontSize: 15, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'], minWidth: 36 },
  hint: { flex: 1, textAlign: 'right', color: colors.muted, fontSize: 14, fontWeight: '600' },
  hintArmed: { color: colors.danger },
});
