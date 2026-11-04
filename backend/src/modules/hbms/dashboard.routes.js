const express = require('express');
const { prisma, projectProgress, handlePrismaError } = require('./utils');
const { attachAccess, scopeDashboard } = require('./access');

const router = express.Router();
router.use(attachAccess);

const ATTENTION_STATUSES = ['TODO', 'IN_PROGRESS', 'BLOCKED'];
const CATEGORY_LABEL = {
  SOFTWARE: 'software',
  WEBSITE: 'website',
  ECOMMERCE: 'e-commerce',
  MOBILE: 'mobile',
  INFRASTRUCTURE: 'infrastructure',
  PHOTOGRAPHY: 'photography',
  VIDEO: 'video',
  LIVESTREAM: 'live-streaming',
  MARKETING: 'marketing',
  BRANDING: 'branding',
  PODCAST: 'podcast',
  OTHER: 'other',
};
const WORKER_LABEL = {
  FULL_TIME: ['full-time employee', 'full-time employees'],
  PART_TIME: ['part-time employee', 'part-time employees'],
  INTERN: ['intern', 'interns'],
  TRAINER: ['trainer', 'trainers'],
  FREELANCE: ['freelance creative', 'freelance creatives'],
};
const PROGRAM_KINDS = ['SOFTWARE_TRAINING', 'MEDIA_TRAINING', 'HOLIDAY', 'INTERNSHIP', 'WORKSHOP', 'HACKATHON', 'COURSE'];

function plural(count, one, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function joinClauses(parts) {
  if (parts.length <= 1) return parts[0] || '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function weekStartDate(now) {
  const monday = new Date(now);
  const weekday = monday.getDay();
  monday.setDate(monday.getDate() - (weekday === 0 ? 6 : weekday - 1));
  monday.setHours(0, 0, 0, 0);
  return new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function activityText(entry) {
  const meta = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {};
  switch (entry.action) {
    case 'employee.create':
      return `Added ${meta.email || 'a worker'}`;
    case 'employee.update':
      return 'Updated a worker profile';
    case 'department.create':
      return meta.name ? `Added the ${meta.name} department` : 'Added a department';
    case 'department.update':
      return 'Updated a department';
    case 'department.delete':
      return meta.name ? `Removed the ${meta.name} department` : 'Removed a department';
    case 'position.create':
      return meta.title ? `Added the ${meta.title} position` : 'Added a position';
    case 'project.create':
      return meta.name ? `Created the ${meta.name} project` : 'Created a project';
    case 'program.create':
      return meta.name ? `Opened the ${meta.name} program` : 'Opened a program';
    case 'project.update':
      return 'Updated a project';
    case 'project.member':
      return 'Updated a project team';
    case 'project.member.remove':
      return 'Removed a project member';
    case 'task.create':
      return meta.title ? `Created the task “${meta.title}”` : 'Created a task';
    case 'task.submit_review':
      return 'Submitted a task for review';
    case 'task.review':
      return meta.decision === 'APPROVED' ? 'Approved completed work' : 'Requested changes on a task';
    default:
      return String(entry.action || 'Updated a record').replaceAll('.', ' ');
  }
}

function categoryPhrase(projects) {
  const counts = {};
  projects.forEach((project) => {
    counts[project.category] = (counts[project.category] || 0) + 1;
  });
  return Object.keys(CATEGORY_LABEL)
    .filter((category) => counts[category])
    .map((category) => plural(counts[category], `active ${CATEGORY_LABEL[category]} project`));
}

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const horizon = addDays(today, 14);
    const weekStart = weekStartDate(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true },
    });
    const employee = user
      ? await prisma.employee.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email.toLowerCase() },
          ],
        },
        select: { id: true, firstName: true, lastName: true },
      })
      : null;

    const [
      workerGroups,
      trackedProjects,
      attentionTasks,
      milestones,
      programs,
      attendanceToday,
      weekAttendance,
      weekLeave,
      leaveToday,
      pendingLeave,
      pendingExpenses,
      reviews,
      reviewCount,
      leaveCount,
      expenseCount,
      activity,
      units,
    ] = await Promise.all([
      prisma.employee.groupBy({
        by: ['employmentType'],
        where: { status: { in: ['ACTIVE', 'ON_LEAVE'] } },
        _count: { _all: true },
      }),
      prisma.hbmsProject.findMany({
        where: { status: { in: ['ACTIVE', 'ON_HOLD'] } },
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
          endDate: true,
          businessUnitId: true,
          businessUnit: { select: { id: true, name: true, code: true } },
          tasks: { select: { status: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.hbmsTask.findMany({
        where: {
          status: { in: ATTENTION_STATUSES },
          dueDate: { not: null, lte: horizon },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
          project: {
            select: {
              id: true,
              name: true,
              businessUnitId: true,
              businessUnit: { select: { name: true } },
            },
          },
          assignees: {
            select: {
              employeeId: true,
              employee: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.hbmsMilestone.findMany({
        where: {
          status: { not: 'COMPLETED' },
          dueDate: { not: null, lte: horizon },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          project: {
            select: {
              id: true,
              name: true,
              businessUnitId: true,
              businessUnit: { select: { name: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.hbmsProgram.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          kind: true,
          startDate: true,
          endDate: true,
          capacity: true,
          businessUnit: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.hbmsAttendance.findMany({
        where: {
          workDate: { gte: today, lt: tomorrow },
          OR: [{ approvalStatus: null }, { approvalStatus: 'APPROVED' }],
        },
        select: { status: true, hours: true },
      }),
      prisma.hbmsAttendance.findMany({
        where: {
          workDate: { gte: weekStart, lt: weekEnd },
          OR: [{ approvalStatus: null }, { approvalStatus: 'APPROVED' }],
        },
        select: { workDate: true, status: true },
      }),
      prisma.hbmsLeaveRequest.findMany({
        where: {
          status: 'APPROVED',
          startDate: { lt: weekEnd },
          endDate: { gte: weekStart },
        },
        select: { startDate: true, endDate: true },
      }),
      prisma.hbmsLeaveRequest.findMany({
        where: {
          status: 'APPROVED',
          startDate: { lt: tomorrow },
          endDate: { gte: today },
        },
        select: { employeeId: true },
        distinct: ['employeeId'],
      }),
      prisma.hbmsLeaveRequest.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          reason: true,
          employee: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 6,
      }),
      prisma.hbmsExpense.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          description: true,
          amount: true,
          currency: true,
          project: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 6,
      }),
      prisma.hbmsTask.findMany({
        where: { status: 'IN_REVIEW' },
        select: {
          id: true,
          title: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'asc' },
        take: 6,
      }),
      prisma.hbmsTask.count({ where: { status: 'IN_REVIEW' } }),
      prisma.hbmsLeaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.hbmsExpense.count({ where: { status: 'PENDING' } }),
      prisma.hbmsAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.businessUnit.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const myTaskWhere = employee
      ? {
        status: { in: [...ATTENTION_STATUSES, 'IN_REVIEW'] },
        assignees: { some: { employeeId: employee.id } },
      }
      : null;
    const [myTasks, myTaskCount] = myTaskWhere
      ? await Promise.all([
        prisma.hbmsTask.findMany({
          where: myTaskWhere,
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            priority: true,
            project: { select: { id: true, name: true } },
          },
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
          take: 6,
        }),
        prisma.hbmsTask.count({ where: myTaskWhere }),
      ])
      : [[], 0];

    const workersByType = Object.fromEntries(Object.keys(WORKER_LABEL).map((type) => [type, 0]));
    workerGroups.forEach((group) => {
      workersByType[group.employmentType] = group._count._all;
    });
    const totalWorkers = Object.values(workersByType).reduce((sum, count) => sum + count, 0);

    const activeProjects = trackedProjects.filter((project) => project.status === 'ACTIVE');
    const projectsByCategory = Object.fromEntries(Object.keys(CATEGORY_LABEL).map((category) => [category, 0]));
    activeProjects.forEach((project) => {
      projectsByCategory[project.category] = (projectsByCategory[project.category] || 0) + 1;
    });

    const progress = trackedProjects.map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      category: project.category,
      unit: project.businessUnit?.name,
      progress: projectProgress(project.tasks),
    }));

    const deadlines = [
      ...attentionTasks.map((task) => ({
        id: `task-${task.id}`,
        kind: 'task',
        title: task.title,
        dueDate: task.dueDate,
        overdue: task.dueDate < now,
        unitId: task.project?.businessUnitId,
        unit: task.project?.businessUnit?.name,
        context: task.project?.name,
        projectId: task.project?.id,
      })),
      ...trackedProjects
        .filter((project) => project.endDate && project.endDate <= horizon)
        .map((project) => ({
          id: `project-${project.id}`,
          kind: 'project',
          title: project.name,
          dueDate: project.endDate,
          overdue: project.endDate < now,
          unitId: project.businessUnitId,
          unit: project.businessUnit?.name,
          context: 'Project end date',
          projectId: project.id,
        })),
      ...milestones.map((milestone) => ({
        id: `milestone-${milestone.id}`,
        kind: 'milestone',
        title: milestone.title,
        dueDate: milestone.dueDate,
        overdue: milestone.dueDate < now,
        unitId: milestone.project?.businessUnitId,
        unit: milestone.project?.businessUnit?.name,
        context: milestone.project?.name,
        projectId: milestone.project?.id,
      })),
    ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const upcomingProjects = new Map();
    deadlines.filter((item) => item.unitId && item.projectId && !item.overdue).forEach((item) => {
      if (!upcomingProjects.has(item.unitId)) upcomingProjects.set(item.unitId, new Set());
      upcomingProjects.get(item.unitId).add(item.projectId);
    });

    const summaryParts = units.map((unit) => {
      const unitProjects = activeProjects.filter((project) => project.businessUnitId === unit.id);
      const upcoming = upcomingProjects.get(unit.id)?.size || 0;
      const clauses = [];
      if (unitProjects.length) clauses.push(...categoryPhrase(unitProjects));
      if (upcoming) clauses.push(plural(upcoming, 'upcoming deadline'));
      if (!clauses.length) clauses.push('no active projects or upcoming deadlines');
      return `${unit.name} has ${joinClauses(clauses)}`;
    });

    const programsByKind = Object.fromEntries(PROGRAM_KINDS.map((kind) => [kind, 0]));
    programs.forEach((program) => {
      programsByKind[program.kind] = (programsByKind[program.kind] || 0) + 1;
    });

    const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, index) => {
      const day = new Date(weekStart);
      day.setUTCDate(weekStart.getUTCDate() + index);
      const key = dateKey(day);
      const rows = weekAttendance.filter((row) => dateKey(row.workDate) === key);
      const leave = weekLeave.filter((row) => dateKey(row.startDate) <= key && dateKey(row.endDate) >= key).length;
      return {
        label,
        present: rows.filter((row) => row.status === 'PRESENT' || row.status === 'LATE').length,
        absent: rows.filter((row) => row.status === 'ABSENT').length,
        leave,
      };
    });
    const attendance = {
      present: attendanceToday.filter((row) => row.status === 'PRESENT').length,
      late: attendanceToday.filter((row) => row.status === 'LATE').length,
      absent: attendanceToday.filter((row) => row.status === 'ABSENT').length,
      onLeave: leaveToday.length,
      hours: Math.round(attendanceToday.reduce((sum, row) => sum + Number(row.hours || 0), 0) * 10) / 10,
      recorded: attendanceToday.length,
      week,
    };

    const actors = await prisma.user.findMany({
      where: { id: { in: activity.map((entry) => entry.actorId).filter(Boolean) } },
      select: { id: true, name: true, email: true },
    });
    const actorName = Object.fromEntries(actors.map((actor) => [actor.id, actor.name || actor.email]));

    const taskReviews = reviews.map((task) => ({
      id: task.id,
      kind: 'task',
      title: task.title,
      detail: task.project?.name || 'Task review',
      projectId: task.project?.id,
    }));
    const leaveItems = pendingLeave.map((request) => ({
      id: request.id,
      kind: 'leave',
      title: `${request.employee.firstName} ${request.employee.lastName}`,
      detail: request.reason || 'Leave request',
    }));
    const expenseItems = pendingExpenses.map((expense) => ({
      id: expense.id,
      kind: 'expense',
      title: expense.description,
      detail: `${expense.currency} ${expense.amount}${expense.project ? ` · ${expense.project.name}` : ''}`,
    }));

    const payload = {
        summary: `${summaryParts.join('. ')}.`,
        workers: {
          total: totalWorkers,
          byType: workersByType,
        },
        projects: {
          active: activeProjects.length,
          byCategory: projectsByCategory,
          progress,
        },
        myTasks: {
          linked: Boolean(employee),
          name: employee ? `${employee.firstName} ${employee.lastName}` : user?.name || null,
          total: myTaskCount,
          items: myTasks,
        },
        deadlines: deadlines.slice(0, 8),
        programs: {
          active: programs.length,
          byKind: programsByKind,
          items: programs.map((program) => ({
            ...program,
            enrolled: program._count?.enrollments || 0,
          })),
        },
        attendance,
        approvals: {
          total: reviewCount + leaveCount + expenseCount,
          tasks: reviewCount,
          leave: leaveCount,
          expenses: expenseCount,
          items: [...taskReviews, ...leaveItems, ...expenseItems].slice(0, 8),
        },
        activity: activity.map((entry) => ({
          id: entry.id,
          text: activityText(entry),
          actor: entry.actorId ? actorName[entry.actorId] || 'Team member' : 'System',
          createdAt: entry.createdAt,
        })),
    };
    res.json({ data: scopeDashboard(payload, req.access) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load HBMS dashboard');
  }
});

module.exports = router;
