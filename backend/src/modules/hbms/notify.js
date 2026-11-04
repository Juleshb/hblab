const { prisma } = require('./utils');
const { emailWorkers } = require('./mail');
const { publishEmployees } = require('./live');
const { sendPushToEmployees } = require('./push');

const TASK_KINDS = new Set(['TASK_ASSIGNED', 'TASK_UPDATED', 'DEADLINE']);

async function notifyWorkers(employeeIds, notice) {
  const ids = [...new Set((employeeIds || []).filter(Boolean))];
  if (!ids.length) return 0;
  const result = await prisma.hbmsNotification.createMany({
    data: ids.map((employeeId) => ({
      employeeId,
      kind: notice.kind,
      title: notice.title,
      body: notice.body || null,
      entityType: notice.entityType || null,
      entityId: notice.entityId || null,
    })),
  });
  emailWorkers(ids, notice).catch((error) => {
    console.error('Notification email failed:', error.message);
  });
  publishEmployees(ids, {
    type: 'inbox',
    title: notice.title,
    body: notice.body || '',
    kind: notice.kind,
    entityType: notice.entityType || null,
    entityId: notice.entityId || null,
  }).catch(() => {});
  if (notice.kind !== 'CONVERSATION') {
    sendPushToEmployees(ids, {
      title: notice.title,
      body: notice.body || '',
      data: { entityType: notice.entityType || null, entityId: notice.entityId || null, kind: notice.kind },
    }).catch(() => {});
  }
  if (TASK_KINDS.has(notice.kind)) publishEmployees(ids, { type: 'tasks' }).catch(() => {});
  if (notice.kind === 'CONVERSATION') {
    publishEmployees(ids, { type: 'conversations', conversationId: notice.entityId || null }).catch(() => {});
  }
  if (notice.kind === 'MEETING') publishEmployees(ids, { type: 'meetings' }).catch(() => {});
  return result.count;
}

async function activeWorkerIds(businessUnitId) {
  const workers = await prisma.employee.findMany({
    where: {
      status: { not: 'INACTIVE' },
      ...(businessUnitId ? { businessUnitId } : {}),
    },
    select: { id: true },
  });
  return workers.map((worker) => worker.id);
}

module.exports = { notifyWorkers, activeWorkerIds };
