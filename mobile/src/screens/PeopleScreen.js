import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../api';
import { ErrorText, ListRow, Notice } from '../components/ui';
import { apiError } from '../format';
import { ConnectLoader, onSynced, useOffline } from '../offline';
import { KeyboardScroll, LiftInput } from '../keyboard';
import { colors } from '../theme';

export default function PeopleScreen() {
  const router = useRouter();
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const { online } = useOffline();

  const load = useCallback(async () => {
    try {
      const response = await api.get('/hbms/conversations');
      setPeople(response.data.data?.people || []);
      setError('');
    } catch (err) {
      setError(apiError(err, 'Could not load people'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => onSynced(() => load()), [load]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return people;
    return people.filter((person) => `${person.name} ${person.detail || ''}`.toLowerCase().includes(text));
  }, [people, query]);

  async function open(person) {
    if (busyId) return;
    setBusyId(person.userId);
    setError('');
    try {
      const response = await api.post('/hbms/conversations', { userId: person.userId });
      router.replace(`/thread/${response.data.data.id}`);
    } catch (err) {
      setError(apiError(err, 'Could not open the conversation'));
      setBusyId(null);
    }
  }

  return (
    <KeyboardScroll style={styles.screen} contentContainerStyle={styles.content}>
      <LiftInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search people"
        placeholderTextColor={colors.faint}
        style={styles.input}
        autoCapitalize="none"
      />
      <ErrorText>{error}</ErrorText>
      {visible.map((person) => (
        <ListRow
          key={person.userId}
          title={person.name}
          meta={person.detail}
          employeeId={person.employeeId}
          photoKey={person.photoKey}
          onAvatarPress={person.employeeId ? () => router.push(`/person/${person.employeeId}`) : undefined}
          onPress={() => open(person)}
        />
      ))}
      {!error && visible.length === 0 ? (online ? <Notice>No one matches that search.</Notice> : <ConnectLoader />) : null}
      {busyId ? <Pressable><Text style={styles.opening}>Opening conversation…</Text></Pressable> : null}
    </KeyboardScroll>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  input: {
    backgroundColor: colors.chip,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  opening: { color: colors.muted, marginTop: 8 },
});
