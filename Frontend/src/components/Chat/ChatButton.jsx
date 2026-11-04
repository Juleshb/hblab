import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../../assets/context/AuthContext.jsx';

export default function ChatButton() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || location.pathname.startsWith('/chat')) return null;
  return (
    <Link
      to="/chat"
      aria-label="Chat"
      className="group fixed bottom-6 right-6 z-[70] flex items-center rounded-full bg-[#2e6b57] text-white shadow-lg shadow-[#214d3e]/30 transition hover:bg-[#275b4a]"
    >
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-200 group-hover:max-w-24 group-hover:pl-5 group-hover:opacity-100">
        Chat
      </span>
      <span className="flex h-14 w-14 items-center justify-center">
        <Icon icon="carbon:chat" className="h-7 w-7" />
      </span>
    </Link>
  );
}
