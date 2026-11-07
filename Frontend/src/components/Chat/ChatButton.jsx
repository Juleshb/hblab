import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../../assets/context/AuthContext.jsx';
import hbmsApi from '../Admin/HBMS/api';
import { subscribeDesk } from './webCall';

const BASE_TITLE = 'HB-Lab';

function badgeLabel(count) {
  if (count > 99) return '99+';
  return String(count);
}

export default function ChatButton() {
  const { user } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const onChat = location.pathname.startsWith('/chat');

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return undefined;
    }
    let active = true;
    const load = () => {
      hbmsApi.get('/conversations/unread')
        .then((response) => {
          if (active) setUnread(Number(response.data.data?.unread) || 0);
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 20000);
    const stop = subscribeDesk((event) => {
      if (['message', 'conversations', 'inbox', 'read', 'delivered'].includes(event?.type)) load();
    });
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      active = false;
      clearInterval(timer);
      stop();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user]);

  useEffect(() => {
    const base = String(document.title || BASE_TITLE).replace(/^\(\d+\+?\)\s*/, '') || BASE_TITLE;
    document.title = unread > 0 ? `(${badgeLabel(unread)}) ${base}` : base;
  }, [unread]);

  if (!user || onChat) return null;
  const label = unread > 0 ? `Chat, ${unread} unread` : 'Chat';
  return (
    <Link
      to="/chat"
      aria-label={label}
      className="group fixed bottom-6 right-6 z-[70] flex items-center rounded-full bg-[#2e6b57] text-white shadow-lg shadow-[#214d3e]/30 transition hover:bg-[#275b4a]"
    >
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-200 group-hover:max-w-24 group-hover:pl-5 group-hover:opacity-100">
        Chat
      </span>
      <span className="relative flex h-14 w-14 items-center justify-center">
        <Icon icon="carbon:chat" className="h-7 w-7" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
            {badgeLabel(unread)}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
