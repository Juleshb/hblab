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
    socket.on('close', () => {
      const open = clients.get(userId);
      if (!open) return;
      open.delete(socket);
      if (!open.size) clients.delete(userId);
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

function send(userId, event) {
  const open = clients.get(userId);
  if (!open) return;
  const body = JSON.stringify(event);
  for (const socket of open) {
    if (socket.readyState === 1) socket.send(body);
  }
}

function isUserConnected(userId) {
  const open = clients.get(userId) || clients.get(Number(userId));
  if (!open) return false;
  for (const socket of open) {
    if (socket.readyState === 1) return true;
  }
  return false;
}

function publishUsers(userIds, event) {
  for (const userId of new Set((userIds || []).filter(Boolean))) send(userId, event);
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

module.exports = { attachLive, publishUsers, publishEmployees, publishAll, isUserConnected };
