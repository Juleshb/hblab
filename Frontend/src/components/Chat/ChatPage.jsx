import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import hbmsApi, { apiError, formatWhen } from '../Admin/HBMS/api';
import { useAuth } from '../../assets/context/AuthContext.jsx';
import EmojiPicker, { QUICK_REACTIONS } from './EmojiPicker';
import { rememberEmoji } from './emojis';
import { apiOrigin } from '../../apiOrigin';
import {
  acceptCall,
  connectDesk,
  deskEpoch,
  hangup,
  rejectCall,
  startCall,
  subscribeDesk,
  subscribeMedia,
  setVideoEffect,
  switchToVideo,
  toggleCamera,
  toggleMute,
  toggleShare,
  VIDEO_EFFECTS,
} from './webCall';

const TABS = [
  { id: 'chats', label: 'Chats', icon: 'carbon:chat' },
  { id: 'teams', label: 'Teams', icon: 'carbon:enterprise' },
  { id: 'work', label: 'Work', icon: 'carbon:task' },
  { id: 'updates', label: 'Updates', icon: 'carbon:notification' },
];

const TONES = ['#2e6b57', '#53bdeb', '#7f66ff', '#ff7a59', '#e67e22', '#548675'];

const STATUS = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  DONE: 'Completed',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
};

function when(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function presenceLine(presence) {
  if (!presence) return '';
  if (presence.online) return 'Online';
  if (!presence.lastSeenAt) return '';
  return `Last seen ${when(presence.lastSeenAt)}`;
}

function typingLine(kind, people) {
  if (!people?.length) return '';
  if (kind === 'DIRECT') return 'typing…';
  const names = people.map((item) => item.name).filter(Boolean);
  if (names.length === 1) return `${names[0]} is typing…`;
  return `${names.slice(0, 2).join(' and ')} are typing…`;
}

function faceColor(name) {
  const text = String(name || '');
  const index = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return TONES[index % TONES.length];
}

const OPEN_WORK = new Set(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED']);

function matchesWork(task, filter) {
  if (filter === 'review') return task.status === 'IN_REVIEW';
  if (filter === 'due') {
    if (!OPEN_WORK.has(task.status) || !task.dueDate) return false;
    return new Date(task.dueDate).getTime() <= Date.now() + 14 * 86400000;
  }
  return OPEN_WORK.has(task.status);
}

function isChatNotice(notice) {
  if (notice?.kind === 'CONVERSATION') return true;
  return String(notice?.entityType || '').toLowerCase().includes('conversation');
}

function groupUpdates(notices) {
  const groups = new Map();
  for (const notice of notices || []) {
    if (isChatNotice(notice)) continue;
    const key = notice.entityId ? `${notice.entityType || 'item'}~${notice.entityId}` : `notice~${notice.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(notice);
  }
  return [...groups.values()].map((items) => {
    const sorted = [...items].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    const latest = sorted[0];
    const key = latest.entityId ? `${latest.entityType || 'item'}~${latest.entityId}` : `notice~${latest.id}`;
    const kind = latest.kind;
    return {
      key,
      title: String(latest.title || 'Update').replace(/^(Task assigned|Task updated|Overdue|Deadline|Meeting):\s*/i, '').trim() || 'Update',
      kind,
      bucket: kind === 'MEETING' ? 'meetings' : kind === 'ANNOUNCEMENT' ? 'news' : 'tasks',
      items: sorted,
      unread: sorted.filter((item) => !item.readAt).length,
      createdAt: latest.createdAt,
    };
  }).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function linkify(text) {
  const parts = String(text || '').split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => (
    part.startsWith('http')
      ? <a key={index} href={part} target="_blank" rel="noreferrer" className="underline">{part}</a>
      : <span key={index}>{part}</span>
  ));
}

export default function ChatPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('chats');
  const [filter, setFilter] = useState('all');
  const [picking, setPicking] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [people, setPeople] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState(null);
  const [calls, setCalls] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [callId, setCallId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [updateKey, setUpdateKey] = useState('');
  const [workFilter, setWorkFilter] = useState('open');
  const [updateFilter, setUpdateFilter] = useState('all');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [typing, setTyping] = useState([]);
  const recorder = useRef(null);
  const typingSent = useRef(0);
  const activeRef = useRef('');

  const loadLists = async () => {
    const [chats, history, notices, work] = await Promise.all([
      hbmsApi.get('/conversations'),
      hbmsApi.get('/calls').catch(() => ({ data: { data: [] } })),
      hbmsApi.get('/notifications').catch(() => ({ data: { data: [] } })),
      hbmsApi.get('/tasks', { params: { limit: 100 } }).catch(() => ({ data: { data: [] } })),
    ]);
    setConversations(chats.data.data?.conversations || []);
    setPeople(chats.data.data?.people || []);
    setCalls(history.data.data || []);
    setUpdates(notices.data.data || []);
    setTasks(work.data.data || []);
  };

  const openThread = async (id) => {
    if (!id) {
      setThread(null);
      return;
    }
    const response = await hbmsApi.get(`/conversations/${id}`);
    setThread(response.data.data);
  };

  useEffect(() => { setReply(null); setTyping([]); typingSent.current = 0; }, [activeId]);
  activeRef.current = activeId;

  useEffect(() => {
    let active = true;
    loadLists()
      .catch((err) => { if (active) setError(apiError(err, 'Could not open chat')); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!activeId) return undefined;
    const text = draft.trim();
    if (!text) {
      if (!typingSent.current) return undefined;
      typingSent.current = 0;
      hbmsApi.post(`/conversations/${activeId}/typing`, { typing: false }).catch(() => {});
      return undefined;
    }
    const now = Date.now();
    if (now - typingSent.current < 2000) return undefined;
    typingSent.current = now;
    hbmsApi.post(`/conversations/${activeId}/typing`, { typing: true }).catch(() => {});
    return undefined;
  }, [draft, activeId]);

  useEffect(() => {
    if (!typing.length) return undefined;
    const wait = Math.max(250, Math.min(...typing.map((item) => item.until)) - Date.now());
    const timer = setTimeout(() => {
      const now = Date.now();
      setTyping((current) => current.filter((item) => item.until > now));
    }, wait);
    return () => clearTimeout(timer);
  }, [typing]);

  useEffect(() => {
    if (!token) return undefined;
    connectDesk(token);
    const stopLive = subscribeDesk((event) => {
      const openId = activeRef.current;
      if (!event?.type) return;
      if (event.type === 'link' && event.conversationId === openId && event.messageId) {
        setThread((current) => {
          if (!current || current.id !== openId) return current;
          return {
            ...current,
            messages: (current.messages || []).map((message) => (
              message.id === event.messageId ? { ...message, link: event.link } : message
            )),
          };
        });
        return;
      }
      if (event.type === 'typing' && event.conversationId === openId) {
        setTyping((current) => {
          const rest = current.filter((item) => Number(item.userId) !== Number(event.userId));
          if (!event.typing) return rest;
          return [...rest, { userId: event.userId, name: event.name || 'Someone', until: Date.now() + 4000 }];
        });
        return;
      }
      if (event.type === 'presence') {
        setThread((current) => {
          if (!current?.presence?.userId || Number(current.presence.userId) !== Number(event.userId)) return current;
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
      if (event.type === 'message' && event.conversationId === openId && event.authorUserId) {
        setTyping((current) => current.filter((item) => Number(item.userId) !== Number(event.authorUserId)));
      }
      if (['message', 'conversations', 'inbox', 'calls', 'call', 'reaction', 'read', 'delivered'].includes(event.type)) {
        loadLists().catch(() => {});
        if (event.conversationId && event.conversationId === openId) openThread(openId).catch(() => {});
      }
    });
    return () => stopLive();
  }, [token, deskEpoch]);

  const chats = useMemo(() => conversations.filter((item) => item.kind === 'DIRECT'), [conversations]);
  const teams = useMemo(() => conversations.filter((item) => item.kind === 'DEPARTMENT' || item.kind === 'PROJECT'), [conversations]);
  const rows = (section === 'teams' ? teams : chats).filter((item) => filter === 'all' || item.unread > 0);
  const updateGroups = useMemo(() => groupUpdates(updates), [updates]);
  const visibleUpdates = updateGroups.filter((group) => updateFilter === 'all' || group.bucket === updateFilter);
  const workRows = useMemo(() => tasks.filter((task) => matchesWork(task, workFilter)), [tasks, workFilter]);
  const unreadChats = chats.reduce((sum, item) => sum + (item.unread || 0), 0);
  const unreadTeams = teams.reduce((sum, item) => sum + (item.unread || 0), 0);
  const unreadUpdates = updateGroups.reduce((sum, group) => sum + group.unread, 0);
  const openWork = tasks.filter((task) => !['DONE', 'CANCELLED'].includes(task.status)).length;

  async function choose(id, keepSection = false) {
    setActiveId(id);
    if (!keepSection) setSection(conversations.find((item) => item.id === id)?.kind === 'DIRECT' ? 'chats' : section);
    try {
      await openThread(id);
      await loadLists();
    } catch (err) {
      setError(apiError(err, 'Could not open that conversation'));
    }
  }

  async function beginChat(userId) {
    try {
      const response = await hbmsApi.post('/conversations', { userId: Number(userId) });
      const id = response.data.data.id;
      setSection('chats');
      setActiveId(id);
      await openThread(id);
      await loadLists();
    } catch (err) {
      setError(apiError(err, 'Could not start the chat'));
    }
  }

  async function forwardTo(message, selected) {
    await Promise.all(selected.map(async (person) => {
      const opened = await hbmsApi.post('/conversations', { userId: Number(person.userId) });
      await hbmsApi.post(`/conversations/${opened.data.data.id}/messages`, {
        body: message.audio ? '' : String(message.body || '').trim(),
        forwarded: true,
        ...(message.audio ? { forwardAudioId: message.id } : {}),
      });
    }));
    await loadLists();
  }

  async function react(message, emoji) {
    if (!activeId || !message?.id) return;
    try {
      await hbmsApi.post(`/conversations/${activeId}/messages/${message.id}/reactions`, { emoji });
      await openThread(activeId);
    } catch (err) {
      setError(apiError(err, 'Could not add that emoji'));
    }
  }

  async function send(event) {
    event.preventDefault();
    if (!draft.trim() || !activeId) return;
    setSending(true);
    try {
      const response = await hbmsApi.post(`/conversations/${activeId}/messages`, {
        body: draft.trim(),
        replyToId: reply?.id || undefined,
      });
      setThread((current) => current && { ...current, messages: [...current.messages, response.data.data] });
      setDraft('');
      setReply(null);
      await loadLists();
    } catch (err) {
      setError(apiError(err, 'Could not send the message'));
    } finally {
      setSending(false);
    }
  }

  async function toggleVoice() {
    if (!activeId) return;
    if (recorder.current) {
      const { stop } = recorder.current;
      recorder.current = null;
      setRecording(false);
      const blob = await stop();
      if (!blob || blob.size < 800) return;
      const form = new FormData();
      form.append('audio', blob, 'voice.webm');
      form.append('duration', '0');
      if (reply?.id) form.append('replyToId', reply.id);
      const response = await hbmsApi.post(`/conversations/${activeId}/voice`, form);
      setThread((current) => current && { ...current, messages: [...current.messages, response.data.data] });
      setReply(null);
      await loadLists();
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Allow the microphone to send a voice message');
      return;
    }
    const media = new MediaRecorder(stream);
    const chunks = [];
    media.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    media.start();
    recorder.current = {
      stop: () => new Promise((resolve) => {
        media.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          resolve(new Blob(chunks, { type: media.mimeType || 'audio/webm' }));
        };
        media.stop();
      }),
    };
    setRecording(true);
  }

  async function markRead(item) {
    if (item.readAt) return;
    await hbmsApi.post(`/notifications/${item.id}/read`).catch(() => {});
    setUpdates((current) => current.map((notice) => (notice.id === item.id ? { ...notice, readAt: new Date().toISOString() } : notice)));
  }

  const counts = { chats: unreadChats, teams: unreadTeams, updates: unreadUpdates, work: openWork };
  const threadMatches = thread && (
    ((section === 'chats' || section === 'calls') && thread.kind === 'DIRECT')
    || (section === 'teams' && thread.kind !== 'DIRECT')
  );
  const showThread = Boolean((section === 'chats' || section === 'teams' || section === 'calls') && activeId && threadMatches);
  const selectedTask = tasks.find((task) => task.id === taskId) || null;
  const selectedUpdate = updateGroups.find((group) => group.key === updateKey) || null;
  const showWork = section === 'work' && selectedTask;
  const showUpdate = section === 'updates' && selectedUpdate;
  const showDetail = showThread || showWork || showUpdate;

  return (
    <div className="flex h-screen bg-white text-[#111b21]">
      <section className={`${showDetail ? 'hidden md:flex' : 'flex'} relative w-full max-w-[480px] flex-col border-r border-[#e9edef]`}>
        <div className="flex-1 overflow-y-auto px-4 pb-28">
          {error ? <p className="mb-2 text-sm text-[#ea0038]">{error}</p> : null}
          {section === 'chats' || section === 'teams' ? (
            <ConversationList
              title={section === 'chats' ? 'Chats' : 'Teams'}
              rows={rows}
              activeId={activeId}
              filter={filter}
              personal={section === 'chats'}
              onFilter={setFilter}
              onCalls={() => setSection('calls')}
              onChoose={choose}
              onClose={() => navigate(-1)}
            />
          ) : null}
          {section === 'calls' ? <CallsPane calls={calls} activeId={callId} onBack={() => setSection('chats')} onCall={(item) => startCall(item, { video: Boolean(item.video) })} onOpen={(item) => { setCallId(item.id); choose(item.conversationId, true); }} /> : null}
          {section === 'updates' ? (
            <UpdatesPane
              groups={visibleUpdates}
              filter={updateFilter}
              activeKey={updateKey}
              onFilter={setUpdateFilter}
              onClose={() => navigate(-1)}
              onOpen={(group) => {
                setUpdateKey(group.key);
                group.items.filter((item) => !item.readAt).forEach(markRead);
              }}
            />
          ) : null}
          {section === 'work' ? (
            <WorkPane
              tasks={workRows}
              filter={workFilter}
              activeId={taskId}
              onFilter={setWorkFilter}
              onClose={() => navigate(-1)}
              onOpen={setTaskId}
            />
          ) : null}
        </div>
        {section === 'chats' ? (
          <button type="button" aria-label="New chat" onClick={() => setPicking(true)} className="absolute bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#2e6b57] text-3xl font-light text-white shadow-lg">+</button>
        ) : null}
        <PhoneTabs section={section === 'calls' ? 'chats' : section} counts={counts} onChange={(id) => { setSection(id); setFilter('all'); }} />
        {picking ? (
          <PeopleSheet
            people={people}
            onClose={() => setPicking(false)}
            onStart={(userId) => beginChat(userId).then(() => setPicking(false))}
          />
        ) : null}
      </section>
      <section className={`${showDetail ? 'flex' : 'hidden md:flex'} relative min-w-0 flex-1 flex-col ${showThread ? 'bg-[#efeae2]' : 'bg-white'}`}>
        {showThread ? (
          <ThreadPane
            thread={thread}
            draft={draft}
            reply={reply}
            people={people}
            sending={sending}
            recording={recording}
            onBack={() => setActiveId('')}
            onDraft={setDraft}
            onReply={setReply}
            onSend={send}
            onVoice={toggleVoice}
            onReact={react}
            onForward={forwardTo}
            typing={typing}
            onCall={() => startCall({ conversationId: thread.id, name: thread.title, employeeId: thread.employeeId, photoKey: thread.photoKey })}
            onVideo={() => startCall({ conversationId: thread.id, name: thread.title, employeeId: thread.employeeId, photoKey: thread.photoKey }, { video: true })}
          />
        ) : null}
        {showWork ? <TaskPane task={selectedTask} onBack={() => setTaskId('')} /> : null}
        {showUpdate ? <UpdatePane group={selectedUpdate} onBack={() => setUpdateKey('')} /> : null}
        {!showDetail ? (
          <div className="m-auto hidden max-w-xs px-6 text-center text-[#667781] md:block">
            <p className="text-lg font-semibold text-[#111b21]">Hb-lab</p>
            <p className="mt-2 text-sm">
              {section === 'work' ? 'Choose a task to see it here.' : section === 'updates' ? 'Choose an update to read it here.' : section === 'calls' ? 'Choose a call to open the chat.' : 'Choose a chat to start messaging.'}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

const photoCache = new Map();
const photoWait = new Map();

function usePhoto(employeeId, photoKey) {
  const key = employeeId && photoKey ? `${employeeId}:${photoKey}` : '';
  const [src, setSrc] = useState(key ? photoCache.get(key) || '' : '');
  useEffect(() => {
    if (!key) {
      setSrc('');
      return undefined;
    }
    const saved = photoCache.get(key);
    if (saved) {
      setSrc(saved);
      return undefined;
    }
    let active = true;
    const pending = photoWait.get(key) || hbmsApi.get(`/employees/${employeeId}/photo`, { responseType: 'blob' })
      .then((response) => {
        const url = URL.createObjectURL(response.data);
        photoCache.set(key, url);
        return url;
      })
      .catch(() => '');
    photoWait.set(key, pending);
    pending.then((url) => { if (active) setSrc(url || ''); });
    return () => { active = false; };
  }, [key, employeeId]);
  return src;
}

export function Face({ name, kind, employeeId, photoKey, big }) {
  const src = usePhoto(employeeId, photoKey);
  const icon = kind === 'PROJECT' ? 'carbon:folder' : kind === 'DEPARTMENT' ? 'carbon:enterprise' : '';
  const box = big ? 'h-40 w-40 text-5xl' : 'h-12 w-12 text-lg';
  if (src && !icon) {
    return <img src={src} alt="" className={`${box} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span className={`flex ${box} shrink-0 items-center justify-center rounded-full font-bold text-white`} style={{ backgroundColor: faceColor(name) }}>
      {icon ? <Icon icon={icon} className={big ? 'h-16 w-16' : 'h-6 w-6'} /> : String(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

function PhoneTabs({ section, counts, onChange }) {
  return (
    <nav className="absolute inset-x-4 bottom-3 z-30 flex h-16 items-center justify-around rounded-full border border-white/80 bg-white/75 shadow-[0_10px_22px_rgba(25,58,47,0.18)] backdrop-blur-xl">
      {TABS.map((tab) => {
        const active = section === tab.id;
        return (
          <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className="relative flex min-w-14 flex-col items-center text-[11px] font-semibold text-[#214d3e]">
            <span className={`flex h-7 min-w-12 items-center justify-center rounded-full px-3 ${active ? 'bg-[#c4d6d0]' : ''}`}>
              <Icon icon={tab.icon} className="h-[22px] w-[22px]" />
            </span>
            {tab.label}
            {counts[tab.id] > 0 ? <span className="absolute -top-1 right-1 rounded-full bg-[#2e6b57] px-1.5 text-[10px] font-bold text-white">{counts[tab.id]}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

function ConversationList({ title, rows, activeId, filter, personal, onFilter, onCalls, onChoose, onClose }) {
  return (
    <div>
      <div className="flex items-center gap-2 pt-3">
        <button type="button" aria-label="Back" onClick={onClose} className="text-[#2e6b57]">
          <Icon icon="carbon:chevron-left" className="h-7 w-7" />
        </button>
        <h1 className="flex-1 text-[28px] font-bold tracking-tight">{title}</h1>
      </div>
      <div className="mb-2 mt-3 flex flex-wrap gap-2">
        {['all', 'unread'].map((id) => (
          <button key={id} type="button" onClick={() => onFilter(id)} className={`rounded-2xl px-3 py-1.5 text-[13px] font-semibold ${filter === id ? 'bg-[#d9e4e1] text-[#214d3e]' : 'bg-[#f0f2f5] text-[#667781]'}`}>
            {id === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
        {personal ? (
          <button type="button" onClick={onCalls} className="flex items-center gap-1.5 rounded-2xl bg-[#f0f2f5] px-3 py-1.5 text-[13px] font-bold text-[#214d3e]">
            <Icon icon="carbon:phone-filled" className="h-4 w-4" />
            Calls
          </button>
        ) : null}
      </div>
      <ul>
        {rows.length === 0 ? (
          <li className="py-6 text-sm leading-5 text-[#667781]">
            {personal ? 'Your personal chats show up here. Start one with the green button.' : 'Department chats and project groups show up here.'}
          </li>
        ) : rows.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onChoose(item.id)} className={`flex w-full items-center gap-3 py-2.5 text-left ${item.id === activeId ? 'bg-[#f7f8fa]' : ''}`}>
              <Face name={item.title} kind={item.kind} employeeId={item.employeeId} photoKey={item.photoKey} />
              <span className="min-w-0 flex-1 border-b border-[#e9edef] pb-2.5">
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-base font-semibold">{item.title}</span>
                  <span className={`shrink-0 text-xs ${item.unread ? 'font-semibold text-[#2e6b57]' : 'text-[#8696a0]'}`}>{when(item.lastAt)}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-[#667781]">{item.lastBody || item.detail || 'No messages yet'}</span>
                  {item.unread > 0 ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2e6b57] px-1.5 text-xs font-bold text-white">{item.unread}</span> : null}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function quoteText(message) {
  if (!message) return '';
  if (message.audio && !String(message.body || '').trim()) return 'Voice message';
  if (message.body === 'Voice message expired') return 'Voice message expired';
  return message.body || '';
}

function ReadTicks({ status }) {
  const read = status === 'read';
  const delivered = status === 'delivered' || read;
  const label = read ? 'Read' : delivered ? 'Delivered' : 'Sent';
  return (
    <span aria-label={label} className={`ml-1 text-[13px] font-bold leading-none tracking-tighter ${read ? 'text-[#53bdeb]' : 'text-[#8696a0]'}`}>
      {delivered ? '✓✓' : '✓'}
    </span>
  );
}

function ThreadPane({ thread, draft, reply, people, sending, recording, typing, onBack, onDraft, onReply, onSend, onVoice, onCall, onVideo, onReact, onForward }) {
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [reactingId, setReactingId] = useState('');
  const [menuId, setMenuId] = useState('');
  const [forwarding, setForwarding] = useState(null);
  const [chosen, setChosen] = useState([]);
  const [forwardQuery, setForwardQuery] = useState('');
  const [forwardingBusy, setForwardingBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const direct = thread.kind === 'DIRECT' && thread.presence?.userId;
  const writing = typingLine(thread.kind, typing);
  const status = writing || presenceLine(thread.presence);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [thread.id, thread.messages.length, typing?.length]);
  useEffect(() => {
    setEmojiOpen(false);
    setReactingId('');
    setMenuId('');
    setForwarding(null);
  }, [thread.id]);

  function flash(text) {
    setNotice(text);
    setTimeout(() => setNotice(''), 1600);
  }

  async function copyMessage(message) {
    if (message.audio && !String(message.body || '').trim()) {
      setMenuId('');
      flash('Voice messages stay in the chat');
      return;
    }
    try {
      await navigator.clipboard.writeText(String(message.body || ''));
      setMenuId('');
      flash('Message copied');
    } catch {
      flash('Could not copy that message');
    }
  }

  async function sendForward() {
    if (!forwarding || !chosen.length || forwardingBusy) return;
    setForwardingBusy(true);
    try {
      await onForward(forwarding, chosen);
      const count = chosen.length;
      setForwarding(null);
      setChosen([]);
      setForwardQuery('');
      flash(count === 1 ? 'Forwarded' : `Forwarded to ${count} people`);
    } catch {
      flash('Could not forward the message');
    } finally {
      setForwardingBusy(false);
    }
  }

  function insertEmoji(symbol) {
    const field = inputRef.current;
    const at = field?.selectionStart ?? draft.length;
    const next = `${draft.slice(0, at)}${symbol}${draft.slice(at)}`;
    const pos = at + symbol.length;
    onDraft(next);
    rememberEmoji(symbol);
    setTimeout(() => {
      field?.focus();
      field?.setSelectionRange(pos, pos);
    }, 0);
  }

  function pickEmoji(symbol) {
    rememberEmoji(symbol);
    if (reactingId) {
      const message = thread.messages.find((item) => item.id === reactingId);
      if (message) onReact(message, symbol);
      setReactingId('');
      setEmojiOpen(false);
      return;
    }
    insertEmoji(symbol);
  }
  return (
    <>
      <header className="flex items-center gap-2 border-b border-[#e9edef] bg-white px-2 py-2">
        <button type="button" aria-label="Back" onClick={onBack} className="text-[#2e6b57] md:hidden">
          <Icon icon="carbon:chevron-left" className="h-7 w-7" />
        </button>
        <Face name={thread.title} kind={thread.kind} employeeId={thread.employeeId} photoKey={thread.photoKey} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{thread.title}</p>
          {status ? <p className={`truncate text-[13px] ${writing || thread.presence?.online ? 'text-[#2e6b57]' : 'text-[#667781]'}`}>{status}</p> : <p className="truncate text-[13px] text-[#667781]">{thread.detail}</p>}
        </div>
        {direct ? (
          <>
            <button type="button" aria-label="Video call" onClick={onVideo} className="flex h-10 w-10 items-center justify-center text-[#2e6b57]">
              <Icon icon="carbon:video-filled" className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Audio call" onClick={onCall} className="flex h-10 w-10 items-center justify-center text-[#2e6b57]">
              <Icon icon="carbon:phone-filled" className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </header>
      <ul className="flex-1 space-y-1.5 overflow-y-auto bg-[#efeae2] px-3 py-3">
        {thread.messages.length === 0 && !typing?.length ? <li className="py-6 text-sm text-[#667781]">No messages yet.</li> : thread.messages.map((message) => (
          <li key={message.id} className={`group flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
            <div className="relative max-w-[78%]">
              <button type="button" aria-label="Message actions" onClick={() => { setMenuId(menuId === message.id ? '' : message.id); setReactingId(''); }} className="absolute -top-3 right-1 hidden h-7 w-7 items-center justify-center rounded-full bg-white text-[#667781] shadow-sm group-hover:flex">
                <Icon icon="carbon:chevron-down" className="h-4 w-4" />
              </button>
              <div
                className={`rounded-lg px-2 py-1 shadow-sm ${message.mine ? 'bg-[#d1deda]' : 'bg-white'}`}
                onClick={(event) => {
                  if (event.target.closest('a, audio, button')) return;
                  setMenuId(menuId === message.id ? '' : message.id);
                  setReactingId('');
                }}
              >
                {!message.mine ? <p className="text-xs font-semibold text-[#2e6b57]">{message.asDepartment ? message.departmentName : message.author}</p> : null}
                {message.reply ? (
                  <div className={`mb-1 rounded-md border-l-[3px] px-2 py-1 ${message.mine ? 'border-[#214d3e] bg-[#c4d6d0]' : 'border-[#2e6b57] bg-[#f0f2f5]'}`}>
                    <p className="truncate text-xs font-bold text-[#214d3e]">{message.reply.mine ? 'You' : message.reply.author}</p>
                    <p className="line-clamp-2 text-xs text-[#667781]">{message.reply.body || 'Voice message'}</p>
                  </div>
                ) : null}
                {message.forwarded ? <p className="text-xs italic text-[#667781]">Forwarded</p> : null}
                {message.audio?.url ? <audio controls preload="none" src={`${apiOrigin}${message.audio.url}`} className="mt-1 h-8 max-w-full" /> : null}
                {message.body === 'Voice message expired' && !message.audio ? <p className="text-sm italic text-[#667781]">Voice message expired</p> : null}
                {message.body && message.body !== 'Voice message expired' ? <p className="text-[15px] leading-5">{linkify(message.body)}</p> : null}
                <p className="flex items-center justify-end text-[11px] text-[#667781]">
                  {formatWhen(message.createdAt)}
                  {message.mine ? <ReadTicks status={message.receipt} /> : null}
                </p>
              </div>
              {menuId === message.id ? (
                <div className={`mt-1 min-w-36 rounded-xl bg-white py-1 shadow-lg ${message.mine ? 'ml-auto' : ''}`}>
                  <div className="flex justify-around px-2 py-1">
                    {QUICK_REACTIONS.map((symbol) => (
                      <button key={symbol} type="button" aria-label={symbol} onClick={() => { onReact(message, symbol); setMenuId(''); }} className="text-xl">{symbol}</button>
                    ))}
                  </div>
                  <button type="button" onClick={() => { onReply(message); setMenuId(''); inputRef.current?.focus(); }} className="block w-full px-3 py-1.5 text-left text-sm font-semibold hover:bg-[#f7f8fa]">Reply</button>
                  <button type="button" onClick={() => copyMessage(message)} className="block w-full px-3 py-1.5 text-left text-sm font-semibold hover:bg-[#f7f8fa]">Copy</button>
                  <button type="button" onClick={() => { setForwarding(message); setChosen([]); setForwardQuery(''); setMenuId(''); }} className="block w-full px-3 py-1.5 text-left text-sm font-semibold hover:bg-[#f7f8fa]">Forward</button>
                  <button type="button" onClick={() => { setReactingId(message.id); setMenuId(''); setEmojiOpen(true); }} className="block w-full px-3 py-1.5 text-left text-sm font-semibold hover:bg-[#f7f8fa]">More emoji</button>
                </div>
              ) : null}
              {message.reactions?.length ? (
                <div className={`mt-1 flex flex-wrap gap-1 ${message.mine ? 'justify-end' : ''}`}>
                  {message.reactions.map((reaction) => (
                    <button key={reaction.emoji} type="button" onClick={() => onReact(message, reaction.emoji)} className={`rounded-full px-1.5 py-0.5 text-xs ${reaction.mine ? 'bg-[#d9e4e1]' : 'bg-white'}`}>
                      {reaction.emoji}{reaction.count > 1 ? ` ${reaction.count}` : ''}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        ))}
        {typing?.length ? (
          <li className="flex justify-start">
            <span className="rounded-lg bg-white px-3 py-2 text-lg tracking-[0.2em] text-[#667781]">•••</span>
          </li>
        ) : null}
        <li ref={endRef} />
      </ul>
      {thread.canSend ? (
        <form onSubmit={(event) => { setEmojiOpen(false); onSend(event); }} className="flex flex-col bg-[#efeae2]">
          {notice ? <p className="bg-[#214d3e] px-3 py-2 text-center text-sm text-white">{notice}</p> : null}
          {reply ? (
            <div className="mx-2 mt-2 flex items-center gap-2 rounded-lg border-l-4 border-[#214d3e] bg-white px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#214d3e]">{reply.mine ? 'You' : (reply.asDepartment ? reply.departmentName : reply.author)}</p>
                <p className="truncate text-sm text-[#667781]">{quoteText(reply)}</p>
              </div>
              <button type="button" aria-label="Cancel reply" onClick={() => onReply(null)} className="text-[#667781]">✕</button>
            </div>
          ) : null}
          {emojiOpen ? <EmojiPicker onPick={pickEmoji} /> : null}
          <div className="flex items-end gap-2 px-2 py-2">
          <div className="flex min-h-12 flex-1 items-center gap-1 rounded-3xl bg-white px-1">
            <button type="button" aria-label={emojiOpen ? 'Close emoji' : 'Emoji'} onClick={() => { setReactingId(''); setEmojiOpen((open) => !open); }} className="flex h-9 w-9 shrink-0 items-center justify-center text-[#667781]">
              <Icon icon={emojiOpen ? 'carbon:keyboard' : 'carbon:face-satisfied'} className="h-6 w-6" />
            </button>
            <input ref={inputRef} value={draft} onChange={(event) => onDraft(event.target.value)} onFocus={() => { if (!reactingId) setEmojiOpen(false); }} placeholder={recording ? 'Recording a voice message' : 'Message'} className="h-12 min-w-0 flex-1 bg-transparent px-2 text-[15px] outline-none" />
          </div>
          {draft.trim() ? (
            <button type="submit" disabled={sending} aria-label="Send" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2e6b57] text-white">
              <Icon icon="carbon:send" className="h-5 w-5" />
            </button>
          ) : (
            <button type="button" aria-label={recording ? 'Send voice message' : 'Record a voice message'} onClick={onVoice} className={`flex h-12 w-12 items-center justify-center rounded-full ${recording ? 'bg-[#ea0038] text-white' : 'bg-[#2e6b57] text-white'}`}>
              <Icon icon={recording ? 'carbon:stop-filled' : 'carbon:microphone'} className="h-5 w-5" />
            </button>
          )}
          </div>
        </form>
      ) : <p className="bg-white px-4 py-3 text-sm text-[#667781]">You can read this room.</p>}
      {forwarding ? (
        <ForwardSheet
          message={forwarding}
          people={people}
          query={forwardQuery}
          chosen={chosen}
          busy={forwardingBusy}
          onQuery={setForwardQuery}
          onToggle={(person) => setChosen((current) => (
            current.some((item) => item.userId === person.userId)
              ? current.filter((item) => item.userId !== person.userId)
              : [...current, person]
          ))}
          onClose={() => setForwarding(null)}
          onSend={sendForward}
        />
      ) : null}
    </>
  );
}

function ForwardSheet({ message, people, query, chosen, busy, onQuery, onToggle, onClose, onSend }) {
  const visible = people.filter((person) => {
    const text = query.trim().toLowerCase();
    if (!text) return true;
    return `${person.name} ${person.detail || ''}`.toLowerCase().includes(text);
  });
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white">
      <div className="flex items-center gap-2 px-2 pt-3">
        <button type="button" aria-label="Back" onClick={onClose} className="text-[#2e6b57]">
          <Icon icon="carbon:chevron-left" className="h-7 w-7" />
        </button>
        <h1 className="flex-1 text-[28px] font-bold tracking-tight">Forward</h1>
        <button type="button" disabled={!chosen.length || busy} onClick={onSend} className="mr-2 text-sm font-bold text-[#2e6b57] disabled:opacity-40">Send</button>
      </div>
      <p className="truncate px-4 pt-1 text-sm text-[#667781]">{quoteText(message)}</p>
      <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search" className="mx-4 mt-3 h-10 rounded-full bg-[#f0f2f5] px-4 text-sm outline-none" />
      <ul className="mt-2 flex-1 overflow-y-auto px-4">
        {visible.map((person) => {
          const on = chosen.some((item) => item.userId === person.userId);
          return (
            <li key={person.userId}>
              <button type="button" onClick={() => onToggle(person)} className="flex w-full items-center gap-3 py-2.5 text-left">
                <Face name={person.name} employeeId={person.employeeId} photoKey={person.photoKey} />
                <span className="min-w-0 flex-1 truncate text-base font-semibold">{person.name}</span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${on ? 'border-[#2e6b57] bg-[#2e6b57] text-white' : 'border-[#c4d6d0]'}`}>
                  {on ? <Icon icon="carbon:checkmark" className="h-4 w-4" /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PeopleSheet({ people, onClose, onStart }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <div className="flex items-center gap-2 px-2 pt-3">
        <button type="button" aria-label="Back" onClick={onClose} className="text-[#2e6b57]">
          <Icon icon="carbon:chevron-left" className="h-7 w-7" />
        </button>
        <h1 className="text-[28px] font-bold tracking-tight">New message</h1>
      </div>
      <ul className="flex-1 overflow-y-auto px-4">
        {people.map((person) => (
          <li key={person.userId}>
            <button type="button" onClick={() => onStart(person.userId)} className="flex w-full items-center gap-3 py-2.5 text-left">
              <Face name={person.name} employeeId={person.employeeId} photoKey={person.photoKey} />
              <span className="min-w-0 flex-1 border-b border-[#e9edef] pb-2.5">
                <span className="block truncate text-base font-semibold">{person.name}</span>
                {person.detail ? <span className="block truncate text-sm text-[#667781]">{person.detail}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScreenTitle({ title, onClose }) {
  return (
    <div className="flex items-center gap-2 pt-3">
      <button type="button" aria-label="Back" onClick={onClose} className="text-[#2e6b57]">
        <Icon icon="carbon:chevron-left" className="h-7 w-7" />
      </button>
      <h1 className="flex-1 text-[28px] font-bold tracking-tight">{title}</h1>
    </div>
  );
}

function FilterChips({ items, value, onChange }) {
  return (
    <div className="mb-2 mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => onChange(item.id)} className={`rounded-2xl px-3 py-1.5 text-[13px] font-semibold ${value === item.id ? 'bg-[#d9e4e1] text-[#214d3e]' : 'bg-[#f0f2f5] text-[#667781]'}`}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function CallsPane({ calls, activeId, onBack, onCall, onOpen }) {
  return (
    <div>
      <ScreenTitle title="Calls" onClose={onBack} />
      <ul className="mt-2">
        {calls.length === 0 ? <li className="py-6 text-sm text-[#667781]">Your audio and video calls show up here.</li> : calls.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2">
            <button type="button" onClick={() => onOpen(item)} className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left ${item.id === activeId ? 'bg-[#f7f8fa]' : ''}`}>
              <Face name={item.name} employeeId={item.employeeId} photoKey={item.photoKey} />
              <span className="min-w-0 flex-1 border-b border-[#e9edef] pb-2">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-base font-semibold">{item.name}</span>
                  <span className={`text-xs ${item.missed ? 'font-semibold text-[#ea0038]' : 'text-[#8696a0]'}`}>{when(item.startedAt)}</span>
                </span>
                <span className={`mt-0.5 flex items-center gap-1 text-sm ${item.missed ? 'font-semibold text-[#ea0038]' : 'text-[#667781]'}`}>
                  <Icon icon={item.video ? 'carbon:video-filled' : 'carbon:phone-filled'} className="h-3.5 w-3.5" />
                  <Icon icon={item.direction === 'outgoing' ? 'carbon:arrow-up' : 'carbon:arrow-down'} className="h-3.5 w-3.5" />
                  {item.detail}
                </span>
              </span>
            </button>
            <button type="button" aria-label={item.video ? `Video call ${item.name}` : `Audio call ${item.name}`} onClick={() => onCall(item)} className="mb-2 text-[#2e6b57]">
              <Icon icon={item.video ? 'carbon:video-filled' : 'carbon:phone-filled'} className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const UPDATE_KIND = {
  TASK_ASSIGNED: 'Assigned',
  TASK_UPDATED: 'Updated',
  DEADLINE: 'Deadline',
  MEETING: 'Meeting',
  ANNOUNCEMENT: 'News',
};

function UpdatesPane({ groups, filter, activeKey, onFilter, onClose, onOpen }) {
  return (
    <div>
      <ScreenTitle title="Updates" onClose={onClose} />
      <FilterChips
        value={filter}
        onChange={onFilter}
        items={[
          { id: 'all', label: 'All' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'meetings', label: 'Meetings' },
          { id: 'news', label: 'News' },
        ]}
      />
      <ul>
        {groups.length === 0 ? <li className="py-6 text-sm text-[#667781]">No updates in this view.</li> : groups.map((group) => (
          <li key={group.key}>
            <button type="button" onClick={() => onOpen(group)} className={`flex w-full items-center gap-3 py-2.5 text-left ${group.key === activeKey ? 'bg-[#f7f8fa]' : ''}`}>
              <Face name={group.title} />
              <span className="min-w-0 flex-1 border-b border-[#e9edef] pb-2.5">
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-base font-semibold">{group.title}</span>
                  <span className={`shrink-0 text-xs ${group.unread ? 'font-semibold text-[#2e6b57]' : 'text-[#8696a0]'}`}>{when(group.createdAt)}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-[#667781]">
                    {group.bucket === 'meetings' ? 'Meetings' : group.bucket === 'news' ? 'News' : 'Tasks'} · {group.items.length === 1 ? '1 update' : `${group.items.length} updates`}
                  </span>
                  {group.unread > 0 ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2e6b57] px-1.5 text-xs font-bold text-white">{group.unread}</span> : null}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkPane({ tasks, filter, activeId, onFilter, onClose, onOpen }) {
  return (
    <div>
      <ScreenTitle title="Work" onClose={onClose} />
      <FilterChips
        value={filter}
        onChange={onFilter}
        items={[
          { id: 'open', label: 'Open' },
          { id: 'due', label: 'Due' },
          { id: 'review', label: 'Review' },
        ]}
      />
      <ul>
        {tasks.length === 0 ? <li className="py-6 text-sm text-[#667781]">No tasks in this view.</li> : tasks.map((task) => (
          <li key={task.id}>
            <button type="button" onClick={() => onOpen(task.id)} className={`flex w-full items-center gap-3 py-2.5 text-left ${task.id === activeId ? 'bg-[#f7f8fa]' : ''}`}>
              <Face name={task.title} />
              <span className="min-w-0 flex-1 border-b border-[#e9edef] pb-2.5">
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-base font-semibold">{task.title}</span>
                  <span className="shrink-0 text-xs text-[#8696a0]">{task.dueDate ? when(task.dueDate) : ''}</span>
                </span>
                <span className="mt-0.5 block truncate text-sm text-[#667781]">
                  {task.project?.name || 'Task'} · {STATUS[task.status] || task.status}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailHeader({ name, line, onBack }) {
  return (
    <header className="flex items-center gap-2 border-b border-[#e9edef] bg-white px-2 py-2">
      <button type="button" aria-label="Back" onClick={onBack} className="text-[#2e6b57] md:hidden">
        <Icon icon="carbon:chevron-left" className="h-7 w-7" />
      </button>
      <Face name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold">{name}</p>
        {line ? <p className="truncate text-[13px] text-[#667781]">{line}</p> : null}
      </div>
    </header>
  );
}

function TaskPane({ task, onBack }) {
  const people = (task.assignees || []).map((item) => item.employee).filter(Boolean);
  return (
    <>
      <DetailHeader name={task.title} line={[task.project?.name, STATUS[task.status] || task.status].filter(Boolean).join(' · ')} onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-white px-6 py-5">
        {task.description ? <p className="text-[15px] leading-6 text-[#111b21]">{task.description}</p> : null}
        <p className={`text-sm font-semibold text-[#2e6b57] ${task.description ? 'mt-4' : ''}`}>{STATUS[task.status] || task.status}</p>
        <p className="mt-1 text-sm text-[#667781]">
          {[task.project?.name, task.dueDate ? `Due ${formatWhen(task.dueDate)}` : ''].filter(Boolean).join(' · ')}
        </p>
        {task.checklist?.length ? <p className="mb-2 mt-6 text-sm font-semibold">Checklist</p> : null}
        <ul>
          {(task.checklist || []).map((item) => (
            <li key={item.id} className="flex items-center gap-3 border-b border-[#e9edef] py-2.5 text-sm">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${item.done ? 'border-[#2e6b57] bg-[#2e6b57] text-white' : 'border-[#c4d6d0]'}`}>
                {item.done ? <Icon icon="carbon:checkmark" className="h-3.5 w-3.5" /> : null}
              </span>
              <span className={item.done ? 'text-[#667781] line-through' : ''}>{item.label}</span>
            </li>
          ))}
        </ul>
        {people.length ? <p className="mb-1 mt-6 text-sm font-semibold">People</p> : null}
        <ul>
          {people.map((person) => (
            <li key={person.id} className="flex items-center gap-3 py-2">
              <Face name={`${person.firstName || ''} ${person.lastName || ''}`} employeeId={person.id} photoKey={person.photoKey} />
              <span className="text-base font-semibold">{person.firstName} {person.lastName}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function UpdatePane({ group, onBack }) {
  const count = group.items.length === 1 ? '1 update' : `${group.items.length} updates`;
  return (
    <>
      <DetailHeader name={group.title} line={count} onBack={onBack} />
      <div className="flex-1 overflow-y-auto bg-[#efeae2] px-4 py-4">
        <ul className="space-y-2">
          {group.items.map((item) => (
            <li key={item.id} className="rounded-lg bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#2e6b57]">{UPDATE_KIND[item.kind] || 'Update'}</span>
                <span className="text-[11px] text-[#667781]">{formatWhen(item.createdAt)}</span>
              </div>
              <p className="mt-1 text-[15px] leading-5">{item.body || group.title}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function StreamVideo({ stream, muted, mirror, className }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.srcObject = stream || null;
    if (stream) node.play().catch(() => {});
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} style={mirror ? { transform: 'scaleX(-1)' } : undefined} />;
}

function useCallMedia() {
  const [media, setMedia] = useState({ local: null, remote: null, remoteLive: false });
  useEffect(() => subscribeMedia(setMedia), []);
  return media;
}

function useSelf() {
  const [self, setSelf] = useState(null);
  useEffect(() => {
    let active = true;
    hbmsApi.get('/access/me')
      .then((response) => {
        const employee = response.data.data?.employee;
        if (!active || !employee) return;
        setSelf({
          name: [employee.firstName, employee.lastName].filter(Boolean).join(' '),
          employeeId: employee.id,
          photoKey: employee.photoKey,
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return self;
}

function callClock(startedAt, now) {
  const total = Math.max(0, Math.floor((now - (startedAt || now)) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function CallCard({ call, minimized, onMinimize, onExpand }) {
  const media = useCallMedia();
  const self = useSelf();
  const active = call.phase === 'active';
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active, call.startedAt]);
  const incoming = call.direction === 'in' && call.phase === 'ringing';
  const kind = call.video ? 'Video' : 'Audio';
  const status = call.phase === 'ended'
    ? call.reason
    : active
      ? callClock(call.startedAt, now)
      : call.phase === 'connecting'
        ? `Connecting ${kind.toLowerCase()}`
        : incoming
          ? `Incoming ${kind.toLowerCase()} call`
          : `${kind} call · ringing`;
  if (minimized) {
    return (
      <div className={`fixed bottom-24 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-full py-2 pl-2 pr-2 text-white shadow-lg ${call.video ? 'bg-black' : 'bg-[#214d3e]'}`}>
        <button type="button" onClick={onExpand} className="flex min-w-0 items-center gap-3 text-left" aria-label="Return to call">
          <Face name={call.name} employeeId={call.employeeId} photoKey={call.photoKey} />
          <span className="min-w-0 pr-1">
            <span className="block max-w-40 truncate text-sm font-semibold">{call.name}</span>
            <span className={`flex items-center gap-1 text-xs text-[#d5e4df] ${active ? 'tabular-nums' : ''}`}>
              <Icon icon={call.video ? 'carbon:video-filled' : 'carbon:phone-filled'} className="h-3.5 w-3.5" />
              {status}
            </span>
          </span>
        </button>
        {call.phase === 'ended' ? null : (
          <>
            {active && !call.video ? (
              <button type="button" onClick={switchToVideo} className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold">Video</button>
            ) : null}
            <button type="button" onClick={toggleMute} className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold">{call.muted ? 'Unmute' : 'Mute'}</button>
            <button type="button" onClick={hangup} className="rounded-full bg-red-600 px-3 py-2 text-sm font-semibold">End</button>
          </>
        )}
      </div>
    );
  }
  const videoStage = Boolean(call.video) && !incoming;
  const remoteOn = videoStage && media.remoteLive;
  const localOn = videoStage && !call.cameraOff && Boolean(media.local?.getVideoTracks().some((track) => track.enabled && track.readyState === 'live'));
  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center text-white ${call.video ? 'bg-black' : 'bg-[#214d3e]'}`}>
      {remoteOn ? <StreamVideo stream={media.remote} className="absolute inset-0 h-full w-full object-cover" /> : null}
      {onMinimize && !incoming && call.phase !== 'ended' ? (
        <button type="button" onClick={onMinimize} className="absolute left-5 top-5 z-10 flex items-center gap-1 rounded-full bg-black/35 px-4 py-2 text-sm font-semibold">
          <Icon icon="carbon:chevron-down" className="h-5 w-5" />
          Minimize
        </button>
      ) : null}
      <div className={`flex flex-col items-center text-center ${remoteOn ? 'absolute inset-x-0 bottom-8 z-10' : ''}`}>
        {remoteOn ? null : call.video ? (
          <span className="mb-4 flex h-72 w-52 items-center justify-center overflow-hidden rounded-[28px] bg-[#1f2c33] shadow-lg">
            <Face big name={call.name} employeeId={call.employeeId} photoKey={call.photoKey} />
          </span>
        ) : (
          <span className="mb-4">
            <Face big name={call.name} employeeId={call.employeeId} photoKey={call.photoKey} />
          </span>
        )}
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          <Icon icon={call.video ? 'carbon:video-filled' : 'carbon:phone-filled'} className="h-3.5 w-3.5" />
          {kind} call
        </p>
        <p className="mt-3 text-3xl font-semibold drop-shadow">{call.name}</p>
        {call.sharing ? <p className="mt-1 text-sm text-white/80">Sharing your screen</p> : null}
        {call.notice ? <p className="mt-1 text-sm text-white/80">{call.notice}</p> : null}
        {videoStage && !remoteOn && !call.sharing ? <p className="mt-1 text-sm text-white/70">Camera is off</p> : null}
        <p className={`mt-2 text-[#d5e4df] drop-shadow ${active ? 'text-xl font-semibold tabular-nums tracking-wide' : ''}`} aria-label={active ? `Call time ${status}` : undefined}>{status}</p>
        {active && call.video && !call.sharing ? (
          <div className="mt-4 flex max-w-full flex-wrap justify-center gap-2 px-4">
            {VIDEO_EFFECTS.map((item) => {
              const selected = (call.effect || 'none') === item.id;
              return (
                <button key={item.id} type="button" onClick={() => setVideoEffect(item.id)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${selected ? 'bg-white text-[#214d3e]' : 'bg-white/15 text-white'}`}>
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : null}
        {incoming ? (
          <div className="mt-8 flex justify-center gap-4">
            <button type="button" onClick={rejectCall} className="rounded-full bg-red-600 px-6 py-3 font-semibold">Decline</button>
            <button type="button" onClick={acceptCall} className="rounded-full bg-[#2e6b57] px-6 py-3 font-semibold">Accept</button>
          </div>
        ) : call.phase === 'ended' ? null : (
          <div className="mt-8 flex max-w-full flex-wrap justify-center gap-3 px-4">
            {call.video && !call.sharing ? (
              <button type="button" onClick={toggleCamera} className="rounded-full bg-white/15 px-6 py-3 font-semibold">{call.cameraOff ? 'Camera on' : 'Camera off'}</button>
            ) : !call.video && active ? (
              <button type="button" onClick={switchToVideo} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 font-semibold">
                <Icon icon="carbon:video-filled" className="h-5 w-5" />
                Video
              </button>
            ) : null}
            {active ? (
              <button type="button" onClick={toggleShare} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 font-semibold">
                <Icon icon={call.sharing ? 'carbon:close-filled' : 'carbon:screen'} className="h-5 w-5" />
                {call.sharing ? 'Stop sharing' : 'Share screen'}
              </button>
            ) : null}
            <button type="button" onClick={toggleMute} className="rounded-full bg-white/15 px-6 py-3 font-semibold">{call.muted ? 'Unmute' : 'Mute'}</button>
            <button type="button" onClick={hangup} className="rounded-full bg-red-600 px-6 py-3 font-semibold">End</button>
          </div>
        )}
      </div>
      {localOn ? (
        <StreamVideo stream={media.local} muted mirror={!call.sharing} className={`absolute bottom-28 right-6 z-10 rounded-2xl object-cover shadow-lg ${call.sharing ? 'h-28 w-48' : 'h-36 w-24'}`} />
      ) : null}
      {videoStage && !localOn ? (
        <span className="absolute bottom-28 right-6 z-10 flex h-36 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[#1f2c33] shadow-lg">
          <Face big name={self?.name || 'You'} employeeId={self?.employeeId} photoKey={self?.photoKey} />
        </span>
      ) : null}
    </div>
  );
}
