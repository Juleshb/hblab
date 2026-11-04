const { prisma } = require('./utils');

const calls = new Map();
const userCall = new Map();
const tails = new Map();

function publish(userId, event, except) {
  require('./live').publishUsers([userId], event, except);
}

function publishSocket(socket, event) {
  require('./live').sendSocket(socket, event);
}

function connected(userId) {
  return require('./live').isUserConnected(userId);
}

function personLabel(member) {
  const person = member?.employee;
  const named = [person?.firstName, person?.lastName].filter(Boolean).join(' ');
  return named || member?.user?.name || member?.user?.email || 'Someone';
}

function same(left, right) {
  return Number(left) === Number(right);
}

function cleanId(value) {
  const id = String(value || '');
  return /^[a-zA-Z0-9_-]{8,80}$/.test(id) ? id : '';
}

function cleanSdp(value) {
  if (!value || typeof value !== 'object') return null;
  const type = value.type === 'offer' || value.type === 'answer' ? value.type : '';
  const sdp = String(value.sdp || '');
  if (!type || !sdp || sdp.length > 80000) return null;
  return { type, sdp };
}

function cleanCandidate(value) {
  if (!value || typeof value !== 'object') return null;
  const candidate = String(value.candidate || '');
  if (!candidate || candidate.length > 2000) return null;
  const line = Number(value.sdpMLineIndex);
  return {
    candidate,
    sdpMid: value.sdpMid == null ? null : String(value.sdpMid).slice(0, 20),
    sdpMLineIndex: Number.isInteger(line) ? line : null,
  };
}

function party(call, userId) {
  if (!call) return null;
  if (same(call.from, userId)) return call.to;
  if (same(call.to, userId)) return call.from;
  return null;
}

function remember(data) {
  return prisma.hbmsCall.upsert({
    where: { id: data.id },
    create: data,
    update: {
      status: data.status,
      video: data.video === true,
      answeredAt: data.answeredAt || undefined,
      endedAt: data.endedAt || undefined,
    },
  }).catch(() => {});
}

function notifyHistory(call) {
  publish(call.from, { type: 'calls' });
  publish(call.to, { type: 'calls' });
}

function finishedStatus(call, action) {
  if (call.answeredAt) return 'answered';
  if (action === 'reject') return 'declined';
  if (action === 'busy') return 'busy';
  if (action === 'unavailable') return 'unavailable';
  return 'cancelled';
}

async function saveFinished(call, action) {
  const status = finishedStatus(call, action);
  await remember({
    id: call.id,
    conversationId: call.conversationId,
    callerId: call.from,
    calleeId: call.to,
    video: call.video === true,
    status,
    startedAt: call.startedAt || new Date(),
    answeredAt: call.answeredAt || null,
    endedAt: new Date(),
  });
  notifyHistory(call);
}

function clear(call) {
  if (!call) return;
  clearTimeout(call.timer);
  calls.delete(call.id);
  if (userCall.get(call.from) === call.id) userCall.delete(call.from);
  if (userCall.get(call.to) === call.id) userCall.delete(call.to);
}

function inviteBody(call) {
  return {
    type: 'call',
    action: 'invite',
    callId: call.id,
    conversationId: call.conversationId,
    fromUserId: call.from,
    name: call.callerName,
    employeeId: call.employeeId,
    photoKey: call.photoKey,
    video: call.video === true,
    sdp: call.offer,
  };
}

function relay(userId, event) {
  if (connected(userId)) {
    publish(userId, event);
    return;
  }
  const call = calls.get(event.callId);
  if (call && event.action === 'ice' && same(call.to, userId)) {
    call.pendingIce = call.pendingIce || [];
    if (call.pendingIce.length < 40) call.pendingIce.push(event.candidate);
  }
}

async function wake(call) {
  if (!call || call.pushed || call.answeredAt) return;
  call.pushed = true;
  await require('./push').sendPush([call.to], {
    title: call.callerName || 'Incoming call',
    body: call.video ? 'Video call · tap to answer' : 'Audio call · tap to answer',
    data: {
      type: 'call',
      callId: call.id,
      conversationId: call.conversationId,
    },
    channelId: 'calls',
    categoryId: 'incoming-call',
    priority: 'high',
    ttl: 45,
    interruptionLevel: 'time-sensitive',
  });
}

function hold(call) {
  calls.set(call.id, call);
  userCall.set(call.from, call.id);
  userCall.set(call.to, call.id);
  call.timer = setTimeout(() => {
    const current = calls.get(call.id);
    if (current && !current.answeredAt) end(current, 'hangup', null);
  }, 48000);
}

function end(call, action, exceptUserId) {
  if (!call || !calls.has(call.id)) return;
  const from = call.from;
  const to = call.to;
  const id = call.id;
  clear(call);
  saveFinished(call, action).catch(() => {});
  if (!same(from, exceptUserId)) publish(from, { type: 'call', action, callId: id });
  if (!same(to, exceptUserId)) publish(to, { type: 'call', action, callId: id });
}

async function invite(userId, event) {
  const callId = cleanId(event.callId);
  const conversationId = String(event.conversationId || '');
  const sdp = cleanSdp(event.sdp);
  if (!callId || !conversationId || !sdp || sdp.type !== 'offer') return;
  if (calls.has(callId) || userCall.has(Number(userId))) {
    publish(userId, { type: 'call', action: 'busy', callId });
    return;
  }
  const conversation = await prisma.hbmsConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      kind: true,
      members: {
        select: {
          userId: true,
          employee: { select: { id: true, firstName: true, lastName: true, photoKey: true } },
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (!conversation || conversation.kind !== 'DIRECT') return;
  const me = conversation.members.find((member) => same(member.userId, userId));
  const peer = conversation.members.find((member) => member.userId && !same(member.userId, userId));
  if (!me || !peer) return;
  const peerId = Number(peer.userId);
  if (userCall.has(peerId)) {
    publish(userId, { type: 'call', action: 'busy', callId });
    await saveFinished({
      id: callId,
      conversationId: conversation.id,
      from: Number(userId),
      to: peerId,
      startedAt: new Date(),
      video: event.video === true,
    }, 'busy');
    return;
  }
  const call = {
    id: callId,
    conversationId: conversation.id,
    from: Number(userId),
    to: peerId,
    startedAt: new Date(),
    answeredAt: null,
    offer: sdp,
    callerName: personLabel(me),
    employeeId: me.employee?.id || null,
    photoKey: me.employee?.photoKey || null,
    video: event.video === true,
    pendingIce: [],
    pushed: false,
    timer: null,
  };
  hold(call);
  await remember({
    id: call.id,
    conversationId: call.conversationId,
    callerId: call.from,
    calleeId: call.to,
    status: 'ringing',
    video: call.video === true,
    startedAt: call.startedAt,
  });
  if (connected(peerId)) publish(peerId, inviteBody(call));
  else await wake(call);
}

function signal(userId, event, socket) {
  const call = calls.get(cleanId(event.callId));
  const other = party(call, userId);
  if (!other) return;
  if (event.action === 'upgrade') {
    const sdp = cleanSdp(event.sdp);
    if (!sdp || !call.answeredAt) return;
    if (sdp.type === 'offer') {
      call.video = true;
      remember({
        id: call.id,
        conversationId: call.conversationId,
        callerId: call.from,
        calleeId: call.to,
        status: 'answered',
        video: true,
        startedAt: call.startedAt || new Date(),
        answeredAt: call.answeredAt,
      }).catch(() => {});
    }
    relay(other, { type: 'call', action: 'upgrade', callId: call.id, sdp, video: call.video === true });
    return;
  }
  if (event.action === 'answer') {
    const sdp = cleanSdp(event.sdp);
    if (!sdp || sdp.type !== 'answer') return;
    if (call.answeredAt) {
      publishSocket(socket, { type: 'call', action: 'clear', callId: call.id, dropped: true });
      return;
    }
    call.answeredAt = new Date();
    remember({
      id: call.id,
      conversationId: call.conversationId,
      callerId: call.from,
      calleeId: call.to,
      status: 'answered',
      video: call.video === true,
      startedAt: call.startedAt || call.answeredAt,
      answeredAt: call.answeredAt,
    }).catch(() => {});
    relay(other, { type: 'call', action: 'answer', callId: call.id, sdp });
    publish(userId, { type: 'call', action: 'clear', callId: call.id }, socket);
    return;
  }
  if (event.action === 'ice') {
    const candidate = cleanCandidate(event.candidate);
    if (!candidate) return;
    relay(other, { type: 'call', action: 'ice', callId: call.id, candidate });
    return;
  }
  if (event.action === 'hangup' || event.action === 'reject' || event.action === 'busy') {
    end(call, event.action === 'hangup' ? 'hangup' : event.action, userId);
  }
}

function onCallMessage(userId, raw, socket) {
  let event;
  try {
    event = JSON.parse(String(raw || ''));
  } catch {
    return Promise.resolve();
  }
  if (!event || event.type !== 'call') return Promise.resolve();
  const run = async () => {
    if (event.action === 'invite') await invite(userId, event);
    else signal(userId, event, socket);
  };
  const key = Number(userId);
  const previous = tails.get(key) || Promise.resolve();
  const next = previous.then(run, run);
  tails.set(key, next);
  return next.finally(() => {
    if (tails.get(key) === next) tails.delete(key);
  });
}

function onUserLeft(userId) {
  for (const call of [...calls.values()]) {
    if (!same(call.from, userId) && !same(call.to, userId)) continue;
    if (same(call.to, userId) && !call.answeredAt) {
      wake(call).catch(() => {});
      continue;
    }
    end(call, 'hangup', userId);
  }
}

function onUserJoined(userId) {
  const waiting = [...calls.values()].filter((call) => same(call.to, userId) && !call.answeredAt && call.offer);
  for (const call of waiting) {
    publish(userId, inviteBody(call));
    for (const candidate of call.pendingIce || []) {
      publish(userId, { type: 'call', action: 'ice', callId: call.id, candidate });
    }
  }
}

function rejectFromUser(userId, callId) {
  const call = calls.get(cleanId(callId));
  if (!call || !party(call, userId)) return false;
  end(call, 'reject', userId);
  return true;
}

module.exports = { onCallMessage, onUserLeft, onUserJoined, rejectFromUser };
