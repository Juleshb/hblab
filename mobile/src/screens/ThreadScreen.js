import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Keyboard,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../api';
import { EmojiButton, EmojiPanel, useEmojiInsert } from '../components/EmojiPanel';
import { MicButton, RecordingBar, stopVoice, VoiceNote, VoiceRecorder, voiceForm, voiceLabel } from '../components/voice';
import { Avatar, ErrorText, Notice, ProjectIcon, UnitIcon } from '../components/ui';
import { setOpenConversation } from '../alerts';
import { startCall } from '../callSession';
import { apiError, formatChatTime, formatLastSeen, formatMessageDay } from '../format';
import { KeyboardSafe, KeyboardScroll, LiftInput } from '../keyboard';
import { useLive } from '../live';
import { ConnectLoader, isOfflineError, mergePending, networkOnline, OfflineBanner, onSynced, queueMessage, readCache, subscribeOffline, writeCache } from '../offline';
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
  const [banner, setBanner] = useState('');
  const [forward, setForward] = useState(null);
  const [people, setPeople] = useState([]);
  const [forwardQuery, setForwardQuery] = useState('');
  const [chosen, setChosen] = useState([]);
  const emoji = useEmojiInsert(draft, setDraft);
  const [asDepartment, setAsDepartment] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reactLock = useRef(0);
  const loadSeq = useRef(0);
  const typingSent = useRef(0);
  const voiceRef = useRef(null);
  const holdRef = useRef(null);
  const [hold, setHold] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [typing, setTyping] = useState([]);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setError('');
    const saved = readCache(`thread:${id}`);
    if (saved) setThread((current) => current || mergePending(saved, id));
    try {
      const response = await api.get(`/hbms/conversations/${id}`);
      if (seq !== loadSeq.current) return;
      const data = response.data.data;
      setThread(mergePending(data, id));
      await writeCache(`thread:${id}`, data);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      if (!saved) setError(apiError(err, 'Could not open this conversation'));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeOffline(() => {
    setThread((current) => (current ? mergePending({
      ...current,
      messages: (current.messages || []).filter((message) => !String(message.id).startsWith('local-')),
    }, id) : current));
  }), [id]);

  useEffect(() => onSynced((ids) => {
    if (!ids.length || ids.includes(String(id))) load();
  }), [id, load]);

  useEffect(() => {
    setOpenConversation(id);
    setTyping([]);
    typingSent.current = 0;
    return () => {
      setOpenConversation(null);
      stopVoice();
      voiceRef.current?.cancel();
    };
  }, [id]);

  useEffect(() => {
    if (!id) return undefined;
    const text = draft.trim();
    if (!text) {
      if (!typingSent.current) return undefined;
      typingSent.current = 0;
      api.post(`/hbms/conversations/${id}/typing`, { typing: false }).catch(() => {});
      return undefined;
    }
    const now = Date.now();
    if (now - typingSent.current < 2000) return undefined;
    typingSent.current = now;
    api.post(`/hbms/conversations/${id}/typing`, { typing: true }).catch(() => {});
    return undefined;
  }, [draft, id]);

  useEffect(() => {
    if (!typing.length) return undefined;
    const wait = Math.max(250, Math.min(...typing.map((item) => item.until)) - Date.now());
    const timer = setTimeout(() => {
      const now = Date.now();
      setTyping((current) => current.filter((item) => item.until > now));
    }, wait);
    return () => clearTimeout(timer);
  }, [typing]);

  useLive(useCallback((event) => {
    if (event.type === 'link' && event.conversationId === id && event.messageId) {
      setThread((current) => {
        if (!current) return current;
        return {
          ...current,
          messages: (current.messages || []).map((message) => (
            message.id === event.messageId ? { ...message, link: event.link } : message
          )),
        };
      });
      return;
    }
    if (event.type === 'typing' && event.conversationId === id) {
      setTyping((current) => {
        const rest = current.filter((item) => Number(item.userId) !== Number(event.userId));
        if (!event.typing) return rest;
        return [...rest, { userId: event.userId, name: event.name || 'Someone', until: Date.now() + 4000 }];
      });
      return;
    }
    if (event.type === 'message' && event.conversationId === id && event.authorUserId) {
      setTyping((current) => current.filter((item) => Number(item.userId) !== Number(event.authorUserId)));
    }
    if (event.type === 'presence') {
      setThread((current) => {
        if (!current?.presence?.userId || current.presence.userId !== event.userId) return current;
        return {
          ...current,
          presence: {
            ...current.presence,
            online: Boolean(event.online),
            lastSeenAt: event.online ? null : event.lastSeenAt,
          },
        };
      });
      return;
    }
    if ((event.type === 'message' || event.type === 'reaction' || event.type === 'read' || event.type === 'delivered' || event.type === 'conversations') && event.conversationId === id) load();
  }, [id, load]));

  async function keepUntilOnline(body) {
    const localId = `local-${Date.now()}`;
    const createdAt = new Date().toISOString();
    await queueMessage({
      localId,
      conversationId: String(id),
      body,
      replyToId: reply?.id && !String(reply.id).startsWith('local-') ? reply.id : null,
      asDepartment: Boolean(asDepartment && thread?.canSpeakAsDepartment),
      forwarded: false,
      createdAt,
    });
    setDraft('');
    setReply(null);
  }

  async function send() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setError('');
    if (!networkOnline()) {
      await keepUntilOnline(body);
      setBusy(false);
      return;
    }
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
      if (!isOfflineError(err)) {
        setError(apiError(err, 'Could not send the message'));
        return;
      }
      await keepUntilOnline(body);
    } finally {
      setBusy(false);
    }
  }

  async function sendVoice(audio) {
    if (!audio?.uri || busy) return;
    setBusy(true);
    setError('');
    const payload = {
      localId: `local-${Date.now()}`,
      conversationId: String(id),
      body: '',
      audio,
      replyToId: reply?.id && !String(reply.id).startsWith('local-') ? reply.id : null,
      asDepartment: Boolean(asDepartment && thread?.canSpeakAsDepartment),
      forwarded: false,
      createdAt: new Date().toISOString(),
    };
    if (!networkOnline()) {
      await queueMessage(payload);
      setReply(null);
      setBusy(false);
      return;
    }
    try {
      const form = await voiceForm(audio, payload);
      const response = await api.post(`/hbms/conversations/${id}/voice`, form);
      setReply(null);
      setThread((current) => current && ({
        ...current,
        messages: [...(current.messages || []), response.data.data],
      }));
    } catch (err) {
      if (!isOfflineError(err)) {
        setError(apiError(err, 'Could not send the voice message'));
        return;
      }
      await queueMessage(payload);
      setReply(null);
    } finally {
      setBusy(false);
    }
  }

  async function beginVoice() {
    if (busy || holdRef.current) return;
    Keyboard.dismiss();
    setEmojiOpen(false);
    setPicked(null);
    holdRef.current = { dx: 0, locked: false };
    setHold({ dx: 0, locked: false });
    setElapsed(0);
    const result = await voiceRef.current?.start();
    if (!holdRef.current) return;
    if (!result?.ok) {
      holdRef.current = null;
      setHold(null);
      if (result?.error === 'denied') flash('Allow the microphone to send a voice message');
    }
  }

  function slideVoice(gesture) {
    const current = holdRef.current;
    if (!current || current.locked) return;
    const dx = Math.min(0, gesture.dx);
    const locked = gesture.dy < -64;
    current.dx = dx;
    current.locked = locked;
    setHold({ dx, locked });
  }

  async function endVoice() {
    const current = holdRef.current;
    if (!current || current.locked) return;
    const cancel = current.dx < -72;
    holdRef.current = null;
    setHold(null);
    setElapsed(0);
    const result = await voiceRef.current?.stop(cancel);
    if (!result || result.error === 'cancel') return;
    if (result.error === 'short') {
      flash('Hold to record a voice message');
      return;
    }
    if (result.uri) sendVoice(result);
  }

  function releaseVoice(audio) {
    holdRef.current = null;
    setHold(null);
    setElapsed(0);
    if (audio?.uri) sendVoice(audio);
  }

  async function sendHeldVoice() {
    holdRef.current = null;
    setHold(null);
    setElapsed(0);
    const result = await voiceRef.current?.stop(false);
    if (result?.uri) sendVoice(result);
    else if (result?.error === 'short') flash('Hold to record a voice message');
  }

  async function discardVoice() {
    holdRef.current = null;
    setHold(null);
    setElapsed(0);
    await voiceRef.current?.stop(true);
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

  function flash(text) {
    setBanner(text);
    setTimeout(() => setBanner(''), 1600);
  }

  async function copyMessage(message) {
    if (message.audio && !String(message.body || '').trim()) {
      setPicked(null);
      flash('Voice messages stay in the chat');
      return;
    }
    try {
      await Clipboard.setStringAsync(String(message.body || ''));
      setPicked(null);
      flash('Message copied');
    } catch (err) {
      setError(apiError(err, 'Could not copy that message'));
    }
  }

  async function openForward(message) {
    setForward(message);
    setPicked(null);
    setChosen([]);
    setForwardQuery('');
    setError('');
    try {
      const response = await api.get('/hbms/conversations');
      setPeople(response.data.data?.people || []);
    } catch (err) {
      setError(apiError(err, 'Could not load people'));
    }
  }

  function togglePerson(person) {
    setChosen((current) => (
      current.some((item) => item.userId === person.userId)
        ? current.filter((item) => item.userId !== person.userId)
        : [...current, person]
    ));
  }

  async function sendForward() {
    if (!forward || !chosen.length || busy) return;
    if (forward.audio && String(forward.id).startsWith('local-')) {
      setError('Send the voice message before forwarding it');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await Promise.all(chosen.map(async (person) => {
        const opened = await api.post('/hbms/conversations', { userId: person.userId });
        await api.post(`/hbms/conversations/${opened.data.data.id}/messages`, {
          body: forward.audio ? '' : forward.body,
          forwarded: true,
          forwardAudioId: forward.audio && !String(forward.id).startsWith('local-') ? forward.id : undefined,
        });
      }));
      const count = chosen.length;
      setForward(null);
      setChosen([]);
      flash(count === 1 ? 'Forwarded' : `Forwarded to ${count} people`);
    } catch (err) {
      setError(apiError(err, 'Could not forward the message'));
    } finally {
      setBusy(false);
    }
  }

  const forwardPeople = useMemo(() => {
    const text = forwardQuery.trim().toLowerCase();
    if (!text) return people;
    return people.filter((person) => `${person.name} ${person.detail || ''}`.toLowerCase().includes(text));
  }, [forwardQuery, people]);

  const rows = useMemo(() => threadRows(thread?.messages || [], thread?.kind), [thread?.kind, thread?.messages]);
  const status = headerStatus(thread, typing);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
    <KeyboardSafe>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <Ionicons name="chevron-back" size={28} color={colors.accent} />
        </Pressable>
        {thread?.kind === 'PROJECT' ? (
          <ProjectIcon name={thread.title} size={40} />
        ) : thread?.kind === 'DEPARTMENT' ? (
          <UnitIcon code={thread.unitCode} name={thread.unitName || thread.title} size={40} />
        ) : (
          <Avatar
            name={thread?.title || 'Chat'}
            size={40}
            employeeId={thread?.employeeId}
            photoKey={thread?.photoKey}
            onPress={thread?.employeeId ? () => router.push(`/person/${thread.employeeId}`) : undefined}
          />
        )}
        <Pressable
          accessibilityRole={thread?.employeeId ? 'button' : undefined}
          onPress={thread?.employeeId ? () => router.push(`/person/${thread.employeeId}`) : undefined}
          style={styles.headerText}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>{thread?.title || 'Chat'}</Text>
          {status.text ? (
            <Text style={[styles.headerMeta, status.online && styles.headerOnline]} numberOfLines={1}>{status.text}</Text>
          ) : null}
        </Pressable>
        {thread?.kind === 'DIRECT' && thread?.presence?.userId ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Video call"
              onPress={() => startCall({
                conversationId: String(id),
                name: thread.title,
                employeeId: thread.employeeId,
                photoKey: thread.photoKey,
              }, { video: true })}
              hitSlop={8}
              style={styles.call}
            >
              <Ionicons name="videocam" size={22} color={colors.accent} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Audio call"
              onPress={() => startCall({
                conversationId: String(id),
                name: thread.title,
                employeeId: thread.employeeId,
                photoKey: thread.photoKey,
              })}
              hitSlop={8}
              style={styles.call}
            >
              <Ionicons name="call" size={22} color={colors.accent} />
            </Pressable>
          </>
        ) : null}
        {thread?.canManage ? (
          <Pressable accessibilityRole="button" onPress={() => router.push(`/group/${thread.id}`)} hitSlop={8}>
            <Text style={styles.manage}>Manage</Text>
          </Pressable>
        ) : null}
      </View>
      <OfflineBanner />
      <ErrorText>{error}</ErrorText>
      {banner ? <Text style={styles.banner}>{banner}</Text> : null}
      <FlatList
        ref={list}
        style={styles.wallpaper}
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => list.current?.scrollToEnd?.({ animated: false })}
        ListEmptyComponent={thread ? <Notice>No messages yet.</Notice> : <ConnectLoader />}
        ListFooterComponent={typing.length ? <TypingBubble /> : null}
        renderItem={({ item }) => (
          item.type === 'day' ? (
            <View style={styles.dayWrap}>
              <Text style={styles.dayText}>{item.label}</Text>
            </View>
          ) : (
            <ChatMessage
              item={item}
              showAuthor={item.showAuthor}
              spaced={item.spaced}
              onOpen={() => openMessage(item)}
              onReply={() => startReply(item)}
              onAuthor={item.authorEmployeeId ? () => router.push(`/person/${item.authorEmployeeId}`) : undefined}
            />
          )
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
                <Pressable accessibilityRole="button" onPress={() => copyMessage(picked)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>Copy</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => openForward(picked)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>Forward</Text>
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
                <Text style={styles.replyBody} numberOfLines={1}>{voiceLabel(reply)}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cancel reply" onPress={() => setReply(null)} hitSlop={8}>
                <Text style={styles.replyClose}>✕</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.composer}>
            {hold?.locked ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Delete voice message" onPress={discardVoice} style={styles.trash}>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
              </Pressable>
            ) : null}
            {hold ? <RecordingBar elapsed={elapsed} dx={hold.dx} locked={hold.locked} /> : (
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
            )}
            {hold?.locked ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Send voice message" onPress={sendHeldVoice} style={styles.send}>
                <Ionicons name="send" size={18} color={colors.onAccent} style={styles.sendIcon} />
              </Pressable>
            ) : draft.trim() && !hold ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={send} disabled={busy} style={[styles.send, busy && styles.sendOff]}>
                <Ionicons name="send" size={18} color={colors.onAccent} style={styles.sendIcon} />
              </Pressable>
            ) : (
              <MicButton onStart={beginVoice} onMove={slideVoice} onEnd={endVoice} />
            )}
          </View>
          <VoiceRecorder ref={voiceRef} onTick={setElapsed} onAutoSend={releaseVoice} />
          {picked ? <EmojiPanel onPick={(symbol) => reactTo(picked, symbol)} /> : null}
          {emojiOpen && !picked ? <EmojiPanel onPick={emoji.insert} /> : null}
        </View>
      )}
    </KeyboardSafe>
    <Modal visible={Boolean(forward)} animationType="slide" onRequestClose={() => setForward(null)}>
      <SafeAreaView style={styles.forwardScreen} edges={['top', 'bottom']}>
        <View style={styles.forwardHeader}>
          <Pressable accessibilityRole="button" onPress={() => setForward(null)} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Text style={styles.forwardTitle}>Forward</Text>
          <View style={styles.headerBalance} />
        </View>
        <KeyboardScroll style={styles.forwardList} contentContainerStyle={styles.forwardContent}>
          <LiftInput
            value={forwardQuery}
            onChangeText={setForwardQuery}
            placeholder="Search people"
            placeholderTextColor={colors.faint}
            style={styles.forwardSearch}
            autoCapitalize="none"
          />
          <Text style={styles.forwardPreview} numberOfLines={2}>{voiceLabel(forward)}</Text>
          {forwardPeople.map((person) => {
            const selected = chosen.some((item) => item.userId === person.userId);
            return (
              <Pressable key={person.userId} accessibilityRole="button" onPress={() => togglePerson(person)} style={styles.personRow}>
                <Avatar name={person.name} employeeId={person.employeeId} photoKey={person.photoKey} />
                <View style={styles.personBody}>
                  <Text style={styles.personName} numberOfLines={1}>{person.name}</Text>
                  {person.detail ? <Text style={styles.personDetail} numberOfLines={1}>{person.detail}</Text> : null}
                </View>
                <View style={[styles.check, selected && styles.checkOn]}>
                  {selected ? <Ionicons name="checkmark" size={18} color={colors.onAccent} /> : null}
                </View>
              </Pressable>
            );
          })}
          {forwardPeople.length === 0 ? <Notice>No one matches that search.</Notice> : null}
        </KeyboardScroll>
        <View style={styles.forwardFooter}>
          <Pressable
            accessibilityRole="button"
            onPress={sendForward}
            disabled={!chosen.length || busy}
            style={[styles.sendBar, (!chosen.length || busy) && styles.sendBarOff]}
          >
            <Text style={styles.sendBarText}>{busy ? 'Sending…' : chosen.length ? `Send to ${chosen.length}` : 'Select people'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.chat },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  back: { width: 34, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, paddingLeft: 6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  headerMeta: { marginTop: 1, fontSize: 13, color: colors.muted },
  headerOnline: { color: colors.accent, fontWeight: '600' },
  banner: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: colors.accentDark,
    color: colors.onAccent,
    overflow: 'hidden',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
  },
  dayWrap: { alignSelf: 'center', marginVertical: 10, backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  dayText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  manage: { color: colors.accentDark, fontSize: 14, fontWeight: '700', paddingHorizontal: 8 },
  call: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  wallpaper: { flex: 1, backgroundColor: colors.chat },
  list: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 12 },
  message: { maxWidth: '82%' },
  messageMine: { alignSelf: 'flex-end' },
  messageTheirs: { alignSelf: 'flex-start' },
  messageSpaced: { marginTop: 8 },
  messageTight: { marginTop: 2 },
  messageReacted: { marginBottom: 4 },
  bubble: { borderRadius: 12, paddingHorizontal: 8, paddingTop: 6, paddingBottom: 4 },
  bubbleLink: { minWidth: 250, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 2, overflow: 'hidden' },
  linkInset: { paddingHorizontal: 10 },
  preview: { width: '100%' },
  previewImage: { width: '100%', height: 148, backgroundColor: '#d5ddd8' },
  previewCopy: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8 },
  previewMine: { backgroundColor: '#c5ddd4' },
  previewTheirs: { backgroundColor: '#f0f2f5' },
  previewTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  previewBody: { marginTop: 2, fontSize: 13, lineHeight: 18, color: colors.muted },
  previewDomain: { marginTop: 4, fontSize: 12, color: colors.faint },
  link: { color: '#027eb5', textDecorationLine: 'underline' },
  quote: { borderLeftWidth: 3, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4 },
  quoteMine: { backgroundColor: colors.accentMuted, borderLeftColor: colors.accentDark },
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
  actionButtons: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, paddingBottom: 6 },
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
  forwarded: { fontSize: 12, fontStyle: 'italic', color: colors.muted, marginBottom: 2 },
  body: { fontSize: 15, lineHeight: 20, color: colors.text },
  expired: { fontSize: 14, lineHeight: 20, fontStyle: 'italic', color: colors.muted },
  forwardScreen: { flex: 1, backgroundColor: colors.bg },
  forwardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  cancelBtn: {
    minWidth: 88,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chip,
  },
  cancelBtnText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  headerBalance: { width: 88 },
  forwardTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  forwardList: { flex: 1 },
  forwardContent: { paddingHorizontal: 16, paddingBottom: 16 },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  personBody: { flex: 1 },
  personName: { fontSize: 16, fontWeight: '700', color: colors.text },
  personDetail: { marginTop: 2, fontSize: 13, color: colors.muted },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  forwardFooter: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  sendBar: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBarOff: { opacity: 0.45 },
  sendBarText: { color: colors.onAccent, fontSize: 16, fontWeight: '800' },
  forwardSearch: {
    backgroundColor: colors.chip,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
  },
  forwardPreview: { color: colors.muted, fontSize: 13, marginBottom: 12 },
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
    paddingBottom: 8,
    alignItems: 'flex-end',
    backgroundColor: colors.chat,
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
  trash: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.45 },
  sendIcon: { marginLeft: 2 },
  swipeHint: { position: 'absolute', left: 0, top: 0, bottom: 0, justifyContent: 'center' },
  typingBubble: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.bubbleTheirs,
    borderRadius: 12,
    borderBottomLeftRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingDots: { color: colors.muted, fontSize: 18, letterSpacing: 2, lineHeight: 18 },
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

function isLinkText(value) {
  return /^https?:\/\//i.test(value) || /^www\./i.test(value);
}

function linkHref(value) {
  const trimmed = String(value || '').replace(/[),.;!?]+$/, '');
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function MessageBody({ body, onPressIn, onOpen }) {
  const parts = String(body || '').split(/(https?:\/\/[^\s]+|\bwww\.[^\s]+)/gi);
  return (
    <Text style={styles.body}>
      {parts.map((part, index) => (
        isLinkText(part) ? (
          <Text
            key={`${part}-${index}`}
            style={styles.link}
            onPressIn={onPressIn}
            onPress={() => onOpen(linkHref(part))}
          >
            {part}
          </Text>
        ) : <Text key={`${index}`}>{part}</Text>
      ))}
    </Text>
  );
}

function LinkCard({ link, mine, onPressIn, onOpen }) {
  const [failed, setFailed] = useState(false);
  if (!link?.url) return null;
  return (
    <Pressable
      accessibilityRole="link"
      onPressIn={onPressIn}
      onPress={() => onOpen(link.url)}
      style={styles.preview}
    >
      {link.image && !failed ? (
        <Image source={{ uri: link.image }} style={styles.previewImage} resizeMode="cover" onError={() => setFailed(true)} />
      ) : null}
      <View style={[styles.previewCopy, mine ? styles.previewMine : styles.previewTheirs]}>
        <Text style={styles.previewTitle} numberOfLines={2}>{link.title || link.domain}</Text>
        {link.description ? <Text style={styles.previewBody} numberOfLines={2}>{link.description}</Text> : null}
        <Text style={styles.previewDomain} numberOfLines={1}>{link.domain}</Text>
      </View>
    </Pressable>
  );
}

function TypingBubble() {
  return (
    <View style={styles.typingBubble}>
      <Text style={styles.typingDots}>•••</Text>
    </View>
  );
}

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

function typingText(kind, people) {
  if (!people.length) return '';
  if (kind === 'DIRECT') return 'typing…';
  const names = people.map((person) => String(person.name || 'Someone').split(' ')[0]);
  if (names.length === 1) return `${names[0]} is typing…`;
  return `${names.slice(0, 2).join(' and ')} are typing…`;
}

function headerStatus(thread, typing) {
  if (!thread) return { text: '', online: false };
  const writing = typingText(thread.kind, typing || []);
  if (writing) return { text: writing, online: true };
  if (thread.kind === 'DIRECT') {
    if (thread.presence?.online) return { text: 'online', online: true };
    if (thread.presence?.lastSeenAt) return { text: formatLastSeen(thread.presence.lastSeenAt), online: false };
    return { text: 'offline', online: false };
  }
  return { text: thread.detail || '', online: false };
}

function threadRows(messages, kind) {
  const rows = [];
  let lastDay = '';
  let lastKey = null;
  messages.forEach((message) => {
    const day = formatMessageDay(message.createdAt);
    if (day && day !== lastDay) {
      rows.push({ type: 'day', id: `day-${message.id}`, label: day });
      lastDay = day;
      lastKey = null;
    }
    const key = message.mine ? 'me' : (message.authorEmployeeId || message.author || 'them');
    rows.push({
      ...message,
      type: 'message',
      showAuthor: kind !== 'DIRECT' && !message.mine && key !== lastKey,
      spaced: key !== lastKey,
    });
    lastKey = key;
  });
  return rows;
}

function ChatMessage({ item, showAuthor, spaced, onOpen, onReply, onAuthor }) {
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
  const linkGuard = useRef(false);

  function beginLink() {
    linkGuard.current = true;
  }

  function openLink(url) {
    linkGuard.current = true;
    Linking.openURL(url).catch(() => {});
    setTimeout(() => {
      linkGuard.current = false;
    }, 400);
  }

  return (
    <View style={[styles.message, item.mine ? styles.messageMine : styles.messageTheirs, spaced ? styles.messageSpaced : styles.messageTight, item.reactions?.length ? styles.messageReacted : null]}>
      <Animated.View style={[styles.swipeHint, { opacity: hintOpacity }]} pointerEvents="none">
        <Text style={styles.swipeIcon}>↩</Text>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX: drag }] }} {...pan.panHandlers}>
        <Pressable onPress={() => { if (!linkGuard.current) onOpen(); }} style={[styles.bubble, item.mine ? styles.mine : styles.theirs, item.link && styles.bubbleLink]}>
          {showAuthor ? (
            <View style={item.link ? styles.linkInset : null}>
              {onAuthor ? (
                <Pressable onPress={onAuthor}>
                  <Text style={styles.author}>{item.asDepartment ? item.departmentName : item.author}</Text>
                </Pressable>
              ) : <Text style={styles.author}>{item.asDepartment ? item.departmentName : item.author}</Text>}
            </View>
          ) : null}
          {item.reply ? (
            <View style={[styles.quote, item.mine ? styles.quoteMine : styles.quoteTheirs, item.link && styles.linkInset]}>
              <Text style={styles.quoteAuthor} numberOfLines={1}>{item.reply.mine ? 'You' : item.reply.author}</Text>
              <Text style={styles.quoteBody} numberOfLines={2}>{voiceLabel(item.reply)}</Text>
            </View>
          ) : null}
          {item.link ? <LinkCard link={item.link} mine={item.mine} onPressIn={beginLink} onOpen={openLink} /> : null}
          <View style={item.link ? styles.linkInset : null}>
            {item.forwarded ? <Text style={styles.forwarded}>Forwarded</Text> : null}
            {item.audio ? <VoiceNote id={item.id} audio={item.audio} onPressIn={beginLink} /> : null}
            {item.body === 'Voice message expired' && !item.audio ? (
              <Text style={styles.expired}>Voice message expired</Text>
            ) : item.body ? (
              <MessageBody body={item.body} onPressIn={beginLink} onOpen={openLink} />
            ) : null}
            <View style={styles.meta}>
            <Text style={styles.time}>{formatChatTime(item.createdAt)}</Text>
            {item.mine && item.pending ? <Ionicons name="time-outline" size={15} color="#8696a0" /> : null}
            {item.mine && !item.pending ? <ReadTicks status={item.receipt} /> : null}
            </View>
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
