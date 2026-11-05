import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import hbmsApi, { apiError, formatWhen } from './api';
import { Field, FormModal, PrimaryButton, WorkerAvatar, inputClass } from './ui';
import { apiOrigin } from '../../../apiOrigin';

function initials(name) {
  return String(name || '?').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

const HbmsConversations = ({ startWorkerId = '' }) => {
  const [list, setList] = useState([]);
  const [people, setPeople] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState('');
  const [asDepartment, setAsDepartment] = useState(false);
  const [workerId, setWorkerId] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadList = async (keepId) => {
    const response = await hbmsApi.get('/conversations');
    const data = response.data.data;
    setList(data.conversations || []);
    setPeople(data.people || []);
    const next = keepId || activeId || data.conversations?.[0]?.id || '';
    setActiveId(next);
    return next;
  };

  const openThread = async (id) => {
    if (!id) {
      setThread(null);
      return;
    }
    const response = await hbmsApi.get(`/conversations/${id}`);
    setThread(response.data.data);
    setAsDepartment(false);
  };

  useEffect(() => {
    if (!startWorkerId) return undefined;
    let active = true;
    (async () => {
      try {
        const response = await hbmsApi.post('/conversations', { employeeId: startWorkerId });
        if (!active) return;
        const id = response.data.data.id;
        setActiveId(id);
        const threadRes = await hbmsApi.get(`/conversations/${id}`);
        if (!active) return;
        setThread(threadRes.data.data);
        const listRes = await hbmsApi.get('/conversations');
        if (active) setList(listRes.data.data.conversations || []);
      } catch (err) {
        if (active) toast.error(apiError(err, 'Could not open the conversation'));
      }
    })();
    return () => {
      active = false;
    };
  }, [startWorkerId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await hbmsApi.get('/conversations');
        if (!active) return;
        const data = response.data.data;
        setList(data.conversations || []);
        setPeople(data.people || []);
        const first = data.conversations?.[0]?.id || '';
        setActiveId(first);
        if (first) {
          const threadRes = await hbmsApi.get(`/conversations/${first}`);
          if (active) setThread(threadRes.data.data);
        }
      } catch (err) {
        if (active) setError(apiError(err, 'Could not load conversations'));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const choose = async (id) => {
    setActiveId(id);
    setDraft('');
    try {
      await openThread(id);
      const response = await hbmsApi.get('/conversations');
      setList(response.data.data.conversations || []);
    } catch (err) {
      toast.error(apiError(err, 'Could not open the conversation'));
    }
  };

  const startDirect = async (event) => {
    event.preventDefault();
    try {
      const response = await hbmsApi.post('/conversations', { userId: Number(workerId) });
      setPickerOpen(false);
      setWorkerId('');
      const id = response.data.data.id;
      await loadList(id);
      await openThread(id);
    } catch (err) {
      toast.error(apiError(err, 'Could not start the conversation'));
    }
  };

  const send = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !activeId) return;
    setSending(true);
    try {
      const response = await hbmsApi.post(`/conversations/${activeId}/messages`, {
        body: draft.trim(),
        asDepartment,
      });
      setThread((current) => current && { ...current, messages: [...current.messages, response.data.data] });
      setDraft('');
      const refreshed = await hbmsApi.get('/conversations');
      setList(refreshed.data.data.conversations || []);
    } catch (err) {
      toast.error(apiError(err, 'Could not send the message'));
    } finally {
      setSending(false);
    }
  };

  const departments = list.filter((item) => item.kind === 'DEPARTMENT');
  const directs = list.filter((item) => item.kind === 'DIRECT');

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900">Conversations</h3>
          <button type="button" className="text-xs font-medium text-emerald-700" onClick={() => setPickerOpen(true)}>Message a user</button>
        </div>
        <FormModal open={pickerOpen} title="Message a user" subtitle="This opens a private conversation with that person." onClose={() => setPickerOpen(false)}>
          <form className="space-y-3" onSubmit={startDirect}>
            <Field label="Person">
              <select className={inputClass} value={workerId} onChange={(event) => setWorkerId(event.target.value)} required>
                <option value="">Choose a person</option>
                {people.map((person) => (
                  <option key={person.userId} value={person.userId}>
                    {person.name}{person.detail ? ` · ${person.detail}` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end">
              <PrimaryButton type="submit">Start conversation</PrimaryButton>
            </div>
          </form>
        </FormModal>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Departments</p>
            <ul className="mt-2 space-y-1">
              {departments.length === 0 ? <li className="text-sm text-gray-500">No department rooms yet.</li> : departments.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => choose(item.id)} className={`flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left ${item.id === activeId ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                      <Icon icon="carbon:enterprise" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">{item.title}</span>
                      <span className="block truncate text-xs text-gray-500">{item.detail} · {item.memberCount === 1 ? '1 person' : `${item.memberCount} people`}</span>
                    </span>
                    {item.unread > 0 ? <span className="rounded-full bg-emerald-700 px-1.5 text-[10px] font-semibold text-white">{item.unread}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Workers</p>
            <ul className="mt-2 space-y-1">
              {directs.length === 0 ? <li className="text-sm text-gray-500">No private conversations yet.</li> : directs.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => choose(item.id)} className={`flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left ${item.id === activeId ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                    {item.employeeId ? (
                      <WorkerAvatar worker={{ id: item.employeeId, firstName: item.firstName, lastName: item.lastName, photoKey: item.photoKey }} className="h-9 w-9 shrink-0 rounded-xl bg-emerald-100 text-xs font-semibold text-emerald-800" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-semibold text-emerald-800">{initials(item.title)}</span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">{item.title}</span>
                      <span className="block truncate text-xs text-gray-500">{item.lastBody || item.detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="flex min-h-[28rem] flex-col rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        {!thread ? <p className="text-sm text-gray-500">Choose a department or a worker.</p> : (
          <>
            <div>
              <h3 className="font-semibold text-gray-900">{thread.title}</h3>
              <p className="text-xs text-gray-500">{thread.detail}{thread.kind === 'DEPARTMENT' ? '. Everyone in this department can read this room.' : ''}</p>
            </div>
            <ul className="mt-4 flex-1 space-y-3 overflow-y-auto">
              {thread.messages.length === 0 ? <li className="text-sm text-gray-500">No messages yet.</li> : thread.messages.map((message) => (
                <li key={message.id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${message.asDepartment ? 'bg-violet-50 text-gray-900' : message.mine ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p className={`text-[11px] font-medium ${message.mine && !message.asDepartment ? 'text-emerald-100' : 'text-gray-500'}`}>
                      {message.asDepartment ? message.departmentName : message.author}
                      {message.asDepartment ? ` · via ${message.author}` : ''}
                    </p>
                    {message.audio?.url ? (
                      <audio controls preload="none" src={`${apiOrigin}${message.audio.url}`} className="mt-1 h-9 max-w-full" />
                    ) : null}
                    {message.body === 'Voice message expired' && !message.audio ? (
                      <p className={`mt-0.5 text-sm italic ${message.mine && !message.asDepartment ? 'text-emerald-100' : 'text-gray-500'}`}>Voice message expired</p>
                    ) : message.body ? <p className="mt-0.5 text-sm">{message.body}</p> : null}
                    <p className={`mt-1 text-[10px] ${message.mine && !message.asDepartment ? 'text-emerald-100' : 'text-gray-400'}`}>{formatWhen(message.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
            {thread.canSend ? (
              <form className="mt-4 space-y-2 border-t border-gray-100 pt-3" onSubmit={send}>
                {thread.canSpeakAsDepartment ? (
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={asDepartment} onChange={(event) => setAsDepartment(event.target.checked)} />
                    Send as {thread.title}
                  </label>
                ) : null}
                <div className="flex gap-2">
                  <input className={inputClass} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={asDepartment ? `Message as ${thread.title}` : 'Write a message'} maxLength={2000} />
                  <PrimaryButton type="submit" disabled={sending || !draft.trim()}>{sending ? 'Sending…' : 'Send'}</PrimaryButton>
                </div>
              </form>
            ) : (
              <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">You can read this room. Sending here is limited to people in the department.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default HbmsConversations;
