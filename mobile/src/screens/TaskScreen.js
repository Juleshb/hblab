import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../api';
import { useAuth } from '../auth';
import { Chip, ErrorText, ListRow, Notice } from '../components/ui';
import { apiError, dueLabel, formatWhen, personName, PRIORITY_LABEL, STATUS_LABEL } from '../format';
import { EmojiTextField } from '../components/EmojiPanel';
import { KeyboardScroll } from '../keyboard';
import { useLive } from '../live';
import { colors, type } from '../theme';

const WORKER_STATUSES = [
  ['TODO', 'To do'],
  ['IN_PROGRESS', 'Doing'],
  ['BLOCKED', 'Blocked'],
];

export default function TaskScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { employee, access } = useAuth();
  const [task, setTask] = useState(null);
  const [comment, setComment] = useState('');
  const [note, setNote] = useState('');
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get(`/hbms/tasks/${id}`);
      setTask(response.data.data);
    } catch (err) {
      setError(apiError(err, 'Could not load this task'));
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useLive(useCallback((event) => {
    if (event.type === 'tasks' && (!event.taskId || event.taskId === id)) load();
  }, [id, load]));

  async function run(work) {
    setBusy(true);
    setError('');
    try {
      await work();
      await load();
    } catch (err) {
      setError(apiError(err, 'Could not update this task'));
    } finally {
      setBusy(false);
    }
  }

  if (!task) {
    return (
      <View style={styles.screen}>
        <ErrorText>{error}</ErrorText>
        {!error ? <Notice>Loading task…</Notice> : null}
      </View>
    );
  }

  const assigned = (task.assignees || []).some((item) => (item.employeeId || item.employee?.id) === employee?.id);
  const canWork = assigned || access?.canAssignWork;
  const locked = ['DONE', 'CANCELLED', 'IN_REVIEW'].includes(task.status);
  const canSubmit = task.project?.requiresApproval && ['TODO', 'IN_PROGRESS', 'BLOCKED'].includes(task.status);
  const canFinish = !task.project?.requiresApproval && task.status !== 'DONE' && task.status !== 'CANCELLED';
  const canReview = access?.canAssignWork && task.status === 'IN_REVIEW' && task.project?.requiresApproval;
  const others = (task.assignees || []).filter((item) => (item.employeeId || item.employee?.id) !== employee?.id);

  async function messageAssignee(assignee) {
    const employeeId = assignee.employeeId || assignee.employee?.id;
    if (!employeeId || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.post('/hbms/conversations', { employeeId });
      router.push(`/thread/${response.data.data.id}`);
    } catch (err) {
      setError(apiError(err, 'Could not open the chat'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardScroll
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.accent} />}
    >
        <Text style={type.kicker}>{[task.project?.name, PRIORITY_LABEL[task.priority], dueLabel(task)].filter(Boolean).join(' · ')}</Text>
        <Text style={type.title}>{task.title}</Text>
        {task.description ? <Text style={styles.body}>{task.description}</Text> : null}
        <Text style={styles.status}>{STATUS_LABEL[task.status] || task.status}</Text>
        <ErrorText>{error}</ErrorText>
        {canWork && !locked ? (
          <View style={styles.filters}>
            {WORKER_STATUSES.map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                active={task.status === value}
                onPress={() => {
                  if (busy || task.status === value) return;
                  run(() => api.patch(`/hbms/tasks/${task.id}`, { status: value }));
                }}
              />
            ))}
          </View>
        ) : null}
        {task.checklist?.length ? <Text style={styles.section}>Checklist</Text> : null}
        {(task.checklist || []).map((item) => (
          <Pressable
            key={item.id}
            disabled={!canWork || busy}
            onPress={() => run(() => api.patch(`/hbms/tasks/${task.id}/checklist/${item.id}`, { done: !item.done }))}
            style={styles.check}
          >
            <View style={[styles.box, item.done && styles.boxOn]} />
            <Text style={[styles.checkLabel, item.done && styles.checkDone]}>{item.label}</Text>
          </Pressable>
        ))}
        {canSubmit ? (
          <Pressable disabled={busy} onPress={() => run(() => api.post(`/hbms/tasks/${task.id}/submit-review`))}>
            <Text style={styles.link}>Submit for review</Text>
          </Pressable>
        ) : null}
        {canFinish ? (
          <Pressable disabled={busy} onPress={() => run(() => api.patch(`/hbms/tasks/${task.id}`, { status: 'DONE' }))}>
            <Text style={styles.link}>Mark completed</Text>
          </Pressable>
        ) : null}
        {canReview ? (
          <View style={styles.review}>
            <Pressable disabled={busy} onPress={() => run(() => api.post(`/hbms/tasks/${task.id}/review`, { decision: 'APPROVED' }))}>
              <Text style={styles.link}>Approve</Text>
            </Pressable>
            <Pressable disabled={busy} onPress={() => setAsking((value) => !value)}>
              <Text style={styles.link}>Ask for changes</Text>
            </Pressable>
            {asking ? (
              <View>
                <EmojiTextField
                  value={note}
                  onChangeText={setNote}
                  placeholder="What should change?"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
                <Pressable
                  disabled={busy}
                  onPress={() => run(async () => {
                    await api.post(`/hbms/tasks/${task.id}/review`, { decision: 'CHANGES_REQUESTED', note });
                    setNote('');
                    setAsking(false);
                  })}
                >
                  <Text style={styles.link}>Send back</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
        {task.reviewNote ? <Text style={styles.body}>Review note: {task.reviewNote}</Text> : null}
        <Text style={styles.section}>Chat</Text>
        {others.length === 0 ? <Notice>No one else is on this task. Open Teams to reach the department.</Notice> : others.map((assignee) => (
          <ListRow
            key={assignee.id || assignee.employee?.id}
            title={personName(assignee.employee) || 'Teammate'}
            meta="Chat about this task"
            employeeId={assignee.employeeId || assignee.employee?.id}
            photoKey={assignee.employee?.photoKey}
            onAvatarPress={() => {
              const employeeId = assignee.employeeId || assignee.employee?.id;
              if (employeeId) router.push(`/person/${employeeId}`);
            }}
            onPress={() => messageAssignee(assignee)}
          />
        ))}
        <Text style={styles.section}>Comments</Text>
        {(task.comments || []).length === 0 ? <Notice>No comments yet.</Notice> : null}
        {(task.comments || []).map((item) => (
          <View key={item.id} style={styles.comment}>
            <Text style={styles.commentAuthor}>{personName(item.author) || 'Comment'} · {formatWhen(item.createdAt)}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        ))}
        <EmojiTextField
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment"
          placeholderTextColor={colors.faint}
          style={styles.input}
        />
        <Pressable
          disabled={busy || !comment.trim()}
          onPress={() => run(async () => {
            await api.post(`/hbms/tasks/${task.id}/comments`, {
              body: comment.trim(),
              authorId: employee?.id || undefined,
            });
            setComment('');
          })}
        >
          <Text style={[styles.link, !comment.trim() && { color: colors.faint }]}>Post comment</Text>
        </Pressable>
    </KeyboardScroll>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  body: { marginTop: 8, fontSize: 15, lineHeight: 21, color: colors.text },
  status: { marginTop: 10, marginBottom: 12, fontSize: 13, color: colors.muted },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  section: { marginTop: 16, marginBottom: 8, fontSize: 12, color: colors.faint },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  box: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: colors.accent },
  boxOn: { backgroundColor: colors.accent },
  checkLabel: { flex: 1, fontSize: 15, color: colors.text },
  checkDone: { color: colors.faint, textDecorationLine: 'line-through' },
  link: { color: colors.accent, fontSize: 15, fontWeight: '600', paddingVertical: 8 },
  review: { marginTop: 4 },
  comment: { marginBottom: 10 },
  commentAuthor: { fontSize: 12, color: colors.faint },
  input: { marginTop: 8 },
});
