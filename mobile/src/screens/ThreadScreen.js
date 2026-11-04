import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../api';
import { EmojiButton, EmojiPanel, useEmojiInsert } from '../components/EmojiPanel';
import { Avatar, ErrorText, Notice, ProjectIcon, UnitIcon } from '../components/ui';
import { setOpenConversation } from '../alerts';
import { apiError, formatChatTime } from '../format';
import { KeyboardSafe, LiftInput } from '../keyboard';
import { useLive } from '../live';
import { colors } from '../theme';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function ThreadScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const list = useRef(null);
  const inputRef = useRef(null);
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [reply, setReply] = useState(null);
  const [picked, setPicked] = useState(null);
  const emoji = useEmojiInsert(draft, setDraft);
  const [asDepartment, setAsDepartment] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reactLock = useRef(0);
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setError('');
    try {
      const response = await api.get(`/hbms/conversations/${id}`);
      if (seq !== loadSeq.current) return;
      setThread(response.data.data);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(apiError(err, 'Could not open this conversation'));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setOpenConversation(id);
    return () => setOpenConversation(null);
  }, [id]);

  useLive(useCallback((event) => {
    if ((event.type === 'message' || event.type === 'reaction' || event.type === 'read' || event.type === 'delivered' || event.type === 'conversations') && event.conversationId === id) load();
  }, [id, load]));

  async function send() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.post(`/hbms/conversations/${id}/messages`, {
        body,
        asDepartment: asDepartment && thread?.canSpeakAsDepartment,
        replyToId: reply?.id || undefined,
      });
      setDraft('');
      setReply(null);
      setThread((current) => current && ({
        ...current,
        messages: [...(current.messages || []), response.data.data],
      }));
    } catch (err) {
      setError(apiError(err, 'Could not send the message'));
    } finally {
      setBusy(false);
    }
  }

  function openMessage(message) {
    Keyboard.dismiss();
    setEmojiOpen(false);
    setPicked(message);
  }

  function applyReaction(messageId, symbol) {
    loadSeq.current += 1;
    setThread((current) => {
      if (!current) return current;
      return {
        ...current,
        messages: (current.messages || []).map((message) => {
          if (message.id !== messageId) return message;
          const reactions = (message.reactions || []).map((row) => ({ ...row }));
          const mine = reactions.find((row) => row.mine);
          if (mine?.emoji === symbol) {
            mine.count -= 1;
            mine.mine = false;
            return { ...message, reactions: reactions.filter((row) => row.count > 0) };
          }
          if (mine) {
            mine.count -= 1;
            mine.mine = false;
          }
          const cleaned = reactions.filter((row) => row.count > 0);
          const next = cleaned.find((row) => row.emoji === symbol);
          if (next) {
            next.count += 1;
            next.mine = true;
          } else {
            cleaned.push({ emoji: symbol, count: 1, mine: true });
          }
          return { ...message, reactions: cleaned };
        }),
      };
    });
  }

  async function reactTo(message, symbol) {
    const now = Date.now();
    if (now - reactLock.current < 700) return;
    reactLock.current = now;
    setPicked(null);
    setError('');
    applyReaction(message.id, symbol);
    try {
      await api.post(`/hbms/conversations/${id}/messages/${message.id}/reactions`, { emoji: symbol });
    } catch (err) {
      setError(apiError(err, 'Could not react to the message'));
      load();
    }
  }

  function startReply(message) {
    setReply(message);
    setPicked(null);
    setEmojiOpen(false);
    inputRef.current?.focus();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
    <KeyboardSafe>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        {thread?.kind === 'PROJECT' ? (
          <ProjectIcon name={thread.title} size={36} />
        ) : thread?.kind === 'DEPARTMENT' ? (
          <UnitIcon code={thread.unitCode} name={thread.unitName || thread.title} size={36} />
        ) : (
          <Avatar
            name={thread?.title || 'Chat'}
            size={36}
            employeeId={thread?.employeeId}
            photoKey={thread?.photoKey}
            onPress={thread?.employeeId ? () => router.push(`/person/${thread.employeeId}`) : undefined}
          />
        )}
        <Pressable
          accessibilityRole={thread?.employeeId ? 'button' : undefined}
          onPress={thread?.employeeId ? () => router.push(`/person/${thread.employeeId}`) : undefined}
          style={{ flex: 1 }}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>{thread?.title || 'Chat'}</Text>
          <Text style={styles.headerMeta} numberOfLines={1}>{thread?.detail || ' '}</Text>
        </Pressable>
        {thread?.canManage ? (
          <Pressable accessibilityRole="button" onPress={() => router.push(`/group/${thread.id}`)} hitSlop={8}>
            <Text style={styles.manage}>Manage</Text>
          </Pressable>
        ) : null}
      </View>
      <ErrorText>{error}</ErrorText>
      <FlatList
        ref={list}
        style={styles.wallpaper}
        data={thread?.messages || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => list.current?.scrollToEnd?.({ animated: false })}
        ListEmptyComponent={thread ? <Notice>No messages yet.</Notice> : <Notice>Loading conversation…</Notice>}
        renderItem={({ item }) => (
          <ChatMessage
            item={item}
            onOpen={() => openMessage(item)}
            onReply={() => startReply(item)}
            onAuthor={item.authorEmployeeId ? () => router.push(`/person/${item.authorEmployeeId}`) : undefined}
          />
        )}
      />
      {thread?.canSpeakAsDepartment ? (
        <Pressable onPress={() => setAsDepartment((value) => !value)} style={styles.toggle}>
          <Text style={styles.toggleText}>{asDepartment ? 'Sending as the department' : 'Send as yourself'}</Text>
        </Pressable>
      ) : null}
      {thread && thread.canSend === false ? <Notice>You can read this conversation.</Notice> : (
        <View>
          {picked ? (
            <View style={styles.actions}>
              <View style={styles.reactRow}>
                {QUICK_REACTIONS.map((symbol) => {
                  const mine = picked.reactions?.some((reaction) => reaction.emoji === symbol && reaction.mine);
                  return (
                    <Pressable key={symbol} accessibilityRole="button" accessibilityLabel={symbol} onPress={() => reactTo(picked, symbol)} style={[styles.reactHit, mine && styles.reactHitOn]}>
                      <Text style={styles.reactEmoji}>{symbol}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.actionButtons}>
                <Pressable accessibilityRole="button" onPress={() => startReply(picked)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>Reply</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setPicked(null)} style={styles.actionBtn}>
                  <Text style={styles.actionMuted}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          {reply ? (
            <View style={styles.replyBar}>
              <View style={styles.replyStripe} />
              <View style={{ flex: 1 }}>
                <Text style={styles.replyAuthor}>{reply.mine ? 'You' : (reply.asDepartment ? reply.departmentName : reply.author)}</Text>
                <Text style={styles.replyBody} numberOfLines={1}>{reply.body}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cancel reply" onPress={() => setReply(null)} hitSlop={8}>
                <Text style={styles.replyClose}>✕</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.composer}>
            <View style={styles.field}>
              <EmojiButton
                open={emojiOpen}
                onPress={() => {
                  if (emojiOpen) {
                    setEmojiOpen(false);
                    inputRef.current?.focus();
                  } else {
                    Keyboard.dismiss();
                    setEmojiOpen(true);
                  }
                }}
              />
              <LiftInput
                inputRef={inputRef}
                value={draft}
                onChangeText={setDraft}
                onFocus={() => setEmojiOpen(false)}
                onSelectionChange={emoji.onSelectionChange}
                {...(emoji.selection ? { selection: emoji.selection } : null)}
                placeholder="Message"
                placeholderTextColor={colors.faint}
                style={styles.input}
                multiline
              />
            </View>
            <Pressable accessibilityRole="button" onPress={send} disabled={!draft.trim() || busy} style={[styles.send, (!draft.trim() || busy) && styles.sendOff]}>
              <Text style={styles.sendText}>➤</Text>
            </Pressable>
          </View>
          {picked ? <EmojiPanel onPick={(symbol) => reactTo(picked, symbol)} /> : null}
          {emojiOpen && !picked ? <EmojiPanel onPick={emoji.insert} /> : null}
        </View>
      )}
    </KeyboardSafe>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.chat },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  back: { width: 32, alignItems: 'center' },
  backText: { fontSize: 32, lineHeight: 32, color: colors.accent, marginTop: -4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  headerMeta: { fontSize: 12, color: colors.muted },
  manage: { color: colors.accentDark, fontSize: 14, fontWeight: '700', paddingHorizontal: 8 },
  wallpaper: { flex: 1, backgroundColor: colors.chat },
  list: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 18, gap: 6 },
  message: { maxWidth: '82%', marginBottom: 2 },
  messageMine: { alignSelf: 'flex-end' },
  messageTheirs: { alignSelf: 'flex-start' },
  messageReacted: { marginBottom: 4 },
  bubble: { borderRadius: 8, paddingHorizontal: 8, paddingTop: 6, paddingBottom: 4 },
  quote: { borderLeftWidth: 3, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4 },
  quoteMine: { backgroundColor: '#c8efbf', borderLeftColor: colors.accentDark },
  quoteTheirs: { backgroundColor: colors.chip, borderLeftColor: colors.accent },
  quoteAuthor: { fontSize: 12, fontWeight: '700', color: colors.accentDark },
  quoteBody: { fontSize: 13, color: colors.muted },
  pills: {
    alignSelf: 'flex-start',
    marginTop: -6,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  pillsMine: { alignSelf: 'flex-end', marginRight: 6 },
  pillsTheirs: { marginLeft: 6 },
  pillText: { fontSize: 16, color: colors.text },
  actions: { backgroundColor: colors.card, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  reactRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12, paddingBottom: 4 },
  reactHit: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chip },
  reactHitOn: { backgroundColor: colors.accentSoft },
  reactEmoji: { fontSize: 26 },
  actionButtons: { flexDirection: 'row', justifyContent: 'center', gap: 18, paddingBottom: 6 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  actionText: { color: colors.accentDark, fontSize: 15, fontWeight: '700' },
  actionMuted: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 8,
    marginTop: 8,
    paddingRight: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  replyStripe: { width: 4, alignSelf: 'stretch', backgroundColor: colors.accent },
  replyAuthor: { marginTop: 6, fontSize: 13, fontWeight: '700', color: colors.accentDark },
  replyBody: { marginBottom: 6, fontSize: 13, color: colors.muted },
  replyClose: { fontSize: 16, color: colors.muted, padding: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.bubbleMine, borderTopRightRadius: 8, borderBottomRightRadius: 2 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.bubbleTheirs, borderTopLeftRadius: 8, borderBottomLeftRadius: 2 },
  author: { fontSize: 12, fontWeight: '700', color: colors.accentDark, marginBottom: 2 },
  body: { fontSize: 15, lineHeight: 20, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 3, marginTop: 2 },
  time: { fontSize: 11, color: colors.faint },
  ticks: { fontSize: 13, lineHeight: 14, fontWeight: '700', color: '#8696a0', letterSpacing: -1 },
  ticksRead: { color: '#53bdeb' },
  toggle: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.bg },
  toggleText: { color: colors.accentDark, fontSize: 13, fontWeight: '600' },
  composer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 10,
    alignItems: 'flex-end',
    backgroundColor: colors.chip,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingLeft: 2,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.45 },
  sendText: { color: colors.onAccent, fontSize: 18, marginLeft: 2 },
  swipeHint: { position: 'absolute', left: 0, top: 0, bottom: 0, justifyContent: 'center' },
  swipeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    textAlign: 'center',
    lineHeight: 28,
    color: colors.accentDark,
    fontWeight: '700',
    overflow: 'hidden',
  },
});

function ReadTicks({ status }) {
  const read = status === 'read';
  const delivered = status === 'delivered' || read;
  const label = read ? 'Read' : delivered ? 'Delivered' : 'Sent';
  return (
    <Text style={[styles.ticks, read && styles.ticksRead]} accessibilityLabel={label}>
      {delivered ? '✓✓' : '✓'}
    </Text>
  );
}

function ChatMessage({ item, onOpen, onReply, onAuthor }) {
  const drag = useRef(new Animated.Value(0)).current;
  const replyRef = useRef(onReply);
  replyRef.current = onReply;
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => gesture.dx > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy) + 8,
    onPanResponderMove: (_, gesture) => {
      drag.setValue(Math.max(0, Math.min(gesture.dx, 88)));
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > 56) replyRef.current();
      Animated.spring(drag, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(drag, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
    },
  })).current;
  const hintOpacity = drag.interpolate({ inputRange: [0, 48], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={[styles.message, item.mine ? styles.messageMine : styles.messageTheirs, item.reactions?.length ? styles.messageReacted : null]}>
      <Animated.View style={[styles.swipeHint, { opacity: hintOpacity }]} pointerEvents="none">
        <Text style={styles.swipeIcon}>↩</Text>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX: drag }] }} {...pan.panHandlers}>
        <Pressable onPress={onOpen} style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}>
          {!item.mine ? (
            onAuthor ? (
              <Pressable onPress={onAuthor}>
                <Text style={styles.author}>{item.asDepartment ? item.departmentName : item.author}</Text>
              </Pressable>
            ) : <Text style={styles.author}>{item.asDepartment ? item.departmentName : item.author}</Text>
          ) : null}
          {item.reply ? (
            <View style={[styles.quote, item.mine ? styles.quoteMine : styles.quoteTheirs]}>
              <Text style={styles.quoteAuthor} numberOfLines={1}>{item.reply.mine ? 'You' : item.reply.author}</Text>
              <Text style={styles.quoteBody} numberOfLines={2}>{item.reply.body}</Text>
            </View>
          ) : null}
          <Text style={styles.body}>{item.body}</Text>
          <View style={styles.meta}>
            <Text style={styles.time}>{formatChatTime(item.createdAt)}</Text>
            {item.mine ? <ReadTicks status={item.receipt} /> : null}
          </View>
        </Pressable>
        {item.reactions?.length ? (
          <Pressable accessibilityRole="button" onPress={onOpen} style={[styles.pills, item.mine ? styles.pillsMine : styles.pillsTheirs]}>
            <Text style={styles.pillText}>
              {item.reactions.map((reaction) => (reaction.count > 1 ? `${reaction.emoji} ${reaction.count}` : reaction.emoji)).join('  ')}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}
