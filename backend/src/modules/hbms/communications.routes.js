const express = require('express');
const { prisma, parseDate, handlePrismaError, writeAudit } = require('./utils');
const { attachAccess, guardWrites, allowsProject, allowsStaff } = require('./access');
const { notifyWorkers, activeWorkerIds } = require('./notify');

const router = express.Router();
router.use(attachAccess);
router.use(guardWrites((req) => {
  if (req.method === 'POST' && /^\/notifications\/[^/]+\/read$/.test(req.path)) return Boolean(req.access.employeeId) || req.access.orgWide || req.access.hr;
  return req.access.orgWide || req.access.hr || req.access.departmentScope || req.access.managedProjectIds.length > 0;
}));

const ANNOUNCEMENT_KINDS = ['MEETING', 'PRODUCTION', 'INTERNSHIP', 'DEADLINE', 'TRAINING', 'GENERAL'];
const OPEN_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'];
const REMINDER_DAYS = 14;

const personSelect = { id: true, firstName: true, lastName: true, staffCode: true };

const meetingInclude = {
  project: { select: { id: true, name: true, code: true } },
  attendees: {
    include: { employee: { select: personSelect } },
  },
  tasks: {
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      project: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
};

function attendeeIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(Boolean))];
}

function personName(person) {
  return person ? `${person.firstName} ${person.lastName}` : 'Someone';
}

async function assertWorkers(ids) {
  if (!ids.length) return;
  const found = await prisma.employee.count({ where: { id: { in: ids } } });
  if (found !== ids.length) {
    const error = new Error('Choose workers that exist');
    error.status = 400;
    throw error;
  }
}

function sendError(res, error, fallback) {
  if (error.status) return res.status(error.status).json({ error: error.message });
  return handlePrismaError(res, error, fallback);
}

async function ensureProjectMember(tx, projectId, employeeId) {
  await tx.hbmsProjectMember.upsert({
    where: { projectId_employeeId: { projectId, employeeId } },
    update: {},
    create: { projectId, employeeId, role: 'MEMBER' },
  });
  const employee = await tx.employee.findUnique({
    where: { id: employeeId },
    select: { departmentId: true },
  });
  if (!employee?.departmentId) return;
  await tx.hbmsProjectDepartment.upsert({
    where: { projectId_departmentId: { projectId, departmentId: employee.departmentId } },
    update: {},
    create: { projectId, departmentId: employee.departmentId },
  });
}

router.get('/notifications', async (req, res) => {
  try {
    const where = {};
    if (!req.access.orgWide && !req.access.hr) {
      if (!req.access.employeeId) return res.json({ data: [] });
      where.employeeId = req.access.employeeId;
    } else if (req.query.employeeId) where.employeeId = req.query.employeeId;
    if (req.query.unread === '1') where.readAt = null;
    const notices = await prisma.hbmsNotification.findMany({
      where,
      include: { employee: { select: personSelect } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: notices });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load notifications');
  }
});

router.post('/notifications/reminders', async (req, res) => {
  try {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + REMINDER_DAYS);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tasks = await prisma.hbmsTask.findMany({
      where: {
        status: { in: OPEN_STATUSES },
        dueDate: { not: null, lte: horizon },
      },
      include: {
        assignees: { select: { employeeId: true } },
        project: { select: { id: true, name: true, code: true, managerId: true } },
      },
    });
    const existing = await prisma.hbmsNotification.findMany({
      where: {
        kind: 'DEADLINE',
        entityType: 'HbmsTask',
        entityId: { in: tasks.map((task) => task.id) },
        createdAt: { gte: today },
      },
      select: { employeeId: true, entityId: true },
    });
    const already = new Set(existing.map((item) => `${item.employeeId}:${item.entityId}`));
    const rows = [];
    tasks.forEach((task) => {
      const recipients = task.assignees.length
        ? task.assignees.map((item) => item.employeeId)
        : [task.project?.managerId].filter(Boolean);
      const overdue = task.dueDate < new Date();
      const due = task.dueDate.toLocaleDateString();
      recipients.forEach((employeeId) => {
        if (already.has(`${employeeId}:${task.id}`)) return;
        rows.push({
          employeeId,
          kind: 'DEADLINE',
          title: overdue ? `Overdue: ${task.title}` : `Deadline: ${task.title}`,
          body: `${task.project?.code || task.project?.name || 'Project'} · due ${due}`,
          entityType: 'HbmsTask',
          entityId: task.id,
        });
      });
    });
    if (rows.length) await prisma.hbmsNotification.createMany({ data: rows });
    res.json({ data: { sent: rows.length, tasks: tasks.length } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to send deadline reminders');
  }
});

router.post('/notifications/:id/read', async (req, res) => {
  try {
    const notice = await prisma.hbmsNotification.update({
      where: { id: req.params.id },
      data: { readAt: new Date() },
    });
    res.json({ data: notice });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to mark the notification read');
  }
});

router.get('/announcements', async (req, res) => {
  try {
    const where = {};
    if (!req.access.orgWide && !req.access.hr) {
      if (!req.access.businessUnitId) return res.json({ data: [] });
      where.OR = [{ businessUnitId: null }, { businessUnitId: req.access.businessUnitId }];
    } else if (req.query.businessUnitId) where.businessUnitId = req.query.businessUnitId;
    const announcements = await prisma.hbmsAnnouncement.findMany({
      where,
      include: { businessUnit: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ data: announcements });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load announcements');
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const body = String(req.body.body || '').trim();
    const kind = req.body.kind || 'GENERAL';
    if (!title) return res.status(400).json({ error: 'Announcement title is required' });
    if (!body) return res.status(400).json({ error: 'Announcement text is required' });
    if (!ANNOUNCEMENT_KINDS.includes(kind)) return res.status(400).json({ error: 'Choose an announcement type' });
    const businessUnitId = req.body.businessUnitId || null;
    const announcement = await prisma.hbmsAnnouncement.create({
      data: { title, body, kind, businessUnitId },
      include: { businessUnit: { select: { id: true, name: true } } },
    });
    const audience = announcement.businessUnit?.name || 'everyone';
    await notifyWorkers(await activeWorkerIds(businessUnitId), {
      kind: 'ANNOUNCEMENT',
      title,
      body,
      entityType: 'HbmsAnnouncement',
      entityId: announcement.id,
    });
    await writeAudit(req.userId, 'announcement.create', 'HbmsAnnouncement', announcement.id, { audience });
    res.status(201).json({ data: announcement });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to publish announcement');
  }
});

router.get('/meetings', async (req, res) => {
  try {
    const where = {};
    if (req.access.projectIds) {
      where.OR = [
        { projectId: { in: req.access.projectIds } },
        ...(req.access.employeeId ? [{ attendees: { some: { employeeId: req.access.employeeId } } }] : []),
      ];
    }
    if (req.query.projectId) {
      if (!allowsProject(req.access, req.query.projectId)) return res.json({ data: [] });
      where.projectId = req.query.projectId;
    }
    const meetings = await prisma.hbmsMeeting.findMany({
      where,
      include: meetingInclude,
      orderBy: { startsAt: 'desc' },
      take: 50,
    });
    res.json({ data: meetings });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load meetings');
  }
});

router.post('/meetings', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Meeting title is required' });
    const startsAt = parseDate(req.body.startsAt);
    const endsAt = parseDate(req.body.endsAt);
    if (!startsAt || startsAt.invalid) return res.status(400).json({ error: 'Meeting date is required' });
    if (endsAt?.invalid) return res.status(400).json({ error: 'Invalid end time' });
    const people = attendeeIds(req.body.attendeeIds);
    await assertWorkers(people);
    const meeting = await prisma.hbmsMeeting.create({
      data: {
        title,
        startsAt,
        endsAt: endsAt || null,
        projectId: req.body.projectId || null,
        location: req.body.location ? String(req.body.location).trim() : null,
        agenda: req.body.agenda ? String(req.body.agenda).trim() : null,
        notes: req.body.notes ? String(req.body.notes).trim() : null,
        attendees: { create: people.map((employeeId) => ({ employeeId })) },
      },
      include: meetingInclude,
    });
    await notifyWorkers(people, {
      kind: 'MEETING',
      title: `Meeting: ${meeting.title}`,
      body: meeting.location
        ? `You are invited. ${meeting.location}.`
        : 'You are invited.',
      entityType: 'HbmsMeeting',
      entityId: meeting.id,
    });
    await writeAudit(req.userId, 'meeting.create', 'HbmsMeeting', meeting.id, { title: meeting.title });
    res.status(201).json({ data: meeting });
  } catch (error) {
    sendError(res, error, 'Failed to schedule meeting');
  }
});

router.patch('/meetings/:id', async (req, res) => {
  try {
    const existing = await prisma.hbmsMeeting.findUnique({
      where: { id: req.params.id },
      include: { attendees: { select: { employeeId: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Meeting not found' });
    const data = {};
    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) return res.status(400).json({ error: 'Meeting title is required' });
      data.title = title;
    }
    if (req.body.startsAt !== undefined) {
      const startsAt = parseDate(req.body.startsAt);
      if (!startsAt || startsAt.invalid) return res.status(400).json({ error: 'Meeting date is required' });
      data.startsAt = startsAt;
    }
    if (req.body.endsAt !== undefined) {
      const endsAt = parseDate(req.body.endsAt);
      if (endsAt?.invalid) return res.status(400).json({ error: 'Invalid end time' });
      data.endsAt = endsAt;
    }
    if (req.body.location !== undefined) data.location = req.body.location ? String(req.body.location).trim() : null;
    if (req.body.agenda !== undefined) data.agenda = req.body.agenda ? String(req.body.agenda).trim() : null;
    if (req.body.notes !== undefined) data.notes = req.body.notes ? String(req.body.notes).trim() : null;
    if (req.body.minutes !== undefined) data.minutes = req.body.minutes ? String(req.body.minutes).trim() : null;
    if (req.body.projectId !== undefined) data.projectId = req.body.projectId || null;

    const nextAttendees = Array.isArray(req.body.attendeeIds) ? attendeeIds(req.body.attendeeIds) : null;
    if (nextAttendees) await assertWorkers(nextAttendees);

    const meeting = await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) {
        await tx.hbmsMeeting.update({ where: { id: existing.id }, data });
      }
      if (nextAttendees) {
        await tx.hbmsMeetingAttendee.deleteMany({ where: { meetingId: existing.id } });
        if (nextAttendees.length) {
          await tx.hbmsMeetingAttendee.createMany({
            data: nextAttendees.map((employeeId) => ({ meetingId: existing.id, employeeId })),
          });
        }
      }
      return tx.hbmsMeeting.findUnique({ where: { id: existing.id }, include: meetingInclude });
    });

    const previous = existing.attendees.map((item) => item.employeeId);
    const current = meeting.attendees.map((item) => item.employeeId);
    const added = nextAttendees ? current.filter((id) => !previous.includes(id)) : [];
    if (added.length) {
      await notifyWorkers(added, {
        kind: 'MEETING',
        title: `Meeting: ${meeting.title}`,
        body: 'You were added to this meeting.',
        entityType: 'HbmsMeeting',
        entityId: meeting.id,
      });
    }
    if (req.body.minutes !== undefined && data.minutes && data.minutes !== existing.minutes) {
      await notifyWorkers(current, {
        kind: 'MEETING',
        title: `Minutes: ${meeting.title}`,
        body: data.minutes,
        entityType: 'HbmsMeeting',
        entityId: meeting.id,
      });
    }
    res.json({ data: meeting });
  } catch (error) {
    sendError(res, error, 'Failed to update meeting');
  }
});

router.post('/meetings/:id/tasks', async (req, res) => {
  try {
    const meeting = await prisma.hbmsMeeting.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true, projectId: true },
    });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Task title is required' });
    const projectId = req.body.projectId || meeting.projectId;
    if (!projectId) return res.status(400).json({ error: 'Choose a project for the follow-up task' });
    const project = await prisma.hbmsProject.findUnique({ where: { id: projectId }, select: { id: true, name: true, code: true } });
    if (!project) return res.status(400).json({ error: 'Project not found' });
    const dueDate = parseDate(req.body.dueDate);
    if (dueDate?.invalid) return res.status(400).json({ error: 'Invalid due date' });
    const people = attendeeIds(req.body.assigneeIds);
    await assertWorkers(people);
    const priority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(req.body.priority) ? req.body.priority : 'MEDIUM';
    const actorUser = req.userId
      ? await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true } })
      : null;
    const actor = actorUser?.name || actorUser?.email || 'Someone';

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.hbmsTask.create({
        data: {
          title,
          projectId,
          meetingId: meeting.id,
          description: `Follow-up from the meeting “${meeting.title}”.`,
          priority,
          status: 'TODO',
          dueDate: dueDate ?? null,
        },
      });
      if (people.length) {
        await tx.hbmsTaskAssignee.createMany({
          data: people.map((employeeId) => ({ taskId: created.id, employeeId })),
        });
        for (const employeeId of people) {
          await ensureProjectMember(tx, projectId, employeeId);
        }
      }
      await tx.hbmsTaskEvent.create({
        data: {
          taskId: created.id,
          action: 'create',
          message: `${actor} created this follow-up from ${meeting.title}`,
        },
      });
      return tx.hbmsTask.findUnique({
        where: { id: created.id },
        include: {
          project: { select: { id: true, name: true, code: true } },
          assignees: { include: { employee: { select: personSelect } } },
        },
      });
    });

    await notifyWorkers(people, {
      kind: 'TASK_ASSIGNED',
      title: `Follow-up: ${task.title}`,
      body: `From ${meeting.title} · ${project.code}`,
      entityType: 'HbmsTask',
      entityId: task.id,
    });
    await writeAudit(req.userId, 'meeting.task', 'HbmsTask', task.id, { meetingId: meeting.id });
    res.status(201).json({ data: task });
  } catch (error) {
    sendError(res, error, 'Failed to create the follow-up task');
  }
});

module.exports = router;
