import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../api';
import { setMessageBadge, setTeamsBadge } from '../badges';
import { useAuth } from '../auth';
import { Avatar, Chip, ErrorText, ListRow, Notice, ProjectIcon, ScreenIntro, UnitIcon } from '../components/ui';
import { apiError, formatChatTime } from '../format';
import { useLive } from '../live';
import { colors, frame } from '../theme';

const FILTERS = [
  ['all', 'All'],
  ['unread', 'Unread'],
];

function unreadTotal(rows, kinds) {
  const wanted = new Set(Array.isArray(kinds) ? kinds : [kinds]);
  return rows.filter((item) => wanted.has(item.kind)).reduce((sum, item) => sum + (item.unread || 0), 0);
}

export default function ConversationHome({ title, kicker, work }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { employee } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const personal = !work;

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get('/hbms/conversations');
      const rows = response.data.data?.conversations || [];
      setConversations(rows);
      setMessageBadge(unreadTotal(rows, 'DIRECT'));
      setTeamsBadge(unreadTotal(rows, ['DEPARTMENT', 'PROJECT']));
    } catch (err) {
      setError(apiError(err, 'Could not load chats'));
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useLive(useCallback((event) => {
    if (event.type === 'conversations' || event.type === 'message' || event.type === 'profile') load();
  }, [load]));

  const visible = useMemo(() => {
    const kinds = personal ? ['DIRECT'] : ['DEPARTMENT', 'PROJECT'];
    let rows = conversations.filter((item) => kinds.includes(item.kind));
    if (filter === 'unread') rows = rows.filter((item) => item.unread > 0);
    return rows;
  }, [conversations, filter, personal]);

  const sections = useMemo(() => {
    if (personal) return [{ key: 'people', title: '', code: null, rows: visible }];
    const groups = new Map();
    for (const item of visible) {
      const name = item.unitName || item.detail || 'Business unit';
      if (!groups.has(name)) groups.set(name, { key: name, title: name, code: item.unitCode, rows: [] });
      groups.get(name).rows.push(item);
    }
    return [...groups.values()];
  }, [personal, visible]);

  function open(item) {
    router.push(`/thread/${item.id}`);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, Platform.OS === 'ios' && { paddingBottom: insets.bottom + 168 }]}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        )}
      >
        <ScreenIntro
          title={title}
          kicker={kicker}
          leading={personal && employee?.id ? (
            <Avatar
              name={`${employee.firstName || ''} ${employee.lastName || ''}`}
              employeeId={employee.id}
              photoKey={employee.photoKey}
              onPress={() => router.push(`/person/${employee.id}`)}
            />
          ) : null}
        />
        <View style={styles.filters}>
          {FILTERS.map(([id, label]) => (
            <Chip key={id} label={label} active={filter === id} onPress={() => setFilter(id)} />
          ))}
        </View>
        <ErrorText>{error}</ErrorText>
        {sections.map((section) => (
          <View key={section.key}>
            {section.title ? (
              <View style={styles.unit}>
                <UnitIcon code={section.code} name={section.title} size={22} />
                <Text style={styles.section}>{section.title}</Text>
              </View>
            ) : null}
            {section.rows.map((item) => (
              <ListRow
                key={item.id}
                title={item.title}
                meta={item.lastBody || item.detail || 'No messages yet'}
                trailing={formatChatTime(item.lastAt)}
                unread={item.unread}
                employeeId={item.employeeId}
                photoKey={item.photoKey}
                mark={item.kind === 'PROJECT'
                  ? <ProjectIcon name={item.title} />
                  : item.kind === 'DEPARTMENT'
                    ? <UnitIcon code={item.unitCode} name={item.unitName || item.title} />
                    : null}
                onAvatarPress={item.employeeId ? () => router.push(`/person/${item.employeeId}`) : undefined}
                onPress={() => open(item)}
              />
            ))}
          </View>
        ))}
        {!error && visible.length === 0 ? (
          <Notice>
            {personal
              ? 'Your personal chats show up here. Start one with the green button.'
              : 'Department chats and project groups show up here. Start a project group with the green button.'}
          </Notice>
        ) : null}
      </ScrollView>
      <Pressable accessibilityRole="button" onPress={() => router.push(work ? '/project-group' : '/people')} style={[styles.fab, Platform.OS === 'ios' && { bottom: insets.bottom + 86 }]}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { ...frame, paddingHorizontal: 16, paddingBottom: 96 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  unit: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 2 },
  section: { fontSize: 13, fontWeight: '700', color: colors.accentDark },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: colors.onAccent, fontSize: 32, lineHeight: 34, fontWeight: '400' },
});
