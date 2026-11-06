const { prisma } = require('./utils');

function pushData(data) {
  const next = {};
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value == null || value === '') return;
    next[key] = String(value);
  });
  return next;
}

async function sendPush(userIds, { title, body, data, channelId, categoryId, priority, ttl, interruptionLevel }) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length || !title) return false;
  const tokens = await prisma.hbmsPushToken.findMany({
    where: { userId: { in: ids } },
    select: { token: true },
  });
  if (!tokens.length) return false;
  const messages = tokens.map((item) => ({
    to: item.token,
    title,
    body: body || '',
    sound: 'default',
    priority: priority || 'high',
    channelId: channelId || 'default',
    interruptionLevel: interruptionLevel || 'active',
    data: pushData(data),
    ...(categoryId ? { categoryId } : {}),
    ...(ttl ? { ttl } : {}),
  }));
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    const payload = await response.json().catch(() => null);
    const tickets = Array.isArray(payload?.data) ? payload.data : [];
    const dead = tickets.flatMap((ticket, index) => (
      ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered'
        ? [messages[index]?.to]
        : []
    )).filter(Boolean);
    if (dead.length) {
      await prisma.hbmsPushToken.deleteMany({ where: { token: { in: dead } } });
    }
    return response.ok;
  } catch (error) {
    console.error('Push notification failed:', error.message);
    return false;
  }
}

async function sendPushToEmployees(employeeIds, payload) {
  const ids = [...new Set((employeeIds || []).filter(Boolean))];
  if (!ids.length) return;
  const rows = await prisma.employee.findMany({
    where: { id: { in: ids }, userId: { not: null } },
    select: { userId: true },
  });
  await sendPush(rows.map((row) => row.userId), payload);
}

module.exports = { sendPush, sendPushToEmployees };
