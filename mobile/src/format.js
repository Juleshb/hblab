export const STATUS_LABEL = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  DONE: 'Completed',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
};

export const PRIORITY_LABEL = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const OPEN = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'];

export function isOpenStatus(status) {
  return OPEN.includes(status);
}

export function apiError(error, fallback) {
  if (!error?.response && (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK')) {
    return 'Cannot reach the server. Keep this phone on the same Wi-Fi as the computer running HBMS.';
  }
  return error?.response?.data?.error || error?.message || fallback;
}

export function formatChatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatWhen(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDay(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function dueLabel(task) {
  if (!task?.dueDate) return 'No due date';
  const due = new Date(task.dueDate);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = new Date(due);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - start.getTime()) / 86400000);
  const dayText = formatDay(task.dueDate);
  if (diff < 0 && isOpenStatus(task.status)) return `Overdue · ${dayText}`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due ${dayText}`;
}

export function personName(person) {
  if (!person) return '';
  return [person.firstName, person.lastName].filter(Boolean).join(' ');
}

export function noticeGroup(kind) {
  if (kind === 'MEETING') return 'Meetings';
  if (kind === 'ANNOUNCEMENT') return 'News';
  if (kind === 'CONVERSATION') return 'Chat';
  return 'Tasks';
}

export function isChatNotice(notice) {
  if (notice?.kind === 'CONVERSATION') return true;
  return String(notice?.entityType || '').toLowerCase().includes('conversation');
}

const SOURCE_PREFIX = /^(Task assigned|Task updated|Overdue|Deadline|Meeting):\s*/i;

export function sourceName(notice) {
  const title = String(notice?.title || 'Update').replace(SOURCE_PREFIX, '').trim();
  return title || 'Update';
}

export function sourceKey(notice) {
  if (notice?.entityId) return `${notice.entityType || 'item'}~${notice.entityId}`;
  return `notice~${notice.id}`;
}

export function groupNotices(notices) {
  const groups = new Map();
  for (const notice of notices || []) {
    if (isChatNotice(notice)) continue;
    const key = sourceKey(notice);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(notice);
  }
  return [...groups.values()].map((items) => {
    const sorted = [...items].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    const latest = sorted[0];
    return {
      key: sourceKey(latest),
      title: sourceName(latest),
      kind: latest.kind,
      latest,
      items: sorted,
      unread: sorted.filter((item) => !item.readAt).length,
      createdAt: latest.createdAt,
    };
  }).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

export function updateCountLabel(count) {
  return count === 1 ? '1 update' : `${count} updates`;
}

export function openNoticePath(notice) {
  const type = String(notice?.entityType || '').toLowerCase();
  const id = notice?.entityId;
  if (!id) return null;
  if (type.includes('task')) return `/task/${id}`;
  if (type.includes('meeting')) return `/meeting/${id}`;
  if (type.includes('announcement')) return `/announcement/${id}`;
  if (type.includes('conversation')) return `/thread/${id}`;
  return null;
}

export function assignedTo(task, employeeId) {
  if (!employeeId) return true;
  return (task.assignees || []).some((item) => (item.employeeId || item.employee?.id) === employeeId);
}
