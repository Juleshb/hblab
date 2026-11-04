import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { loadPhoto, photoUri, subscribePhotos } from '../photos';
import { avatarColor, colors, type } from '../theme';

export function Boot() {
  return (
    <View style={styles.boot}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function Avatar({ name, size = 48, employeeId, photoKey, onPress }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    loadPhoto(employeeId, photoKey);
    return subscribePhotos(() => {
      loadPhoto(employeeId, photoKey);
      setTick((value) => value + 1);
    });
  }, [employeeId, photoKey]);
  const uri = photoUri(employeeId, photoKey);
  const letter = String(name || '?').trim().charAt(0).toUpperCase() || '?';
  const face = uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name) }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{letter}</Text>
    </View>
  );
  if (!onPress) return face;
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      onPress={(event) => {
        event?.stopPropagation?.();
        onPress();
      }}
    >
      {face}
    </Pressable>
  );
}

const UNIT_ICONS = {
  HBLAB: 'school',
  HBSTUDIO: 'videocam',
};

export function ProjectIcon({ name, size = 48 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name || 'project') }]}>
      <Ionicons name="folder" size={Math.round(size * 0.46)} color="#ffffff" />
    </View>
  );
}

export function UnitIcon({ code, name, size = 48 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name || code || 'unit') }]}>
      <Ionicons name={UNIT_ICONS[code] || 'business'} size={Math.round(size * 0.46)} color="#ffffff" />
    </View>
  );
}

export function ScreenIntro({ kicker, title, action, onAction, leading }) {
  return (
    <View style={styles.intro}>
      {leading || null}
      <View style={{ flex: 1 }}>
        <Text style={type.title}>{title}</Text>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={styles.actionButton}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ListRow({ title, meta, trailing, unread, count, onPress, employeeId, photoKey, onAvatarPress, mark }) {
  const shown = typeof count === 'number' ? count : (typeof unread === 'number' ? unread : 0);
  const marked = Boolean(unread);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      {mark || <Avatar name={title} employeeId={employeeId} photoKey={photoKey} onPress={onAvatarPress} />}
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
          {trailing ? <Text style={[styles.trailing, marked && styles.trailingUnread]}>{trailing}</Text> : null}
        </View>
        <View style={styles.rowBottom}>
          <Text style={styles.rowMeta} numberOfLines={1}>{meta}</Text>
          {shown > 0 || marked ? (
            <View style={[styles.badge, !marked && styles.badgeQuiet, shown === 0 && styles.dot]}>
              {shown > 0 ? <Text style={[styles.badgeText, !marked && styles.badgeTextQuiet]}>{shown}</Text> : null}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children }) {
  return <Text style={styles.notice}>{children}</Text>;
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#ffffff', fontWeight: '700' },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 8 },
  kicker: { marginTop: 2, fontSize: 13, color: colors.muted },
  actionButton: { backgroundColor: colors.accentSoft, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  action: { color: colors.accentDark, fontSize: 14, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    backgroundColor: colors.bg,
  },
  rowBody: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    paddingBottom: 10,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  rowTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  rowMeta: { flex: 1, fontSize: 14, color: colors.muted },
  trailing: { fontSize: 12, color: colors.faint },
  trailingUnread: { color: colors.accent, fontWeight: '600' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onAccent, fontSize: 12, fontWeight: '700' },
  badgeQuiet: { backgroundColor: colors.chip },
  badgeTextQuiet: { color: colors.muted },
  dot: { minWidth: 10, width: 10, height: 10, paddingHorizontal: 0 },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.chip,
  },
  chipOn: { backgroundColor: colors.accentSoft },
  chipText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  chipTextOn: { color: colors.accentDark },
  notice: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 12 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20, marginBottom: 8 },
});
