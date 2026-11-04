import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../api';
import { ErrorText, ListRow, Notice } from '../components/ui';
import { apiError, formatWhen, personName, STATUS_LABEL } from '../format';
import { useLive } from '../live';
import { colors, type } from '../theme';

export default function MeetingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get('/hbms/meetings');
      const found = (response.data.data || []).find((item) => item.id === id);
      setMeeting(found || null);
      if (!found) setError('Meeting not found');
    } catch (err) {
      setError(apiError(err, 'Could not load this meeting'));
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useLive(useCallback((event) => {
    if (event.type === 'meetings') load();
  }, [load]));

  const names = (meeting?.attendees || [])
    .map((item) => personName(item.employee))
    .filter(Boolean)
    .join(', ');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {!loaded && !error ? <Notice>Loading meeting…</Notice> : null}
      <ErrorText>{error}</ErrorText>
      {meeting ? (
        <>
          <Text style={type.kicker}>{[formatWhen(meeting.startsAt), meeting.location].filter(Boolean).join(' · ')}</Text>
          <Text style={type.title}>{meeting.title}</Text>
          {meeting.agenda ? <Text style={styles.body}>{meeting.agenda}</Text> : null}
          {meeting.minutes ? (
            <>
              <Text style={styles.section}>Minutes</Text>
              <Text style={styles.body}>{meeting.minutes}</Text>
            </>
          ) : null}
          {names ? (
            <>
              <Text style={styles.section}>Attending</Text>
              <Text style={styles.body}>{names}</Text>
            </>
          ) : null}
          {(meeting.tasks || []).length ? <Text style={styles.section}>Follow-up</Text> : null}
          {(meeting.tasks || []).map((task) => (
            <ListRow
              key={task.id}
              title={task.title}
              meta={`${task.project?.name || 'Project'} · ${STATUS_LABEL[task.status] || task.status}`}
              onPress={() => router.push(`/task/${task.id}`)}
            />
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  body: { marginTop: 8, fontSize: 15, lineHeight: 21, color: colors.text },
  section: { marginTop: 16, marginBottom: 8, fontSize: 12, color: colors.faint },
});
