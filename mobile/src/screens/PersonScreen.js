import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../api';
import { useAuth } from '../auth';
import { Avatar, ErrorText, Notice } from '../components/ui';
import { apiError, personName } from '../format';
import { KeyboardScroll, LiftInput } from '../keyboard';
import { useLive } from '../live';
import { forgetPhoto } from '../photos';
import { colors } from '../theme';

export default function PersonScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { employee, refresh, logout } = useAuth();
  const [person, setPerson] = useState(null);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const mine = Boolean(person && employee?.id && person.id === employee.id);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get(`/hbms/employees/${id}/card`);
      const card = response.data.data;
      setPerson(card);
      setFirstName(card.firstName || '');
      setLastName(card.lastName || '');
      setPhone(card.phone || '');
      setSkills((card.skills || []).join(', '));
    } catch (err) {
      setError(apiError(err, 'Could not open this profile'));
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useLive(useCallback((event) => {
    if (event.type !== 'profile' || event.employeeId !== id || editing) return;
    load();
    if (employee?.id === id) refresh();
  }, [editing, employee?.id, id, load, refresh]));

  async function save() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api.patch(`/hbms/employees/${id}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        skills,
      });
      await refresh();
      await load();
      setEditing(false);
    } catch (err) {
      setError(apiError(err, 'Could not save your profile'));
    } finally {
      setBusy(false);
    }
  }

  async function changePhoto() {
    if (busy) return;
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo access to update your picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const form = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(asset.uri)).blob();
      form.append('file', blob, asset.fileName || 'photo.jpg');
    } else {
      form.append('file', {
        uri: asset.uri,
        name: asset.fileName || 'photo.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
    setBusy(true);
    try {
      await api.post(`/hbms/employees/${id}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data,
      });
      forgetPhoto(id);
      await refresh();
      await load();
    } catch (err) {
      setError(apiError(err, 'Could not update your picture'));
    } finally {
      setBusy(false);
    }
  }

  async function message() {
    if (busy || !person) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.post('/hbms/conversations', { employeeId: person.id });
      router.push(`/thread/${response.data.data.id}`);
    } catch (err) {
      setError(apiError(err, 'Could not open the chat'));
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    Alert.alert('Sign out', 'You will need your email and password to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  const role = [person?.position?.title, person?.department?.name, person?.businessUnit?.name].filter(Boolean).join(' · ');

  return (
    <KeyboardScroll style={styles.screen} contentContainerStyle={styles.content}>
      <ErrorText>{error}</ErrorText>
      {!person && !error ? <Notice>Loading profile…</Notice> : null}
      {person ? (
        <View style={styles.hero}>
          <Avatar name={personName(person)} employeeId={person.id} photoKey={person.photoKey} size={120} />
          {editing ? null : (
            <>
              <Text style={styles.name}>{personName(person)}</Text>
              {role ? <Text style={styles.role}>{role}</Text> : null}
            </>
          )}
        </View>
      ) : null}
      {person && mine && !editing ? (
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={styles.primary}>
            <Text style={styles.primaryText}>Edit profile</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={changePhoto} style={styles.secondary}>
            <Text style={styles.secondaryText}>{busy ? 'Updating…' : 'Change photo'}</Text>
          </Pressable>
        </View>
      ) : null}
      {person && !mine ? (
        <Pressable accessibilityRole="button" onPress={message} style={styles.primary}>
          <Text style={styles.primaryText}>{busy ? 'Opening…' : 'Message'}</Text>
        </Pressable>
      ) : null}
      {editing ? (
        <View>
          <Text style={styles.label}>First name</Text>
          <LiftInput value={firstName} onChangeText={setFirstName} style={styles.input} placeholderTextColor={colors.faint} />
          <Text style={styles.label}>Last name</Text>
          <LiftInput value={lastName} onChangeText={setLastName} style={styles.input} placeholderTextColor={colors.faint} />
          <Text style={styles.label}>Phone</Text>
          <LiftInput value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" placeholderTextColor={colors.faint} />
          <Text style={styles.label}>Skills</Text>
          <LiftInput
            value={skills}
            onChangeText={setSkills}
            style={styles.input}
            placeholder="Design, writing, events"
            placeholderTextColor={colors.faint}
          />
          <Pressable accessibilityRole="button" onPress={save} style={styles.primary}>
            <Text style={styles.primaryText}>{busy ? 'Saving…' : 'Save'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setEditing(false)} style={styles.secondary}>
            <Text style={styles.secondaryText}>Cancel</Text>
          </Pressable>
        </View>
      ) : person ? (
        <View style={styles.details}>
          <Row label="Phone" value={person.phone || 'Not added'} />
          <Row label="Email" value={person.email || 'Not added'} />
          <Row label="Skills" value={(person.skills || []).length ? person.skills.join(', ') : 'Not added'} />
        </View>
      ) : null}
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
  hero: { alignItems: 'center', marginBottom: 16 },
  name: { marginTop: 12, fontSize: 24, fontWeight: '700', color: colors.text },
  role: { marginTop: 4, fontSize: 14, color: colors.muted, textAlign: 'center' },
  actions: { gap: 8, marginBottom: 16 },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  primaryText: { color: colors.onAccent, fontSize: 16, fontWeight: '700' },
  secondary: {
    backgroundColor: colors.chip,
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  secondaryText: { color: colors.accentDark, fontSize: 16, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 4 },
  input: {
    backgroundColor: colors.chip,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  details: { marginTop: 8, gap: 14 },
  row: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, paddingBottom: 12 },
  value: { fontSize: 16, color: colors.text },
});
