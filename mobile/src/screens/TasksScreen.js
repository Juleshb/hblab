import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../api';
import { useAuth } from '../auth';
import { Chip, ErrorText, ListRow, Notice, ScreenIntro, SettingsButton } from '../components/ui';
import { apiError, assignedTo, dueLabel, isOpenStatus, PRIORITY_LABEL, STATUS_LABEL } from '../format';
import { useLive } from '../live';
import { ConnectLoader, OfflineBanner, onSynced, readCache, useOffline, writeCache } from '../offline';
import { colors, frame } from '../theme';

const FILTERS = ['Mine', 'Due', 'Review'];

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { employee } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('Mine');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { online } = useOffline();

  const load = useCallback(async () => {
    setError('');
    const saved = readCache('tasks');
    if (Array.isArray(saved)) setTasks((current) => (current.length ? current : saved));
    try {
      const response = await api.get('/hbms/tasks', { params: { limit: 100 } });
      const rows = response.data.data || [];
      setTasks(rows);
      await writeCache('tasks', rows);
    } catch (err) {
      if (!Array.isArray(saved)) setError(apiError(err, 'Could not load tasks'));
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useEffect(() => onSynced(() => load()), [load]);

  useLive(useCallback((event) => {
    if (event.type === 'tasks') load();
  }, [load]));

  const visible = useMemo(() => {
    const mine = tasks.filter((task) => assignedTo(task, employee?.id));
    if (filter === 'Review') return mine.filter((task) => task.status === 'IN_REVIEW');
    if (filter === 'Due') {
      const horizon = Date.now() + 14 * 86400000;
      return mine.filter((task) => isOpenStatus(task.status) && task.dueDate && new Date(task.dueDate).getTime() <= horizon);
    }
    return mine.filter((task) => isOpenStatus(task.status));
  }, [tasks, filter, employee?.id]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
    <ScrollView
      contentContainerStyle={[styles.content, Platform.OS === 'ios' && { paddingBottom: insets.bottom + 108 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.accent} />}
    >
      <OfflineBanner />
      <ScreenIntro title="Work" kicker="Open a task, then message the people on it" trailing={<SettingsButton />} />
      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <Chip key={item} label={item} active={filter === item} onPress={() => setFilter(item)} />
        ))}
      </View>
      <ErrorText>{error}</ErrorText>
      {visible.map((task) => (
        <ListRow
          key={task.id}
          title={task.title}
          meta={`${task.project?.name || 'Project'} · ${dueLabel(task)} · ${PRIORITY_LABEL[task.priority] || task.priority} · ${STATUS_LABEL[task.status] || task.status}`}
          onPress={() => router.push(`/task/${task.id}`)}
        />
      ))}
      {!error && visible.length === 0 ? (online ? <Notice>No tasks in this view.</Notice> : <ConnectLoader />) : null}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { ...frame, padding: 16, paddingBottom: 32 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 14 },
});
