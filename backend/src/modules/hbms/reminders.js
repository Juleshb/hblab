const { prisma } = require('./utils');
const { notifyWorkers } = require('./notify');

const OPEN = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'];
const DAY = 24 * 60 * 60 * 1000;

function dayLabel(value) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function sendDeadlineReminders() {
  const now = new Date();
  const horizon = new Date(now.getTime() + 2 * DAY);
  const tasks = await prisma.hbmsTask.findMany({
    where: {
      status: { in: OPEN },
      dueDate: { lte: horizon },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      project: { select: { name: true, code: true } },
      assignees: { select: { employeeId: true } },
    },
  });
  const since = new Date(now.getTime() - 20 * 60 * 60 * 1000);
  for (const task of tasks) {
    const ids = task.assignees.map((item) => item.employeeId);
    if (!ids.length || !task.dueDate) continue;
    const already = await prisma.hbmsNotification.findMany({
      where: {
        kind: 'DEADLINE',
        entityId: task.id,
        employeeId: { in: ids },
        createdAt: { gte: since },
      },
      select: { employeeId: true },
    });
    const sent = new Set(already.map((item) => item.employeeId));
    const pending = ids.filter((id) => !sent.has(id));
    if (!pending.length) continue;
    const overdue = task.dueDate.getTime() < now.getTime();
    const project = [task.project?.code, task.project?.name].filter(Boolean).join(' · ');
    await notifyWorkers(pending, {
      kind: 'DEADLINE',
      title: overdue ? `Overdue: ${task.title}` : `Deadline soon: ${task.title}`,
      body: [project, `Due ${dayLabel(task.dueDate)}`].filter(Boolean).join(' · '),
      entityType: 'HbmsTask',
      entityId: task.id,
    });
  }
}

function startDeadlineReminders() {
  const run = () => {
    sendDeadlineReminders().catch((error) => {
      console.error('Deadline reminders failed:', error.message);
    });
  };
  setTimeout(run, 20000);
  setInterval(run, 6 * 60 * 60 * 1000);
}

module.exports = { sendDeadlineReminders, startDeadlineReminders };
