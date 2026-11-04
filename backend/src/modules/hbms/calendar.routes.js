const express = require('express');
const { prisma, parseDate, handlePrismaError } = require('./utils');
const { attachAccess, guardWrites, allowsProject } = require('./access');
const { notifyWorkers } = require('./notify');

const router = express.Router();
router.use(attachAccess);
router.use(guardWrites((req) => req.access.orgWide || req.access.departmentScope || req.access.managedProjectIds.length > 0));

function rangeFromQuery(query) {
  const now = new Date();
  const from = parseDate(query.from) || new Date(now.getFullYear(), now.getMonth(), 1);
  const to = parseDate(query.to) || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  if (from?.invalid || to?.invalid) return { invalid: true };
  return { from, to };
}

router.get('/', async (req, res) => {
  try {
    const range = rangeFromQuery(req.query);
    if (range.invalid) return res.status(400).json({ error: 'Invalid date range' });
    const { from, to } = range;
    const employeeId = req.query.employeeId || null;
    const projectId = req.query.projectId || null;

    const employee = employeeId
      ? await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { id: true, businessUnitId: true },
      })
      : null;
    if (employeeId && !employee) return res.status(404).json({ error: 'Worker not found' });

    const taskWhere = {
      OR: [
        { dueDate: { gte: from, lte: to } },
        { startDate: { gte: from, lte: to } },
      ],
      ...(projectId ? { projectId } : {}),
      ...(employeeId ? { assignees: { some: { employeeId } } } : {}),
    };
    const milestoneWhere = {
      dueDate: { gte: from, lte: to },
      ...(projectId ? { projectId } : {}),
      ...(employeeId
        ? {
          project: {
            OR: [
              { managerId: employeeId },
              { members: { some: { employeeId } } },
            ],
          },
        }
        : {}),
    };
    const meetingWhere = {
      startsAt: { gte: from, lte: to },
      ...(projectId ? { projectId } : {}),
      ...(employeeId ? { attendees: { some: { employeeId } } } : {}),
    };
    const programWhere = {
      status: { not: 'CANCELLED' },
      OR: [
        { startDate: { gte: from, lte: to } },
        { endDate: { gte: from, lte: to } },
      ],
      ...(employee ? { businessUnitId: employee.businessUnitId } : {}),
    };

    const [tasks, milestones, meetings, programs, sessions] = await Promise.all([
      prisma.hbmsTask.findMany({
        where: taskWhere,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          startDate: true,
          dueDate: true,
          project: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.hbmsMilestone.findMany({
        where: milestoneWhere,
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
          project: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.hbmsMeeting.findMany({
        where: meetingWhere,
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          project: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.hbmsProgram.findMany({
        where: programWhere,
        select: { id: true, name: true, kind: true, status: true, startDate: true, endDate: true },
      }),
      projectId
        ? Promise.resolve([])
        : prisma.hbmsProgramSession.findMany({
          where: {
            startsAt: { gte: from, lte: to },
            ...(employee ? { program: { businessUnitId: employee.businessUnitId } } : {}),
          },
          select: {
            id: true,
            title: true,
            startsAt: true,
            program: { select: { id: true, name: true } },
          },
        }),
    ]);

    const events = [
      ...tasks.flatMap((task) => {
        const rows = [];
        if (task.dueDate && task.dueDate >= from && task.dueDate <= to) {
          rows.push({
            kind: 'task',
            id: `${task.id}:due`,
            taskId: task.id,
            title: task.title,
            date: task.dueDate,
            status: task.status,
            priority: task.priority,
            project: task.project,
            mark: 'deadline',
          });
        }
        if (task.startDate && task.startDate >= from && task.startDate <= to && String(task.startDate) !== String(task.dueDate)) {
          rows.push({
            kind: 'task',
            id: `${task.id}:start`,
            taskId: task.id,
            title: task.title,
            date: task.startDate,
            status: task.status,
            priority: task.priority,
            project: task.project,
            mark: 'start',
          });
        }
        return rows;
      }),
      ...milestones.map((item) => ({
        kind: 'milestone',
        id: item.id,
        title: item.title,
        date: item.dueDate,
        status: item.status,
        project: item.project,
      })),
      ...meetings.map((item) => ({
        kind: 'meeting',
        id: item.id,
        title: item.title,
        date: item.startsAt,
        endDate: item.endsAt,
        project: item.project,
      })),
      ...sessions.map((item) => ({
        kind: 'session',
        id: item.id,
        title: item.title,
        date: item.startsAt,
        program: item.program,
      })),
      ...programs.flatMap((item) => {
        const rows = [];
        if (item.startDate && item.startDate >= from && item.startDate <= to) {
          rows.push({
            kind: 'program',
            id: `${item.id}:start`,
            title: item.name,
            date: item.startDate,
            status: item.status,
            programKind: item.kind,
            mark: 'start',
          });
        }
        if (item.endDate && item.endDate >= from && item.endDate <= to) {
          rows.push({
            kind: 'program',
            id: `${item.id}:end`,
            title: item.name,
            date: item.endDate,
            status: item.status,
            programKind: item.kind,
            mark: 'end',
          });
        }
        return rows;
      }),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    const visible = req.access.projectIds == null && req.access.programIds == null
      ? events
      : events.filter((event) => {
        if (event.project?.id) return allowsProject(req.access, event.project.id);
        if (event.program?.id) return req.access.programIds == null || req.access.programIds.includes(event.program.id);
        if (event.kind === 'program') return req.access.programIds == null || req.access.programIds.includes(String(event.id).split(':')[0]);
        return req.access.orgWide;
      });
    res.json({ data: visible });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load calendar');
  }
});

function parseAttendees(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(Boolean))];
}

router.post('/meetings', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Meeting title is required' });
    const startsAt = parseDate(req.body.startsAt);
    const endsAt = parseDate(req.body.endsAt);
    if (!startsAt || startsAt.invalid) return res.status(400).json({ error: 'Meeting date is required' });
    if (endsAt?.invalid) return res.status(400).json({ error: 'Invalid end time' });
    const attendeeIds = parseAttendees(req.body.attendeeIds);
    if (attendeeIds.length) {
      const found = await prisma.employee.count({ where: { id: { in: attendeeIds } } });
      if (found !== attendeeIds.length) return res.status(400).json({ error: 'Choose workers that exist' });
    }

    const meeting = await prisma.hbmsMeeting.create({
      data: {
        title,
        startsAt,
        endsAt: endsAt || null,
        projectId: req.body.projectId || null,
        notes: req.body.notes ? String(req.body.notes).trim() : null,
        attendees: {
          create: attendeeIds.map((employeeId) => ({ employeeId })),
        },
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        attendees: { select: { employeeId: true } },
      },
    });
    await notifyWorkers(attendeeIds, {
      kind: 'MEETING',
      title: `Meeting: ${meeting.title}`,
      body: 'You are invited.',
      entityType: 'HbmsMeeting',
      entityId: meeting.id,
    });
    res.status(201).json({ data: meeting });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to schedule meeting');
  }
});

module.exports = router;
