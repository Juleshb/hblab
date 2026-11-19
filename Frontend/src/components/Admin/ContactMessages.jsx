import { useEffect, useState } from 'react';
import axios from 'axios';
import { apiOrigin } from '../../apiOrigin';

function signedInTokens() {
  const current = String(axios.defaults.headers.common.Authorization || '').replace(/^Bearer\s+/i, '');
  return [current, localStorage.getItem('token') || '', sessionStorage.getItem('token') || '']
    .filter((token, index, list) => token && list.indexOf(token) === index);
}

async function withSignedIn(request) {
  const tokens = signedInTokens();
  let lastError;
  for (const token of tokens) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    try {
      return await request();
    } catch (error) {
      lastError = error;
      const message = error.response?.data?.error;
      if (message !== 'Invalid token' && message !== 'Authentication required') throw error;
    }
  }
  throw lastError || new Error('Sign in again, then open Contact messages.');
}

function when(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const fieldClass = 'w-full rounded-xl border border-green-200 bg-white px-3 py-2.5 text-sm text-green-950 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/15';

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [mailboxes, setMailboxes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState({ from: '', subject: '', body: '' });

  const loadList = async () => {
    const response = await withSignedIn(() => axios.get(`${apiOrigin}/api/contact`));
    setMessages(response.data.messages || []);
    setMailboxes(response.data.mailboxes || []);
    return response.data;
  };

  useEffect(() => {
    let active = true;
    loadList()
      .catch((err) => {
        if (active) setError(err.response?.data?.error || 'Could not load messages.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openMessage = async (id) => {
    setSelectedId(id);
    setError('');
    setNotice('');
    setDetail(null);
    try {
      const response = await withSignedIn(() => axios.get(`${apiOrigin}/api/contact/${id}`));
      setDetail(response.data);
      setMailboxes(response.data.mailboxes || []);
      const first = response.data.mailboxes?.[0]?.email || '';
      setReply({
        from: first,
        subject: 'Re: your message to HBLab',
        body: '',
      });
      setMessages((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not open this message.');
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selectedId) return;
    setSending(true);
    setError('');
    setNotice('');
    try {
      const response = await withSignedIn(() => axios.post(`${apiOrigin}/api/contact/${selectedId}/reply`, reply));
      setDetail((current) => current && ({
        ...current,
        message: { ...current.message, status: 'replied' },
        replies: [...current.replies, response.data.reply],
      }));
      setMessages((current) => current.map((item) => (
        item.id === selectedId ? { ...item, status: 'replied', replyCount: item.replyCount + 1, read: true } : item
      )));
      setReply((current) => ({ ...current, body: '' }));
      setNotice(`Reply sent from ${reply.from}.`);
    } catch (err) {
      setError(err.response?.data?.error || 'The reply was not sent.');
    } finally {
      setSending(false);
    }
  };

  const message = detail?.message;

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-3xl border border-green-200 bg-white">
        <div className="border-b border-green-100 px-4 py-4">
          <h1 className="text-lg font-black text-green-900">Contact messages</h1>
          <p className="mt-1 text-xs text-green-800">Messages sent from the website.</p>
        </div>
        {loading ? <p className="px-4 py-6 text-sm text-green-800">Loading messages…</p> : null}
        {!loading && messages.length === 0 ? (
          <p className="px-4 py-6 text-sm text-green-800">No messages yet.</p>
        ) : null}
        <ul className="max-h-[70vh] overflow-y-auto">
          {messages.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openMessage(item.id)}
                className={`w-full border-b border-green-50 px-4 py-3 text-left ${selectedId === item.id ? 'bg-green-50' : 'hover:bg-green-50/60'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${item.read ? 'font-medium text-green-900' : 'font-black text-green-950'}`}>{item.name}</span>
                  <span className="shrink-0 text-[11px] text-green-700">{when(item.createdAt)}</span>
                </div>
                <p className="mt-1 truncate text-xs text-green-800">{item.excerpt}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-green-600">
                  {item.status === 'replied' ? 'Replied' : 'Waiting'}
                  {item.replyCount ? ` · ${item.replyCount}` : ''}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-green-200 bg-white p-5">
        {!message ? (
          <div className="flex h-full min-h-64 items-center justify-center text-sm text-green-800">
            Choose a message to read it and reply.
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-green-950">{message.name}</h2>
                <p className="mt-1 text-sm text-green-800">{message.email}</p>
                <p className="text-sm text-green-800">{message.phone}</p>
              </div>
              <p className="text-xs text-green-700">{when(message.createdAt)}</p>
            </div>
            <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-green-50 px-4 py-3 text-sm leading-6 text-green-950">
              {message.message}
            </div>

            {detail.replies.length ? (
              <div className="mt-5 space-y-3">
                <h3 className="text-sm font-black text-green-900">Replies</h3>
                {detail.replies.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-green-100 px-4 py-3">
                    <p className="text-xs font-semibold text-green-700">{item.fromEmail} · {when(item.createdAt)}</p>
                    <p className="mt-1 text-sm font-semibold text-green-950">{item.subject}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-green-900">{item.body}</p>
                  </article>
                ))}
              </div>
            ) : null}

            <form onSubmit={sendReply} className="mt-5 space-y-3 border-t border-green-100 pt-5">
              <h3 className="text-sm font-black text-green-900">Reply by email</h3>
              <label className="block text-xs font-semibold text-green-800">
                Send from
                <select
                  className={`${fieldClass} mt-1`}
                  value={reply.from}
                  onChange={(event) => setReply({ ...reply, from: event.target.value })}
                  required
                >
                  {mailboxes.map((box) => (
                    <option key={box.email} value={box.email}>{box.label} · {box.email}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-green-800">
                Subject
                <input
                  className={`${fieldClass} mt-1`}
                  value={reply.subject}
                  onChange={(event) => setReply({ ...reply, subject: event.target.value })}
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-green-800">
                Message
                <textarea
                  className={`${fieldClass} mt-1 resize-none`}
                  rows="6"
                  value={reply.body}
                  onChange={(event) => setReply({ ...reply, body: event.target.value })}
                  placeholder="Write the reply. It is emailed to the person who contacted HBLab."
                  required
                />
              </label>
              {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
              {notice ? <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p> : null}
              <button
                type="submit"
                disabled={sending || !mailboxes.length}
                className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Send reply'}
              </button>
              {!mailboxes.length ? <p className="text-xs text-rose-700">No company mailbox is ready to send mail.</p> : null}
            </form>
          </div>
        )}
        {!message && error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      </section>
    </div>
  );
}
