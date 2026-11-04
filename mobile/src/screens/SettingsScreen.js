import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../api';
import { useAuth } from '../auth';
import { Avatar, ErrorText } from '../components/ui';
import { apiError, personName } from '../format';
import { KeyboardScroll } from '../keyboard';
import { readCache, writeCache } from '../offline';
import { colors } from '../theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { employee, user, logout } = useAuth();
  const [card, setCard] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const id = employee?.id;
    if (!id) return;
    const saved = readCache(`person:${id}`);
    if (saved && typeof saved === 'object') setCard(saved);
    try {
      const response = await api.get(`/hbms/employees/${id}/card`);
      const next = response.data.data;
      setCard(next);
      setError('');
      await writeCache(`person:${id}`, next);
    } catch (err) {
      if (!saved) setError(apiError(err, 'Could not open your profile'));
    }
  }, [employee?.id]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const shown = card || employee;
  const name = (shown && personName(shown)) || user?.name || 'Signed in';
  const role = [shown?.position?.title, shown?.department?.name, shown?.businessUnit?.name].filter(Boolean).join(' · ');

  function signOut() {
    Alert.alert('Sign out', 'You will need your email and password to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <KeyboardScroll style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Avatar name={name} employeeId={shown?.id} photoKey={shown?.photoKey} size={120} />
        <Text style={styles.name}>{name}</Text>
        {role ? <Text style={styles.role}>{role}</Text> : null}
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
      </View>
      <ErrorText>{error}</ErrorText>
      {shown?.id ? (
        <Pressable accessibilityRole="button" onPress={() => router.push(`/person/${shown.id}`)} style={styles.primary}>
          <Text style={styles.primaryText}>View profile</Text>
        </Pressable>
      ) : (
        <Text style={styles.note}>Your worker profile is still loading. It appears here once this phone reaches HBMS.</Text>
      )}
      {shown ? (
        <View style={styles.details}>
          <Row label="Phone" value={shown.phone || 'Not added'} />
          <Row label="Email" value={shown.email || user?.email || 'Not added'} />
          <Row label="Skills" value={(shown.skills || []).length ? shown.skills.join(', ') : 'Not added'} />
        </View>
      ) : null}
      <Pressable accessibilityRole="button" onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </KeyboardScroll>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 20 },
  name: { marginTop: 12, fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  role: { marginTop: 4, fontSize: 14, color: colors.muted, textAlign: 'center' },
  email: { marginTop: 4, fontSize: 14, color: colors.muted, textAlign: 'center' },
  note: { fontSize: 14, lineHeight: 20, color: colors.muted, textAlign: 'center', marginBottom: 16 },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  primaryText: { color: colors.onAccent, fontSize: 16, fontWeight: '700' },
  details: { gap: 14 },
  row: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, paddingBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 4 },
  value: { fontSize: 16, color: colors.text },
  signOut: {
    marginTop: 28,
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fde8ec',
  },
  signOutText: { color: colors.danger, fontSize: 16, fontWeight: '700' },
});
