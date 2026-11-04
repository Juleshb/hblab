import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../api';
import { useAuth } from '../auth';
import { Avatar, ErrorText } from '../components/ui';
import { apiError, personName } from '../format';
import { KeyboardScroll, LiftInput } from '../keyboard';
import { useLive } from '../live';
import { onSynced, readCache, writeCache } from '../offline';
import { forgetPhoto } from '../photos';
import { colors } from '../theme';

function savedPerson(personId) {
  const saved = readCache(`person:${personId}`);
  return saved && typeof saved === 'object' ? saved : null;
}

export default function PersonScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { employee, refresh, logout } = useAuth();
  const [person, setPerson] = useState(() => savedPerson(id));
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const loadSeq = useRef(0);

  const mine = Boolean(person && employee?.id && person.id === employee.id);

  const applyCard = useCallback((card) => {
    setPerson(card);
    setFirstName(card.firstName || '');
    setLastName(card.lastName || '');
    setPhone(card.phone || '');
    setSkills((card.skills || []).join(', '));
  }, []);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setError('');
    const saved = savedPerson(id);
    if (saved) setPerson((current) => current || saved);
    try {
      const response = await api.get(`/hbms/employees/${id}/card`);
      if (seq !== loadSeq.current) return;
      const card = response.data.data;
      if (editing) setPerson(card);
      else applyCard(card);
      await writeCache(`person:${id}`, card);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      if (!saved) setError(apiError(err, 'Could not open this profile'));
    }
  }, [applyCard, editing, id]);

  useEffect(() => {
    const saved = savedPerson(id);
    setPerson(saved);
    setError('');
    setEditing(false);
    if (saved) applyCard(saved);
  }, [applyCard, id]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useEffect(() => onSynced(() => load()), [load]);

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

  const waiting = !person && !error;

  return (
    <KeyboardScroll style={styles.screen} contentContainerStyle={waiting ? styles.loading : styles.content}>
      <Stack.Screen options={{ title: person ? personName(person) : 'Profile' }} />
      <ErrorText>{error}</ErrorText>
      {waiting ? <ProfileLoader /> : null}
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
      {mine && !editing ? (
        <Pressable accessibilityRole="button" onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      ) : null}
    </KeyboardScroll>
  );
}

function ProfileLoader() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fading = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 680, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.4, duration: 680, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const moving = Animated.loop(Animated.timing(slide, {
      toValue: 1,
      duration: 1100,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }));
    fading.start();
    moving.start();
    return () => {
      fading.stop();
      moving.stop();
    };
  }, [pulse, slide]);

  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-140, 320] });

  return (
    <View style={styles.loader}>
      <View style={styles.loaderTrack}>
        <Animated.View style={[styles.loaderBar, { transform: [{ translateX }] }]} />
      </View>
      <View style={styles.loaderPhoto}>
        <Animated.View style={[styles.loaderDisc, { opacity: pulse }]} />
        <ActivityIndicator size="large" color={colors.accent} style={styles.loaderSpinner} />
      </View>
      <Animated.View style={[styles.ghost, styles.ghostName, { opacity: pulse }]} />
      <Animated.View style={[styles.ghost, styles.ghostRole, { opacity: pulse }]} />
    </View>
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
  loading: { flexGrow: 1 },
  loader: { flex: 1, alignItems: 'center' },
  loaderTrack: {
    alignSelf: 'stretch',
    height: 3,
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
    marginBottom: 48,
  },
  loaderBar: { width: 140, height: 3, backgroundColor: colors.accent },
  loaderPhoto: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  loaderDisc: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.chip,
  },
  loaderSpinner: { position: 'absolute' },
  ghost: { backgroundColor: colors.chip, borderRadius: 8 },
  ghostName: { width: 168, height: 18, marginTop: 22 },
  ghostRole: { width: 220, height: 12, marginTop: 12, backgroundColor: colors.line },
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
  signOut: {
    marginTop: 28,
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fde8ec',
  },
  signOutText: { color: colors.danger, fontSize: 16, fontWeight: '700' },
});
