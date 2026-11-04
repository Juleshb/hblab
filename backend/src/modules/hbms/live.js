const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
const { prisma } = require('./utils');

const clients = new Map();

function attachLive(server) {
  const sockets = new WebSocketServer({ server, path: '/api/hbms/live' });
  sockets.on('connection', (socket, request) => {
    let userId = null;
    try {
      const url = new URL(request.url, 'http://localhost');
      const decoded = jwt.verify(url.searchParams.get('token') || '', process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      socket.close(4401);
      return;
    }
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId).add(socket);
    publishAll({ type: 'presence', userId: Number(userId), online: true, lastSeenAt: null });
    require('./calls').onUserJoined(userId);
    socket.on('message', (raw) => {
      require('./calls').onCallMessage(userId, raw, socket).catch(() => {});
    });
    socket.on('close', () => {
      const open = clients.get(userId);
      if (!open) return;
      open.delete(socket);
      if (open.size) return;
      clients.delete(userId);
      require('./calls').onUserLeft(userId);
      const lastSeenAt = new Date();
      prisma.user.update({ where: { id: Number(userId) }, data: { lastSeenAt } }).catch(() => {});
      publishAll({ type: 'presence', userId: Number(userId), online: false, lastSeenAt: lastSeenAt.toISOString() });
    });
    socket.on('error', () => socket.close());
  });
  const timer = setInterval(() => {
    for (const open of clients.values()) {
      for (const socket of open) {
        if (socket.readyState === 1) socket.ping();
      }
    }
  }, 25000);
  sockets.on('close', () => clearInterval(timer));
}

function socketsOf(userId) {
  return clients.get(userId) || clients.get(Number(userId)) || clients.get(String(userId));
}

function send(userId, event, except) {
  const open = socketsOf(userId);
  if (!open) return;
  const body = JSON.stringify(event);
  for (const socket of open) {
    if (socket === except || socket.readyState !== 1) continue;
    socket.send(body);
  }
}

function sendSocket(socket, event) {
  if (!socket || socket.readyState !== 1) return;
  socket.send(JSON.stringify(event));
}

function isUserConnected(userId) {
  const open = clients.get(userId) || clients.get(Number(userId));
  if (!open) return false;
  for (const socket of open) {
    if (socket.readyState === 1) return true;
  }
  return false;
}

function publishUsers(userIds, event, except) {
  for (const userId of new Set((userIds || []).filter(Boolean))) send(userId, event, except);
}

function publishAll(event) {
  for (const userId of clients.keys()) send(userId, event);
}

async function publishEmployees(employeeIds, event) {
  const ids = [...new Set((employeeIds || []).filter(Boolean))];
  if (!ids.length) return;
  const rows = await prisma.employee.findMany({
    where: { id: { in: ids }, userId: { not: null } },
    select: { userId: true },
  });
  publishUsers(rows.map((row) => row.userId), event);
}

module.exports = { attachLive, publishUsers, publishEmployees, publishAll, isUserConnected, sendSocket };
