import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { acceptCall, currentCall, hangup, rejectCall, setVideoEffect, subscribeCall, subscribeMedia, switchToVideo, toggleCamera, toggleMute, toggleShare, VIDEO_EFFECTS } from '../callSession';
import { useAuth } from '../auth';
import { colors } from '../theme';
import { Avatar } from './ui';

function WebVideo({ stream, muted, mirror, style }) {
  const host = useRef(null);
  useEffect(() => {
    const parent = host.current;
    if (!parent || Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = Boolean(muted);
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    if (mirror) video.style.transform = 'scaleX(-1)';
    parent.appendChild(video);
    video.srcObject = stream || null;
    if (stream) video.play().catch(() => {});
    return () => {
      video.srcObject = null;
      video.remove();
    };
  }, [stream, muted, mirror]);
  if (Platform.OS !== 'web') return null;
  return <View ref={host} style={style} />;
}

function clock(startedAt) {
  const total = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function CallOverlay() {
  const insets = useSafeAreaInsets();
  const { employee } = useAuth();
  const [call, setCall] = useState(currentCall);
  const [media, setMedia] = useState({ local: null, remote: null, remoteLive: false });
  const [miniId, setMiniId] = useState('');
  const [, setTick] = useState(0);
  useEffect(() => subscribeCall(setCall), []);
  useEffect(() => subscribeMedia(setMedia), []);
  useEffect(() => {
    if (call?.phase !== 'active') return undefined;
    const timer = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [call?.phase, call?.startedAt]);
  if (!call) return null;
  const incoming = call.direction === 'in' && call.phase === 'ringing';
  const kind = call.video ? 'Video' : 'Audio';
  const status = call.phase === 'ended'
    ? call.reason
    : call.phase === 'active'
      ? clock(call.startedAt || Date.now())
      : call.phase === 'connecting'
        ? `Connecting ${kind.toLowerCase()}`
        : incoming
          ? `Incoming ${kind.toLowerCase()} call`
          : `${kind} call · ringing`;
  const minimized = miniId === call.id && !incoming;
  const remoteOn = Boolean(call.video && !incoming && media.remoteLive);
  const localOn = Boolean(call.video && !incoming && !call.cameraOff && media.local?.getVideoTracks?.().some((track) => track.enabled && track.readyState === 'live'));
  const selfName = [employee?.firstName, employee?.lastName].filter(Boolean).join(' ') || 'You';
  if (minimized) {
    return (
      <View pointerEvents="box-none" style={styles.dock}>
        <View style={[styles.mini, call.video && styles.miniVideo, { marginTop: insets.top + 8 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Return to call" onPress={() => setMiniId('')} style={styles.miniMain}>
            <Text style={styles.miniName} numberOfLines={1}>{call.name}</Text>
            <View style={styles.miniKind}>
              <Ionicons name={call.video ? 'videocam' : 'call'} size={12} color="#d5e4df" />
              <Text style={styles.miniStatus}>{status}</Text>
            </View>
          </Pressable>
          {call.phase === 'ended' ? null : (
            <>
              {call.phase === 'active' && !call.video ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Switch to video" onPress={switchToVideo} style={styles.miniQuiet}>
                  <Ionicons name="videocam" size={18} color={colors.text} />
                </Pressable>
              ) : null}
              {call.phase === 'active' ? (
                <Pressable accessibilityRole="button" accessibilityLabel={call.sharing ? 'Stop sharing' : 'Share screen'} onPress={toggleShare} style={styles.miniQuiet}>
                  <Ionicons name={call.sharing ? 'close-circle' : 'desktop-outline'} size={18} color={colors.text} />
                </Pressable>
              ) : null}
              <Pressable accessibilityRole="button" accessibilityLabel={call.muted ? 'Unmute' : 'Mute'} onPress={toggleMute} style={styles.miniQuiet}>
                <Ionicons name={call.muted ? 'mic-off' : 'mic'} size={18} color={colors.text} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="End" onPress={hangup} style={styles.miniEnd}>
                <Ionicons name="call" size={18} color={colors.onAccent} style={styles.turned} />
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  }
  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={incoming ? rejectCall : hangup}>
      <View style={[styles.screen, call.video && styles.videoScreen]}>
        {remoteOn ? <WebVideo stream={media.remote} style={styles.remoteVideo} /> : null}
        {incoming || call.phase === 'ended' ? null : (
          <Pressable accessibilityRole="button" accessibilityLabel="Minimize" onPress={() => setMiniId(call.id)} style={styles.minimize}>
            <Ionicons name="chevron-down" size={22} color={colors.onAccent} />
            <Text style={styles.minimizeLabel}>Minimize</Text>
          </Pressable>
        )}
        {remoteOn ? null : call.video ? (
          <View style={styles.videoTile}>
            <Avatar name={call.name} employeeId={call.employeeId} photoKey={call.photoKey} size={148} />
          </View>
        ) : (
          <Avatar name={call.name} employeeId={call.employeeId} photoKey={call.photoKey} size={160} />
        )}
        <View style={styles.kind}>
          <Ionicons name={call.video ? 'videocam' : 'call'} size={14} color="#d5e4df" />
          <Text style={styles.kindText}>{kind} call</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>{call.name}</Text>
        {call.sharing ? <Text style={styles.cameraOff}>Sharing your screen</Text> : null}
        {call.notice ? <Text style={styles.cameraOff}>{call.notice}</Text> : null}
        {call.video && !incoming && !remoteOn && !call.sharing ? <Text style={styles.cameraOff}>Camera is off</Text> : null}
        <Text style={styles.status}>{status}</Text>
        {call.video && !incoming && !call.sharing && call.phase === 'active' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effects}>
            {VIDEO_EFFECTS.map((item) => {
              const selected = (call.effect || 'none') === item.id;
              return (
                <Pressable key={item.id} accessibilityRole="button" onPress={() => setVideoEffect(item.id)} style={[styles.effect, selected && styles.effectOn]}>
                  <Text style={[styles.effectText, selected && styles.effectTextOn]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
        {incoming ? (
          <View style={styles.row}>
            <RoundButton label="Decline" icon="call" danger onPress={rejectCall} turned />
            <RoundButton label="Accept" icon={call.video ? 'videocam' : 'call'} onPress={acceptCall} />
          </View>
        ) : call.phase === 'ended' ? null : (
          <View style={styles.row}>
            {call.video && !call.sharing ? (
              <RoundButton
                label={call.cameraOff ? 'Camera' : 'Camera off'}
                icon={call.cameraOff ? 'videocam-off' : 'videocam'}
                quiet
                onPress={toggleCamera}
              />
            ) : !call.video && call.phase === 'active' ? (
              <RoundButton label="Video" icon="videocam" quiet onPress={switchToVideo} />
            ) : null}
            {call.phase === 'active' ? (
              <RoundButton
                label={call.sharing ? 'Stop share' : 'Share'}
                icon={call.sharing ? 'close-circle' : 'desktop-outline'}
                quiet
                onPress={toggleShare}
              />
            ) : null}
            <RoundButton
              label={call.muted ? 'Unmute' : 'Mute'}
              icon={call.muted ? 'mic-off' : 'mic'}
              quiet
              onPress={toggleMute}
            />
            <RoundButton label="End" icon="call" danger onPress={hangup} turned />
          </View>
        )}
        {localOn ? <WebVideo stream={media.local} muted mirror={!call.sharing} style={call.sharing ? styles.shareVideo : styles.localVideo} /> : null}
        {call.video && !incoming && !localOn ? (
          <View style={styles.localPhoto}>
            <Avatar name={selfName} employeeId={employee?.id} photoKey={employee?.photoKey} size={96} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function RoundButton({ label, icon, onPress, danger, quiet, turned }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.action}>
      <View style={[styles.circle, danger && styles.danger, quiet && styles.quiet]}>
        <Ionicons name={icon} size={28} color={quiet ? colors.text : colors.onAccent} style={turned ? styles.turned : null} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  videoScreen: { backgroundColor: '#111b21' },
  remoteVideo: { ...StyleSheet.absoluteFillObject },
  localVideo: {
    position: 'absolute',
    right: 22,
    bottom: 150,
    width: 104,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareVideo: {
    position: 'absolute',
    right: 22,
    bottom: 150,
    width: 168,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
  },
  localPhoto: {
    position: 'absolute',
    right: 22,
    bottom: 150,
    width: 104,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1f2c33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTile: {
    width: 220,
    height: 280,
    borderRadius: 28,
    backgroundColor: '#1f2c33',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  kind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  kindText: { color: '#d5e4df', fontSize: 13, fontWeight: '700' },
  cameraOff: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  screen: {
    flex: 1,
    backgroundColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 14,
  },
  name: { color: colors.onAccent, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  status: { color: '#d5e4df', fontSize: 16, fontWeight: '600', marginBottom: 28 },
  effects: { gap: 8, paddingVertical: 4, paddingHorizontal: 8 },
  effect: { borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 6 },
  effectOn: { backgroundColor: '#ffffff' },
  effectText: { color: '#d5e4df', fontSize: 13, fontWeight: '700' },
  effectTextOn: { color: '#214d3e' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center', gap: 14, maxWidth: 360 },
  action: { alignItems: 'center', gap: 8, width: 76 },
  circle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  danger: { backgroundColor: colors.danger },
  quiet: { backgroundColor: '#eef3f2' },
  turned: { transform: [{ rotate: '135deg' }] },
  label: { color: colors.onAccent, fontSize: 13, fontWeight: '700' },
  minimize: {
    position: 'absolute',
    top: 54,
    left: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  minimizeLabel: { color: colors.onAccent, fontSize: 14, fontWeight: '700' },
  dock: { ...StyleSheet.absoluteFillObject, zIndex: 40 },
  mini: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 420,
    backgroundColor: colors.accentDark,
    borderRadius: 28,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
  },
  miniVideo: { backgroundColor: '#111b21' },
  miniMain: { flexShrink: 1, paddingRight: 6 },
  miniName: { color: colors.onAccent, fontSize: 15, fontWeight: '800' },
  miniKind: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniStatus: { color: '#d5e4df', fontSize: 13, fontWeight: '600' },
  miniQuiet: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef3f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniEnd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
