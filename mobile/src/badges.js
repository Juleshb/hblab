import { useEffect, useState } from 'react';

const state = { inbox: 0, messages: 0, teams: 0 };
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setInboxBadge(count) {
  state.inbox = count;
  emit();
}

export function setMessageBadge(count) {
  state.messages = count;
  emit();
}

export function setTeamsBadge(count) {
  state.teams = count;
  emit();
}

export function useBadges() {
  const [value, setValue] = useState(state);
  useEffect(() => {
    const listener = () => setValue({ ...state });
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  return value;
}
