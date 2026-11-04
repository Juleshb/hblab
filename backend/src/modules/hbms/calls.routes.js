const express = require('express');
const { prisma, handlePrismaError } = require('./utils');
const { attachAccess } = require('./access');

const router = express.Router();
router.use(attachAccess);

const personSelect = { id: true, firstName: true, lastName: true, photoKey: true };

function clock(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function personName(user) {
  const person = user?.employeeProfile;
  const named = [person?.firstName, person?.lastName].filter(Boolean).join(' ');
  return named || user?.name || 'Someone';
}

function presentCall(call, userId) {
  const outgoing = Number(call.callerId) === Number(userId);
  const peer = outgoing ? call.callee : call.caller;
  const duration = call.answeredAt && call.endedAt
    ? Math.max(0, new Date(call.endedAt).getTime() - new Date(call.answeredAt).getTime())
    : 0;
  const medium = call.video ? 'video' : 'audio';
  let detail = outgoing ? `Outgoing ${medium}` : `Incoming ${medium}`;
  let missed = false;
  if (call.status === 'answered') detail = duration ? `${detail} · ${clock(duration)}` : detail;
  else if (call.status === 'declined') {
    detail = outgoing ? `Declined ${medium}` : `Missed ${medium}`;
    missed = !outgoing;
  } else if (call.status === 'busy') detail = `Busy · ${medium}`;
  else if (call.status === 'unavailable') detail = `Not available · ${medium}`;
  else if (call.status === 'ringing') detail = `Calling · ${medium}`;
  else {
    detail = outgoing ? `No answer · ${medium}` : `Missed ${medium}`;
    missed = !outgoing;
  }
  return {
    id: call.id,
    conversationId: call.conversationId,
    name: personName(peer),
    employeeId: peer?.employeeProfile?.id || null,
    photoKey: peer?.employeeProfile?.photoKey || null,
    direction: outgoing ? 'outgoing' : 'incoming',
    video: call.video === true,
    missed,
    detail,
    startedAt: call.startedAt,
  };
}

router.post('/:id/reject', (req, res) => {
  const ok = require('./calls').rejectFromUser(req.userId, req.params.id);
  if (!ok) return res.status(404).json({ error: 'That call has already ended' });
  res.json({ data: { ok: true } });
});

router.get('/', async (req, res) => {
  try {
    const stale = new Date(Date.now() - 2 * 60 * 1000);
    await prisma.hbmsCall.updateMany({
      where: { status: 'ringing', startedAt: { lt: stale } },
      data: { status: 'cancelled', endedAt: new Date() },
    });
    const rows = await prisma.hbmsCall.findMany({
      where: { OR: [{ callerId: req.userId }, { calleeId: req.userId }] },
      orderBy: { startedAt: 'desc' },
      take: 80,
      include: {
        caller: { select: { id: true, name: true, employeeProfile: { select: personSelect } } },
        callee: { select: { id: true, name: true, employeeProfile: { select: personSelect } } },
      },
    });
    res.json({ data: rows.map((call) => presentCall(call, req.userId)) });
  } catch (error) {
    handlePrismaError(res, error, 'Could not load call history');
  }
});

module.exports = router;
