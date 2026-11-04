const express = require('express');
const path = require('path');
const multer = require('multer');
const { attachAccess, guardWrites, canManageProject, canSeeTask, visibleTaskFilter } = require('./access');
const {
  prisma,
  TASK_PRIORITIES,
  TASK_STATUSES,
  OPEN_TASK_STATUSES,
  parsePagination,
  isOneOf,
  parseDate,
  handlePrismaError,
  writeAudit,
} = require('./utils');
const { notifyWorkers } = require('./notify');
const { publishEmployees } = require('./live');

async function signalTask(taskId) {
  if (!taskId) return;
  const task = await prisma.hbmsTask.findUnique({
    where: { id: taskId },
    select: { id: true, creatorId: true, assignees: { select: { employeeId: true } } },
  });
  if (!task) return;
  publishEmployees(
    [task.creatorId, ...task.assignees.map((item) => item.employeeId)],
    { type: 'tasks', taskId: task.id },
  ).catch(() => {});
}

const router = express.Router();
router.use(attachAccess);
router.use(guardWrites((req) => req.access.orgWide || req.access.departmentScope || req.access.managedProjectIds.length > 0 || Boolean(req.access.employeeId)));

const STATUS_LABEL = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  DONE: 'Completed',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
};

const PRIORITY_LABEL = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../../uploads'),
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^\w.\-]+/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|png|jpe?g|docx?|webp|zip|mp4|mp3)$/i.test(file.originalname);
    cb(allowed ? null : new Error('Upload a PDF, Office, image, audio, video, or zip file'), allowed);
  },
});

const taskInclude = {
  project: {
    select: {
      id: true,
      name: true,
      code: true,
      requiresApproval: true,
      businessUnit: { select: { id: true, code: true, name: true } },
    },
  },
  creator: { select: { id: true, firstName: true, lastName: true } },
  assignees: {
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, photoKey: true } },
    },
  },
  comments: {
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
  files: { orderBy: { createdAt: 'asc' } },
  checklist: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
};

const detailInclude = {
  ...taskInclude,
  events: { orderBy: { createdAt: 'desc' } },
};

function personName(person) {
  if (!person) return 'Unassigned';
  return `${person.firstName} ${person.lastName}`;
}

function formatDay(value) {
  if (!value) return 'none';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function managesTask(access, task) {
  if (!task) return false;
  if (access.orgWide) return true;
  const managed = new Set([...(access.managedProjectIds || []), ...(access.departmentProjectIds || [])]);
  return managed.has(task.projectId);
}

async function taskIsVisible(req) {
  const task = await prisma.hbmsTask.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      projectId: true,
      assignees: { select: { employeeId: true } },
    },
  });
  if (!task || !canSeeTask(req.access, task)) return null;
  return task;
}

async function actorLabel(userId) {
  if (!userId) return 'Someone';
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { name: true },
  });
  return user?.name || 'Admin';
}

async function addEvent(tx, taskId, action, message) {
  await tx.hbmsTaskEvent.create({
    data: { taskId, action, message },
  });
}

function parseProgress(value) {
  if (value === undefined) return undefined;
  const progress = Number(value);
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) return { invalid: true };
  return progress;
}

function resolveStatus(existing, nextStatus) {
  if (!isOneOf(nextStatus, TASK_STATUSES)) return { error: 'Invalid status' };
  if (nextStatus === existing.status) return { data: {} };
  if (nextStatus === 'IN_REVIEW') {
    if (!existing.project.requiresApproval) {
      return { error: 'This project does not require manager approval. Mark the task completed when the work is done.' };
    }
    if (!['TODO', 'IN_PROGRESS', 'BLOCKED'].includes(existing.status)) {
      return { error: 'Only open work can be sent for review' };
    }
    return { data: { status: 'IN_REVIEW', reviewNote: null }, message: 'submitted this task for review' };
  }
  if (nextStatus === 'DONE') {
    if (existing.project.requiresApproval) {
      return { error: 'This project requires manager approval. Mark the task ready for review, then a manager can approve it.' };
    }
    if (existing.status === 'CANCELLED') {
      return { error: 'A cancelled task cannot be completed' };
    }
    return { data: { status: 'DONE', progress: 100 }, message: 'marked this task completed' };
  }
  if (!['TODO', 'IN_PROGRESS', 'BLOCKED', 'CANCELLED'].includes(nextStatus)) {
    return { error: 'Invalid status' };
  }
  return {
    data: { status: nextStatus },
    message: `changed the status from ${STATUS_LABEL[existing.status]} to ${STATUS_LABEL[nextStatus]}`,
  };
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

async function replaceAssignees(tx, taskId, assigneeIds) {
  await tx.hbmsTaskAssignee.deleteMany({ where: { taskId } });
  if (!assigneeIds?.length) return;
  await tx.hbmsTaskAssignee.createMany({
    data: assigneeIds.map((employeeId) => ({ taskId, employeeId })),
  });
}

function checklistLines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•●▪‣·]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

async function refreshChecklistProgress(tx, taskId) {
  const items = await tx.hbmsTaskChecklistItem.findMany({
    where: { taskId },
    select: { done: true },
  });
  if (!items.length) return null;
  const progress = Math.round((items.filter((item) => item.done).length / items.length) * 100);
  await tx.hbmsTask.update({ where: { id: taskId }, data: { progress } });
  return progress;
}

router.get('/workspace', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        staffCode: true,
        businessUnit: { select: { name: true } },
      },
    });
    res.json({ data: { employee: employee || null } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load workspace');
  }
});

router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const where = {};
    const visibility = visibleTaskFilter(req.access);
    if (visibility) where.AND = [...(where.AND || []), visibility];
    if (req.query.projectId) {
      if (req.access.projectIds && !req.access.projectIds.includes(req.query.projectId)) {
        return res.json({ data: [], meta: { page, limit, total: 0 } });
      }
      where.projectId = req.query.projectId;
    } else if (!visibility && req.access.projectIds) where.projectId = { in: req.access.projectIds };
    if (req.query.priority) where.priority = req.query.priority;
    if (req.query.assigneeId) {
      where.assignees = { some: { employeeId: req.query.assigneeId } };
    }
    if (req.query.businessUnitId) {
      where.project = { businessUnitId: req.query.businessUnitId };
    }
    if (req.query.overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = req.query.status ? req.query.status : { in: OPEN_TASK_STATUSES };
    } else if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.q) {
      const q = String(req.query.q).trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, tasks] = await Promise.all([
      prisma.hbmsTask.count({ where }),
      prisma.hbmsTask.findMany({
        where,
        include: taskInclude,
        orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    res.json({ data: tasks, meta: { page, limit, total } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load tasks');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await prisma.hbmsTask.findUnique({
      where: { id: req.params.id },
      include: detailInclude,
    });
    if (!task || !canSeeTask(req.access, task)) return res.status(404).json({ error: 'Task not found' });
    res.json({ data: task });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load task');
  }
});

router.post('/', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const { projectId, description, priority, assigneeIds, creatorId } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });
    if (!projectId) return res.status(400).json({ error: 'Project is required' });
    const parentProject = await prisma.hbmsProject.findUnique({
      where: { id: projectId },
      select: { id: true, departments: { select: { departmentId: true } } },
    });
    if (!parentProject || !canManageProject(req.access, parentProject)) {
      return res.status(403).json({ error: 'You do not have permission to add tasks to this project' });
    }
    if (priority && !isOneOf(priority, TASK_PRIORITIES)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }
    const dueDate = parseDate(req.body.dueDate);
    const startDate = parseDate(req.body.startDate);
    if (dueDate?.invalid || startDate?.invalid) return res.status(400).json({ error: 'Invalid date' });
    const progress = parseProgress(req.body.progress);
    if (progress?.invalid) return res.status(400).json({ error: 'Progress must be a whole number from 0 to 100' });
    const openStatuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'CANCELLED'];
    if (req.body.status && !openStatuses.includes(req.body.status)) {
      return res.status(400).json({ error: 'A new task starts as to do, in progress, blocked, or cancelled' });
    }

    const actor = await actorLabel(req.userId);
    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.hbmsTask.create({
        data: {
          title,
          projectId,
          description: description ? String(description).trim() : null,
          priority: priority || 'MEDIUM',
          status: req.body.status || 'TODO',
          startDate: startDate ?? null,
          dueDate: dueDate ?? null,
          progress: progress ?? 0,
          creatorId: creatorId || null,
        },
      });
      if (Array.isArray(assigneeIds) && assigneeIds.length) {
        await replaceAssignees(tx, created.id, assigneeIds);
        for (const employeeId of assigneeIds) {
          await ensureProjectMember(tx, projectId, employeeId);
        }
      }
      await addEvent(tx, created.id, 'create', `${actor} created this task`);
      return tx.hbmsTask.findUnique({ where: { id: created.id }, include: detailInclude });
    });

    await writeAudit(req.userId, 'task.create', 'HbmsTask', task.id, {
      projectId: task.projectId,
      title: task.title,
    });
    await notifyWorkers(task.assignees.map((item) => item.employee.id), {
      kind: 'TASK_ASSIGNED',
      title: `Task assigned: ${task.title}`,
      body: task.project?.name || null,
      entityType: 'HbmsTask',
      entityId: task.id,
    });
    signalTask(task.id);
    res.status(201).json({ data: task });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to create task');
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.hbmsTask.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { id: true, requiresApproval: true, departments: { select: { departmentId: true } } } },
        assignees: { include: { employee: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    const manages = canManageProject(req.access, existing.project);
    const assigned = existing.assignees.some((item) => item.employeeId === req.access.employeeId);
    if (!manages && !assigned) return res.status(403).json({ error: 'You do not have permission to change this task' });

    const data = {};
    const notes = [];
    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) return res.status(400).json({ error: 'Task title is required' });
      if (title !== existing.title) notes.push(`renamed it to "${title}"`);
      data.title = title;
    }
    if (req.body.description !== undefined) {
      const description = req.body.description ? String(req.body.description).trim() : null;
      if (description !== existing.description) notes.push(description ? 'updated the description' : 'cleared the description');
      data.description = description;
    }
    if (req.body.priority !== undefined) {
      if (!isOneOf(req.body.priority, TASK_PRIORITIES)) {
        return res.status(400).json({ error: 'Invalid priority' });
      }
      if (req.body.priority !== existing.priority) {
        notes.push(`set the priority to ${PRIORITY_LABEL[req.body.priority]}`);
      }
      data.priority = req.body.priority;
    }
    if (req.body.startDate !== undefined) {
      const startDate = parseDate(req.body.startDate);
      if (startDate?.invalid) return res.status(400).json({ error: 'Invalid start date' });
      data.startDate = startDate;
      if (formatDay(startDate) !== formatDay(existing.startDate)) notes.push(`set the start date to ${formatDay(startDate)}`);
    }
    if (req.body.dueDate !== undefined) {
      const dueDate = parseDate(req.body.dueDate);
      if (dueDate?.invalid) return res.status(400).json({ error: 'Invalid due date' });
      data.dueDate = dueDate;
      if (formatDay(dueDate) !== formatDay(existing.dueDate)) notes.push(`set the deadline to ${formatDay(dueDate)}`);
    }
    if (req.body.progress !== undefined) {
      const progress = parseProgress(req.body.progress);
      if (progress?.invalid) return res.status(400).json({ error: 'Progress must be a whole number from 0 to 100' });
      if (progress !== existing.progress) notes.push(`updated progress to ${progress}%`);
      data.progress = progress;
    }
    if (req.body.status !== undefined) {
      const change = resolveStatus(existing, req.body.status);
      if (change.error) return res.status(400).json({ error: change.error });
      Object.assign(data, change.data);
      if (change.message) notes.push(change.message);
    }

    const actor = await actorLabel(req.userId);
    const previousIds = existing.assignees.map((item) => item.employeeId);
    const task = await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) {
        await tx.hbmsTask.update({ where: { id: req.params.id }, data });
      }
      if (Array.isArray(req.body.assigneeIds)) {
        const before = existing.assignees.map((item) => personName(item.employee)).sort().join(', ') || 'nobody';
        await replaceAssignees(tx, req.params.id, req.body.assigneeIds);
        for (const employeeId of req.body.assigneeIds) {
          await ensureProjectMember(tx, existing.projectId, employeeId);
        }
        const people = req.body.assigneeIds.length
          ? await tx.employee.findMany({
            where: { id: { in: req.body.assigneeIds } },
            select: { firstName: true, lastName: true },
          })
          : [];
        const after = people.map(personName).sort().join(', ') || 'nobody';
        if (before !== after) notes.push(`assigned it to ${after}`);
      }
      for (const note of notes) {
        await addEvent(tx, req.params.id, 'update', `${actor} ${note}`);
      }
      return tx.hbmsTask.findUnique({ where: { id: req.params.id }, include: detailInclude });
    });

    const nextIds = Array.isArray(req.body.assigneeIds)
      ? req.body.assigneeIds.filter(Boolean)
      : previousIds;
    const added = nextIds.filter((id) => !previousIds.includes(id));
    const stillAssigned = nextIds.filter((id) => previousIds.includes(id));
    const removed = previousIds.filter((id) => !nextIds.includes(id));
    const contentNotes = notes.filter((note) => !note.startsWith('assigned it'));
    if (added.length) {
      await notifyWorkers(added, {
        kind: 'TASK_ASSIGNED',
        title: `Task assigned: ${task.title}`,
        body: task.project?.name || null,
        entityType: 'HbmsTask',
        entityId: task.id,
      });
    }
    if (contentNotes.length && stillAssigned.length) {
      await notifyWorkers(stillAssigned, {
        kind: 'TASK_UPDATED',
        title: `Task updated: ${task.title}`,
        body: contentNotes.join('. '),
        entityType: 'HbmsTask',
        entityId: task.id,
      });
    }
    if (removed.length) {
      await notifyWorkers(removed, {
        kind: 'TASK_UPDATED',
        title: `Task updated: ${task.title}`,
        body: 'You are no longer assigned to this task.',
        entityType: 'HbmsTask',
        entityId: task.id,
      });
    }

    signalTask(task.id);
    res.json({ data: task });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to update task');
  }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const body = String(req.body.body || '').trim();
    if (!body) return res.status(400).json({ error: 'Comment is required' });
    if (!(await taskIsVisible(req))) return res.status(404).json({ error: 'Task not found' });
    const actor = await actorLabel(req.userId);

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.hbmsTaskComment.create({
        data: {
          taskId: req.params.id,
          body,
          authorId: req.body.authorId || null,
        },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      await addEvent(tx, req.params.id, 'comment', `${actor} commented`);
      return created;
    });
    signalTask(req.params.id);
    res.status(201).json({ data: comment });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to add comment');
  }
});

router.post('/:id/checklist', async (req, res) => {
  try {
    const labels = Array.isArray(req.body.labels)
      ? req.body.labels.flatMap((item) => checklistLines(item))
      : req.body.text != null
        ? checklistLines(req.body.text)
        : checklistLines(req.body.label);
    if (!labels.length) return res.status(400).json({ error: 'Checklist item is required' });
    if (labels.length > 80) return res.status(400).json({ error: 'Paste up to 80 steps at a time' });
    const task = await taskIsVisible(req);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!managesTask(req.access, task)) return res.status(403).json({ error: 'You do not have permission to add checklist steps' });
    const actor = await actorLabel(req.userId);
    const count = await prisma.hbmsTaskChecklistItem.count({ where: { taskId: task.id } });

    const items = await prisma.$transaction(async (tx) => {
      const created = [];
      for (let index = 0; index < labels.length; index += 1) {
        created.push(await tx.hbmsTaskChecklistItem.create({
          data: { taskId: task.id, label: labels[index], position: count + index },
        }));
      }
      await refreshChecklistProgress(tx, task.id);
      const message = labels.length === 1
        ? `${actor} added "${labels[0]}" to the checklist`
        : `${actor} added ${labels.length} checklist steps`;
      await addEvent(tx, task.id, 'checklist', message);
      return created;
    });
    signalTask(req.params.id);
    res.status(201).json({ data: items.length === 1 ? items[0] : items });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to add checklist item');
  }
});

router.patch('/:id/checklist/:itemId', async (req, res) => {
  try {
    const existing = await prisma.hbmsTaskChecklistItem.findFirst({
      where: { id: req.params.itemId, taskId: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: 'Checklist item not found' });
    const task = await taskIsVisible(req);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const assigned = task.assignees.some((item) => item.employeeId === req.access.employeeId);
    const manages = managesTask(req.access, task);
    if (!assigned && !manages) return res.status(403).json({ error: 'You do not have permission to change this checklist' });
    if (req.body.label !== undefined && !manages) {
      return res.status(403).json({ error: 'You can tick steps on a task assigned to you' });
    }
    const data = {};
    if (req.body.label !== undefined) {
      const label = String(req.body.label).trim();
      if (!label) return res.status(400).json({ error: 'Checklist item is required' });
      data.label = label;
    }
    if (req.body.done !== undefined) data.done = Boolean(req.body.done);
    const actor = await actorLabel(req.userId);

    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.hbmsTaskChecklistItem.update({ where: { id: existing.id }, data });
      const progress = await refreshChecklistProgress(tx, existing.taskId);
      if (req.body.done !== undefined && Boolean(req.body.done) !== existing.done) {
        const verb = updated.done ? 'checked off' : 'reopened';
        const progressNote = progress == null ? '' : ` Progress is ${progress}%.`;
        await addEvent(tx, existing.taskId, 'checklist', `${actor} ${verb} "${updated.label}".${progressNote}`);
      }
      return updated;
    });
    signalTask(existing.taskId);
    res.json({ data: item });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to update checklist item');
  }
});

router.delete('/:id/checklist/:itemId', async (req, res) => {
  try {
    const existing = await prisma.hbmsTaskChecklistItem.findFirst({
      where: { id: req.params.itemId, taskId: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: 'Checklist item not found' });
    const task = await taskIsVisible(req);
    if (!task || !managesTask(req.access, task)) return res.status(403).json({ error: 'You do not have permission to remove checklist steps' });
    const actor = await actorLabel(req.userId);
    await prisma.$transaction(async (tx) => {
      await tx.hbmsTaskChecklistItem.delete({ where: { id: existing.id } });
      await refreshChecklistProgress(tx, existing.taskId);
      await addEvent(tx, existing.taskId, 'checklist', `${actor} removed "${existing.label}" from the checklist`);
    });
    signalTask(existing.taskId);
    res.json({ data: { removed: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to remove checklist item');
  }
});

router.post('/:id/submit-review', async (req, res) => {
  try {
    const existing = await prisma.hbmsTask.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { requiresApproval: true } },
        assignees: { select: { employeeId: true } },
      },
    });
    if (!existing || !canSeeTask(req.access, existing)) return res.status(404).json({ error: 'Task not found' });
    const change = resolveStatus(existing, 'IN_REVIEW');
    if (change.error) return res.status(400).json({ error: change.error });
    const actor = await actorLabel(req.userId);

    const task = await prisma.$transaction(async (tx) => {
      await tx.hbmsTask.update({ where: { id: existing.id }, data: change.data });
      await addEvent(tx, existing.id, 'review', `${actor} ${change.message}`);
      return tx.hbmsTask.findUnique({ where: { id: existing.id }, include: detailInclude });
    });
    await writeAudit(req.userId, 'task.submit_review', 'HbmsTask', task.id, {});
    signalTask(task.id);
    res.json({ data: task });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to submit task for review');
  }
});

router.post('/:id/review', async (req, res) => {
  try {
    const decision = req.body.decision;
    if (!['APPROVED', 'CHANGES_REQUESTED'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be APPROVED or CHANGES_REQUESTED' });
    }
    const existing = await prisma.hbmsTask.findUnique({
      where: { id: req.params.id },
      include: { project: { select: { id: true, requiresApproval: true, departments: { select: { departmentId: true } } } } },
    });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    if (!canManageProject(req.access, existing.project)) {
      return res.status(403).json({ error: 'You do not have permission to review this task' });
    }
    if (existing.status !== 'IN_REVIEW') {
      return res.status(400).json({ error: 'Task is not waiting for review' });
    }
    if (!existing.project.requiresApproval) {
      return res.status(400).json({ error: 'This project does not require manager approval' });
    }

    const actor = await actorLabel(req.userId);
    const note = req.body.note ? String(req.body.note).trim() : null;
    const task = await prisma.$transaction(async (tx) => {
      await tx.hbmsTask.update({
        where: { id: existing.id },
        data: {
          status: decision === 'APPROVED' ? 'DONE' : 'IN_PROGRESS',
          progress: decision === 'APPROVED' ? 100 : existing.progress,
          reviewNote: note,
          reviewedAt: new Date(),
        },
      });
      const message = decision === 'APPROVED'
        ? `${actor} approved the work and marked it completed`
        : `${actor} asked for changes${note ? `: ${note}` : ''}`;
      await addEvent(tx, existing.id, 'review', message);
      return tx.hbmsTask.findUnique({ where: { id: existing.id }, include: detailInclude });
    });
    await writeAudit(req.userId, 'task.review', 'HbmsTask', task.id, { decision });
    signalTask(task.id);
    res.json({ data: task });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to review task');
  }
});

router.post('/:id/files', (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) return res.status(400).json({ error: error.message || 'Upload failed' });
    return next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose a file to upload' });
    const task = await taskIsVisible(req);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const actor = await actorLabel(req.userId);
    const file = await prisma.$transaction(async (tx) => {
      const created = await tx.hbmsTaskFile.create({
        data: {
          taskId: task.id,
          title: String(req.body.title || req.file.originalname).trim(),
          fileName: req.file.originalname,
          fileUrl: `/uploads/${req.file.filename}`,
        },
      });
      await addEvent(tx, task.id, 'file', `${actor} attached ${created.title}`);
      return created;
    });
    await writeAudit(req.userId, 'task.file', 'HbmsTask', task.id, { title: file.title });
    signalTask(task.id);
    res.status(201).json({ data: file });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to store task file');
  }
});

router.delete('/:id/files/:fileId', async (req, res) => {
  try {
    const existing = await prisma.hbmsTaskFile.findFirst({
      where: { id: req.params.fileId, taskId: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: 'File not found' });
    if (!(await taskIsVisible(req))) return res.status(404).json({ error: 'Task not found' });
    const actor = await actorLabel(req.userId);
    await prisma.$transaction(async (tx) => {
      await tx.hbmsTaskFile.delete({ where: { id: existing.id } });
      await addEvent(tx, req.params.id, 'file', `${actor} removed ${existing.title}`);
    });
    signalTask(req.params.id);
    res.json({ data: { removed: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to remove task file');
  }
});

module.exports = router;
