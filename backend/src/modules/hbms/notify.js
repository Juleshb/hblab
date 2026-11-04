const { prisma } = require('./utils');
const { emailWorkers } = require('./mail');

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
