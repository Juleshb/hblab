import { useEffect, useState } from 'react';
import { EMOJI_GROUPS, recentEmojis, subscribeRecent } from './emojis';

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function EmojiPicker({ onPick }) {
  const [group, setGroup] = useState('smile');
  const [recent, setRecent] = useState(recentEmojis);
  useEffect(() => subscribeRecent(setRecent), []);
  const emojis = group === 'recent' ? recent : EMOJI_GROUPS.find((item) => item.id === group)?.emojis || [];

  return (
    <div className="flex h-64 flex-col border-t border-[#e9edef] bg-white">
      <div className="grid flex-1 grid-cols-8 content-start overflow-y-auto px-1 py-1">
        {emojis.map((symbol, index) => (
          <button
            key={`${symbol}-${index}`}
            type="button"
            aria-label={symbol}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(symbol)}
            className="flex h-10 items-center justify-center rounded-lg text-2xl hover:bg-[#f0f2f5]"
          >
            {symbol}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-around border-t border-[#e9edef] bg-[#f0f2f5] py-1">
        <button type="button" aria-label="Recent" onClick={() => setGroup('recent')} className={`rounded-full px-2 py-1 text-lg ${group === 'recent' ? 'bg-white' : ''}`}>🕒</button>
        {EMOJI_GROUPS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => setGroup(item.id)}
            className={`rounded-full px-2 py-1 text-lg ${group === item.id ? 'bg-white' : ''}`}
          >
            {item.emojis[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
