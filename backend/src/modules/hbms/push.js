const { prisma } = require('./utils');

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
    data: data || {},
    ...(channelId ? { channelId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(priority ? { priority } : {}),
    ...(ttl ? { ttl } : {}),
    ...(interruptionLevel ? { interruptionLevel } : {}),
  }));
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    return true;
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
