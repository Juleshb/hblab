const { prisma } = require('./utils');

async function sendPush(userIds, { title, body, data }) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length || !title) return;
  const tokens = await prisma.hbmsPushToken.findMany({
    where: { userId: { in: ids } },
    select: { token: true },
  });
  if (!tokens.length) return;
  const messages = tokens.map((item) => ({
    to: item.token,
    title,
    body: body || '',
    sound: 'default',
    data: data || {},
  }));
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error('Push notification failed:', error.message);
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
