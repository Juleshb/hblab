import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../api';
import { ErrorText, ListRow, Notice } from '../components/ui';
import { apiError } from '../format';
import { useLive } from '../live';
import { colors, type } from '../theme';

export default function GroupScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [thread, setThread] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get(`/hbms/conversations/${id}`);
      setThread(response.data.data);
    } catch (err) {
      setError(apiError(err, 'Could not load this group'));
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useLive(useCallback((event) => {
    if (event.type === 'conversations' && (!event.conversationId || event.conversationId === id)) load();
  }, [id, load]));

  async function updateMembers() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/hbms/conversations/${id}/members`);
      await load();
    } catch (err) {
      setError(apiError(err, 'Could not update the members'));
    } finally {
      setBusy(false);
    }
  }

  function removeGroup() {
    Alert.alert(
      'Delete this group?',
      'Messages in it will be removed. You can create the project group again later.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            setError('');
            try {
              await api.delete(`/hbms/conversations/${id}`);
              router.replace('/teams');
            } catch (err) {
              setError(apiError(err, 'Could not delete the group'));
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  const members = thread?.members || [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={type.kicker}>{thread?.detail || 'Project group'}</Text>
      <Text style={type.title}>{thread?.title || 'Group'}</Text>
      <Text style={styles.lead}>People working on this project. Update the list when the team changes.</Text>
      <ErrorText>{error}</ErrorText>
      {!thread && !error ? <Notice>Loading group…</Notice> : null}
      {thread?.canManage ? (
        <>
          <Pressable accessibilityRole="button" onPress={updateMembers} disabled={busy} style={styles.primary}>
            <Text style={styles.primaryText}>{busy ? 'Working…' : 'Update members'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={removeGroup} disabled={busy} style={styles.danger}>
            <Text style={styles.dangerText}>Delete group</Text>
          </Pressable>
        </>
      ) : thread ? <Notice>Only the group admin can change or delete this group.</Notice> : null}
      {members.map((member) => (
        <ListRow
          key={member.id}
          title={member.name}
          meta={member.staffCode || 'Team member'}
          employeeId={member.employeeId}
          photoKey={member.photoKey}
          onAvatarPress={member.employeeId ? () => router.push(`/person/${member.employeeId}`) : undefined}
          onPress={member.employeeId ? () => router.push(`/person/${member.employeeId}`) : undefined}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  lead: { marginTop: 8, marginBottom: 12, color: colors.muted, fontSize: 14, lineHeight: 20 },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  primaryText: { color: colors.onAccent, fontSize: 16, fontWeight: '700' },
  danger: {
    backgroundColor: colors.chip,
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  dangerText: { color: colors.danger, fontSize: 16, fontWeight: '700' },
});
