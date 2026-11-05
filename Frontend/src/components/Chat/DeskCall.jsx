import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../../assets/context/AuthContext.jsx';
import { CallCard, Face } from './ChatPage';
import { acceptCall, connectDesk, deskCall, deskEpoch, disconnectDesk, hushRing, primeRing, subscribeCall } from './webCall';

export default function DeskCall() {
  const { token, user } = useAuth();
  const [call, setCall] = useState(null);
  const [hiddenId, setHiddenId] = useState('');
  const [miniId, setMiniId] = useState('');

  useEffect(() => {
    if (!token || !user) {
      disconnectDesk();
      setCall(null);
      return undefined;
    }
    primeRing();
    connectDesk(token);
    setCall(deskCall());
    return subscribeCall(setCall);
  }, [token, user, deskEpoch]);

  useEffect(() => {
    const sync = () => setCall(deskCall());
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  if (!user || !call) return null;
  const incoming = call.direction === 'in' && call.phase === 'ringing';
  let card = (
    <CallCard
      call={call}
      minimized={miniId === call.id}
      onMinimize={() => setMiniId(call.id)}
      onExpand={() => setMiniId('')}
    />
  );
  if (incoming && hiddenId === call.id) {
    card = (
      <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#214d3e] py-2 pl-2 pr-3 text-white shadow-lg">
        <Face name={call.name} employeeId={call.employeeId} photoKey={call.photoKey} />
        <span className="max-w-44 truncate text-sm font-semibold">{call.name} · {call.video ? 'video' : 'audio'}</span>
        <button type="button" onClick={() => { setHiddenId(''); hushRing(false); }} className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold">
          Show
        </button>
        <button type="button" onClick={acceptCall} className="rounded-full bg-[#2e6b57] px-3 py-2 text-sm font-semibold">
          Accept
        </button>
      </div>
    );
  } else if (incoming) {
    card = (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
        <div role="dialog" aria-label={`Incoming call from ${call.name}`} className="w-full max-w-[360px] rounded-[28px] bg-white px-6 py-8 text-center shadow-[0_24px_60px_rgba(17,27,33,0.28)]">
          <span className="mx-auto mb-2 flex h-20 items-center justify-center">
            <span className="scale-150">
              <Face name={call.name} employeeId={call.employeeId} photoKey={call.photoKey} />
            </span>
          </span>
          <p className="text-[22px] font-bold text-[#111b21]">{call.name}</p>
          <p className="mt-1 text-sm text-[#667781]">{call.notice || (call.video ? 'Incoming video call' : 'Incoming audio call')}</p>
          <div className="mt-8 flex items-start justify-center gap-10">
            <button type="button" onClick={() => { setHiddenId(call.id); hushRing(true); }} className="flex flex-col items-center gap-2">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f2f5] text-[#111b21]">
                <Icon icon="carbon:view-off" className="h-7 w-7" />
              </span>
              <span className="text-sm font-semibold text-[#667781]">Hide</span>
            </button>
            <button type="button" onClick={acceptCall} className="flex flex-col items-center gap-2">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2e6b57] text-white">
                <Icon icon={call.video ? 'carbon:video-filled' : 'carbon:phone-filled'} className="h-7 w-7" />
              </span>
              <span className="text-sm font-semibold text-[#2e6b57]">Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  return createPortal(card, document.body);
}
