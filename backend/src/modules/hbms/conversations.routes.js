const express = require('express');
const { prisma, handlePrismaError, writeAudit } = require('./utils');
const { attachAccess } = require('./access');
const { notifyWorkers } = require('./notify');

const router = express.Router();
router.use(attachAccess);

const personSelect = { id: true, firstName: true, lastName: true, staffCode: true, departmentId: true, userId: true, photoKey: true };
const userSelect = { id: true, name: true, email: true };

function personName(person) {
  return person ? `${person.firstName} ${person.lastName}` : '';
}

function userLabel(user, employee) {
  if (employee) return personName(employee);
  return user?.name || user?.email || 'A user';
}

function accountOf(user, employee) {
  return {
    name: userLabel(user, employee),
    email: user?.email || '',
    employeeId: employee?.id || null,
    photoKey: employee?.photoKey || null,
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
  };
}

function clip(text) {
  const value = String(text || '').trim();
  return value.length > 140 ? `${value.slice(0, 137)}…` : value;
}

function isMine(member, req) {
  if (!member) return false;
  if (member.userId && member.userId === req.userId) return true;
  return Boolean(req.access.employeeId && member.employeeId === req.access.employeeId);
}

function messageIsMine(message, req) {
  if (message.authorUserId && message.authorUserId === req.userId) return true;
  return Boolean(req.access.employeeId && message.authorId === req.access.employeeId);
}

async function visibleDepartmentIds(access) {
  if (access.orgWide || access.hr) {
    const rows = await prisma.department.findMany({
      where: { OR: [{ employees: { some: { status: { not: 'INACTIVE' } } } }, { managerId: { not: null } }] },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }
  const ids = new Set(access.departmentIds || []);
  if (access.employee?.departmentId) ids.add(access.employee.departmentId);
  return [...ids];
}

async function ensureDepartmentConversation(departmentId) {
  const existing = await prisma.hbmsConversation.findUnique({ where: { departmentId } });
  const conversation = existing || await prisma.hbmsConversation.create({
    data: { kind: 'DEPARTMENT', departmentId },
  });
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: {
      id: true,
      name: true,
      managerId: true,
      businessUnit: { select: { name: true } },
      employees: { where: { status: { not: 'INACTIVE' } }, select: { id: true, userId: true } },
    },
  });
  if (!department) return null;
  const memberIds = new Set(department.employees.map((worker) => worker.id));
  if (department.managerId) memberIds.add(department.managerId);
  const current = await prisma.hbmsConversationMember.findMany({
    where: { conversationId: conversation.id },
    select: { id: true, employeeId: true, userId: true },
  });
  const currentEmployeeIds = new Set(current.map((member) => member.employeeId).filter(Boolean));
  const add = [...memberIds].filter((id) => !currentEmployeeIds.has(id));
  const remove = current.filter((member) => member.employeeId && !memberIds.has(member.employeeId)).map((member) => member.id);
  if (add.length) {
    const userByEmployee = new Map(department.employees.filter((worker) => worker.userId).map((worker) => [worker.id, worker.userId]));
    if (department.managerId && !userByEmployee.has(department.managerId)) {
      const manager = await prisma.employee.findUnique({ where: { id: department.managerId }, select: { userId: true } });
      if (manager?.userId) userByEmployee.set(department.managerId, manager.userId);
    }
    await prisma.hbmsConversationMember.createMany({
      data: add.map((employeeId) => ({
        conversationId: conversation.id,
        employeeId,
        userId: userByEmployee.get(employeeId) || null,
      })),
    });
  }
  if (remove.length) {
    await prisma.hbmsConversationMember.deleteMany({ where: { id: { in: remove } } });
  }
  return { conversation, department, memberIds };
}

function canSeeDepartment(access, departmentId, memberIds) {
  if (access.orgWide || access.hr) return true;
  if (access.employeeId && memberIds.has(access.employeeId)) return true;
  return (access.departmentIds || []).includes(departmentId);
}

function canSpeakAsDepartment(access, department) {
  if (!department) return false;
  if (access.orgWide || access.hr) return true;
  return Boolean(access.employeeId && department.managerId === access.employeeId);
}

const memberInclude = {
  employee: { select: personSelect },
  user: { select: userSelect },
};

async function loadConversation(id) {
  return prisma.hbmsConversation.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true, managerId: true, businessUnit: { select: { name: true } } } },
      members: { include: memberInclude },
    },
  });
}

async function canRead(access, conversation, userId) {
  if (!conversation) return false;
  if (conversation.kind === 'DIRECT') {
    return conversation.members.some((member) => member.userId === userId || (access.employeeId && member.employeeId === access.employeeId));
  }
  const ensured = await ensureDepartmentConversation(conversation.departmentId);
  return Boolean(ensured && canSeeDepartment(access, conversation.departmentId, ensured.memberIds));
}

function summaryOf(conversation, req) {
  const last = conversation.messages[0];
  const mine = conversation.members.find((member) => isMine(member, req));
  const unread = conversation.messages.filter((message) => !messageIsMine(message, req) && (!mine?.lastReadAt || message.createdAt > mine.lastReadAt)).length;
  if (conversation.kind === 'DEPARTMENT') {
    return {
      id: conversation.id,
      kind: conversation.kind,
      title: conversation.department?.name || 'Department',
      detail: conversation.department?.businessUnit?.name || 'Department',
      departmentId: conversation.departmentId,
      memberCount: conversation.members.length,
      lastBody: last ? clip(last.body) : '',
      lastAt: last?.createdAt || conversation.updatedAt,
      unread,
    };
  }
  const other = conversation.members.find((member) => !isMine(member, req));
  const account = accountOf(other?.user, other?.employee);
  return {
    id: conversation.id,
    kind: conversation.kind,
    title: account.name,
    detail: account.email || other?.employee?.staffCode || 'Direct message',
    employeeId: account.employeeId,
    photoKey: account.photoKey,
    firstName: account.firstName,
    lastName: account.lastName,
    departmentId: null,
    memberCount: conversation.members.length,
    lastBody: last ? clip(last.body) : '',
    lastAt: last?.createdAt || conversation.updatedAt,
    unread,
  };
}

async function messageableUsers(userId) {
  const users = await prisma.user.findMany({
    where: {
      NOT: { id: userId },
      OR: [
        { role: 'ADMIN' },
        { hbmsRoles: { some: {} } },
        { employeeProfile: { is: { status: { not: 'INACTIVE' } } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      employeeProfile: {
        select: {
          id: true,
          staffCode: true,
          firstName: true,
          lastName: true,
          photoKey: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
  });
  return users.map((user) => ({
    userId: user.id,
    employeeId: user.employeeProfile?.id || null,
    name: user.employeeProfile ? personName(user.employeeProfile) : (user.name || user.email),
    email: user.email,
    photoKey: user.employeeProfile?.photoKey || null,
    firstName: user.employeeProfile?.firstName || '',
    lastName: user.employeeProfile?.lastName || '',
    detail: [user.email, user.employeeProfile?.staffCode, user.employeeProfile?.department?.name].filter(Boolean).join(' · '),
  }));
}

async function findMessageableUser({ userId, employeeId }) {
  if (employeeId) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, status: { not: 'INACTIVE' } },
      select: { id: true, userId: true },
    });
    if (!employee) return { error: 'Worker not found', status: 404 };
    if (!employee.userId) return { error: 'This person has no login yet', status: 400 };
    return { userId: employee.userId, employeeId: employee.id };
  }
  const id = Number(userId);
  if (!id) return { error: 'Choose a person', status: 400 };
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      hbmsRoles: { select: { role: true }, take: 1 },
      employeeProfile: { select: { id: true, status: true } },
    },
  });
  if (!user) return { error: 'User not found', status: 404 };
  const staff = user.employeeProfile && user.employeeProfile.status !== 'INACTIVE';
  if (user.role !== 'ADMIN' && !user.hbmsRoles.length && !staff) {
    return { error: 'Choose a person in HBMS', status: 400 };
  }
  return { userId: user.id, employeeId: staff ? user.employeeProfile.id : null };
}

router.get('/', async (req, res) => {
  try {
    const me = req.access.employeeId;
    const departmentIds = await visibleDepartmentIds(req.access);
    for (const departmentId of departmentIds) {
      await ensureDepartmentConversation(departmentId);
    }
    const conversations = await prisma.hbmsConversation.findMany({
      where: {
        OR: [
          { kind: 'DIRECT', members: { some: { OR: [{ userId: req.userId }, ...(me ? [{ employeeId: me }] : [])] } } },
          ...(departmentIds.length ? [{ kind: 'DEPARTMENT', departmentId: { in: departmentIds } }] : []),
        ],
      },
      include: {
        department: { select: { id: true, name: true, businessUnit: { select: { name: true } } } },
        members: { include: memberInclude },
        messages: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({
      data: {
        me,
        canSend: true,
        conversations: conversations.map((conversation) => summaryOf(conversation, req)),
        people: await messageableUsers(req.userId),
      },
    });
  } catch (error) {
    handlePrismaError(res, error, 'Could not load conversations');
  }
});

router.post('/', async (req, res) => {
  try {
    const departmentId = req.body.departmentId || null;
    if (departmentId) {
      const ensured = await ensureDepartmentConversation(departmentId);
      if (!ensured) return res.status(404).json({ error: 'Department not found' });
      if (!canSeeDepartment(req.access, departmentId, ensured.memberIds)) {
        return res.status(403).json({ error: 'You are not in this department' });
      }
      return res.status(201).json({ data: { id: ensured.conversation.id } });
    }
    const other = await findMessageableUser(req.body);
    if (other.error) return res.status(other.status).json({ error: other.error });
    if (other.userId === req.userId) return res.status(400).json({ error: 'Choose another person' });
    const directKey = [`u${req.userId}`, `u${other.userId}`].sort().join(':');
    const existing = await prisma.hbmsConversation.findUnique({ where: { directKey } });
    if (existing) return res.status(201).json({ data: { id: existing.id } });
    const created = await prisma.hbmsConversation.create({
      data: {
        kind: 'DIRECT',
        directKey,
        members: {
          create: [
            { userId: req.userId, employeeId: req.access.employeeId || null },
            { userId: other.userId, employeeId: other.employeeId },
          ],
        },
      },
    });
    res.status(201).json({ data: { id: created.id } });
  } catch (error) {
    handlePrismaError(res, error, 'Could not open the conversation');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const conversation = await loadConversation(req.params.id);
    if (!conversation || !(await canRead(req.access, conversation, req.userId))) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const fresh = conversation.kind === 'DEPARTMENT' ? await loadConversation(req.params.id) : conversation;
    await prisma.hbmsConversationMember.updateMany({
      where: {
        conversationId: fresh.id,
        OR: [{ userId: req.userId }, ...(req.access.employeeId ? [{ employeeId: req.access.employeeId }] : [])],
      },
      data: { lastReadAt: new Date() },
    });
    const messages = await prisma.hbmsConversationMessage.findMany({
      where: { conversationId: fresh.id },
      include: { author: { select: personSelect }, authorUser: { select: userSelect } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    const other = fresh.members.find((member) => !isMine(member, req));
    const account = fresh.kind === 'DIRECT' ? accountOf(other?.user, other?.employee) : null;
    const canSend = fresh.kind === 'DIRECT'
      || Boolean(req.access.employeeId && fresh.members.some((member) => member.employeeId === req.access.employeeId))
      || req.access.orgWide
      || req.access.hr;
    res.json({
      data: {
        id: fresh.id,
        kind: fresh.kind,
        title: fresh.kind === 'DEPARTMENT' ? fresh.department?.name : account.name,
        detail: fresh.kind === 'DEPARTMENT'
          ? `${fresh.department?.businessUnit?.name || 'Department'} · ${fresh.members.length === 1 ? '1 person' : `${fresh.members.length} people`}`
          : (account.email || 'Direct message'),
        employeeId: account?.employeeId || null,
        photoKey: account?.photoKey || null,
        firstName: account?.firstName || '',
        lastName: account?.lastName || '',
        canSpeakAsDepartment: fresh.kind === 'DEPARTMENT' && canSpeakAsDepartment(req.access, fresh.department),
        canSend,
        members: fresh.members.map((member) => ({
          id: member.userId || member.employeeId,
          name: userLabel(member.user, member.employee),
          staffCode: member.employee?.staffCode || '',
        })),
        messages: messages.map((message) => ({
          id: message.id,
          body: message.body,
          createdAt: message.createdAt,
          mine: messageIsMine(message, req),
          asDepartment: message.asDepartment,
          author: userLabel(message.authorUser, message.author),
          departmentName: fresh.department?.name || null,
        })),
      },
    });
  } catch (error) {
    handlePrismaError(res, error, 'Could not open the conversation');
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const body = String(req.body.body || '').trim();
    if (!body) return res.status(400).json({ error: 'Write a message' });
    if (body.length > 2000) return res.status(400).json({ error: 'Keep the message under 2000 characters' });
    const conversation = await loadConversation(req.params.id);
    if (!conversation || !(await canRead(req.access, conversation, req.userId))) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const fresh = conversation.kind === 'DEPARTMENT' ? await loadConversation(req.params.id) : conversation;
    const member = fresh.members.some((item) => isMine(item, req));
    if (fresh.kind === 'DIRECT' && !member) return res.status(403).json({ error: 'You are not in this conversation' });
    if (fresh.kind === 'DEPARTMENT' && !member && !req.access.orgWide && !req.access.hr) {
      return res.status(403).json({ error: 'You are not in this conversation' });
    }
    const asDepartment = Boolean(req.body.asDepartment) && fresh.kind === 'DEPARTMENT' && canSpeakAsDepartment(req.access, fresh.department);
    if (req.body.asDepartment && !asDepartment) {
      return res.status(403).json({ error: 'Only the department manager can send as the department' });
    }
    const message = await prisma.hbmsConversationMessage.create({
      data: {
        conversationId: fresh.id,
        authorId: req.access.employeeId || null,
        authorUserId: req.userId,
        body,
        asDepartment,
      },
      include: { author: { select: personSelect }, authorUser: { select: userSelect } },
    });
    await prisma.hbmsConversation.update({ where: { id: fresh.id }, data: { updatedAt: new Date() } });
    const person = userLabel(message.authorUser, message.author);
    const speaker = asDepartment ? (fresh.department?.name || 'The department') : person;
    await notifyWorkers(
      fresh.members.map((item) => item.employeeId).filter((id) => id && id !== req.access.employeeId),
      {
        kind: 'CONVERSATION',
        title: asDepartment ? `${speaker} sent a department message` : `Message from ${speaker}`,
        body: clip(body),
        entityType: 'conversation',
        entityId: fresh.id,
      },
    );
    await writeAudit(req.userId, 'conversation.message', 'HbmsConversation', fresh.id, { asDepartment });
    res.status(201).json({
      data: {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt,
        mine: true,
        asDepartment,
        author: person,
        departmentName: fresh.department?.name || null,
      },
    });
  } catch (error) {
    handlePrismaError(res, error, 'Could not send the message');
  }
});

module.exports = router;
