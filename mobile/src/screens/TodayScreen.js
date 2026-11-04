import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../api';
import { useAuth } from '../auth';
import { setInboxBadge, setMessageBadge, setTeamsBadge } from '../badges';
import { ErrorText, ListRow, Notice, ScreenIntro } from '../components/ui';
import { apiError, assignedTo, dueLabel, formatWhen, isOpenStatus, personName, STATUS_LABEL } from '../format';
import { useLive } from '../live';
import { ConnectLoader, onSynced, useOffline } from '../offline';
import { colors, frame } from '../theme';

function nextMeeting(meetings, employeeId) {
  const now = Date.now() - 30 * 60 * 1000;
  return [...(meetings || [])]
    .filter((meeting) => new Date(meeting.startsAt).getTime() >= now)
    .filter((meeting) => !employeeId || (meeting.attendees || []).some((item) => item.employeeId === employeeId) || !meeting.attendees?.length)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0] || null;
}

export default function TodayScreen() {
  const router = useRouter();
  const { employee, user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [meeting, setMeeting] = useState(null);
  const [thread, setThread] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { online } = useOffline();

  const load = useCallback(async () => {
    setError('');
    try {
      const [taskResponse, meetingResponse, conversationResponse, noticeResponse] = await Promise.all([
        api.get('/hbms/tasks', { params: { limit: 100 } }),
        api.get('/hbms/meetings'),
        api.get('/hbms/conversations'),
        api.get('/hbms/notifications', { params: { unread: '1' } }),
      ]);
      const mine = (taskResponse.data.data || []).filter((task) => assignedTo(task, employee?.id) && isOpenStatus(task.status));
      const soon = mine.filter((task) => {
        if (!task.dueDate) return false;
        const due = new Date(task.dueDate).getTime();
        const horizon = Date.now() + 2 * 86400000;
        return due <= horizon;
      });
      setTasks((soon.length ? soon : mine).slice(0, 3));
      setMeeting(nextMeeting(meetingResponse.data.data, employee?.id));
      const conversations = conversationResponse.data.data?.conversations || [];
      const unreadThreads = conversations.filter((item) => item.unread > 0);
      setThread(unreadThreads[0] || conversations[0] || null);
      setMessageBadge(conversations.filter((item) => item.kind === 'DIRECT').reduce((sum, item) => sum + (item.unread || 0), 0));
      setTeamsBadge(conversations.filter((item) => item.kind === 'DEPARTMENT' || item.kind === 'PROJECT').reduce((sum, item) => sum + (item.unread || 0), 0));
      setInboxBadge((noticeResponse.data.data || []).filter((item) => item.kind !== 'CONVERSATION').length);
    } catch (err) {
      setError(apiError(err, 'Could not load today'));
    }
  }, [employee?.id]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useEffect(() => onSynced(() => load()), [load]);

  useLive(useCallback((event) => {
    if (event.type === 'tasks' || event.type === 'inbox' || event.type === 'conversations' || event.type === 'message' || event.type === 'meetings') load();
  }, [load]));

  const name = employee ? personName(employee) : (user?.name || 'there');
  const unit = employee?.businessUnit?.name;
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const count = [tasks.length, meeting ? 1 : 0, thread?.unread ? 1 : 0].reduce((sum, item) => sum + item, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.accent} />}
    >
      <ScreenIntro
        kicker={[today, unit].filter(Boolean).join(' · ')}
        title={count ? `${count} things need you` : `Hello, ${name}`}
        action="Sign out"
        onAction={logout}
      />
      <ErrorText>{error}</ErrorText>
      {tasks.length ? <Text style={styles.section}>Due</Text> : null}
      {tasks.map((task) => (
        <ListRow
          key={task.id}
          title={task.title}
          meta={`${task.project?.name || 'Project'} · ${dueLabel(task)} · ${STATUS_LABEL[task.status] || task.status}`}
          unread
          onPress={() => router.push(`/task/${task.id}`)}
        />
      ))}
      {meeting ? <Text style={styles.section}>Next meeting</Text> : null}
      {meeting ? (
        <ListRow
          title={meeting.title}
          meta={[formatWhen(meeting.startsAt), meeting.location].filter(Boolean).join(' · ')}
          onPress={() => router.push(`/meeting/${meeting.id}`)}
        />
      ) : null}
      {thread ? <Text style={styles.section}>{thread.unread ? 'Unread message' : 'Latest message'}</Text> : null}
      {thread ? (
        <ListRow
          title={thread.title}
          meta={thread.lastBody || thread.detail || 'Open the thread'}
          trailing={thread.unread ? String(thread.unread) : ''}
          unread={thread.unread > 0}
          onPress={() => router.push(`/thread/${thread.id}`)}
        />
      ) : null}
      {!error && !tasks.length && !meeting && !thread ? (online ? <Notice>Nothing assigned yet. Pull to refresh.</Notice> : <ConnectLoader />) : null}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { ...frame, padding: 16, paddingBottom: 32 },
  section: { marginTop: 6, marginBottom: 8, fontSize: 12, color: colors.faint },
});
