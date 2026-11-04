const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { prisma, handlePrismaError, writeAudit } = require('./utils');
const { attachAccess } = require('./access');
const { notifyWorkers } = require('./notify');
const { publishUsers, publishEmployees, isUserConnected } = require('./live');
const { firstUrl, readLinkPreview, presentLink } = require('./linkPreview');
const { sendPush } = require('./push');
const { EXPIRED_LABEL, voiceExpired } = require('./voiceExpiry');

const router = express.Router();
router.use(attachAccess);

const voiceDir = path.join(__dirname, '../../../uploads');
fs.mkdirSync(voiceDir, { recursive: true });

function audioExtension(file) {
  const fromName = path.extname(file.originalname || '').toLowerCase();
  if (/^\.(m4a|aac|mp3|wav|webm|ogg|mp4)$/.test(fromName)) return fromName;
  const type = String(file.mimetype || '').toLowerCase();
  if (type.includes('webm')) return '.webm';
  if (type.includes('ogg')) return '.ogg';
  if (type.includes('wav')) return '.wav';
  if (type.includes('mpeg') || type.includes('mp3')) return '.mp3';
  return '.m4a';
}

function isVoiceUpload(file) {
  const type = String(file.mimetype || '').toLowerCase().split(';')[0].trim();
  if (type.startsWith('audio/') || type === 'video/webm' || type === 'application/octet-stream') return true;
  return /^\.(m4a|aac|mp3|wav|webm|ogg|mp4)$/.test(path.extname(file.originalname || '').toLowerCase());
}

const voiceUpload = multer({
  storage: multer.diskStorage({
    destination: voiceDir,
    filename: (req, file, cb) => {
      cb(null, `voice-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${audioExtension(file)}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(isVoiceUpload(file) ? null : new Error('Record a voice message'), isVoiceUpload(file));
  },
});

function acceptVoice(req, res, next) {
  voiceUpload.single('audio')(req, res, (error) => {
    if (!error) return next();
    const tooBig = error.code === 'LIMIT_FILE_SIZE';
    res.status(400).json({ error: tooBig ? 'That voice message is too long' : 'Could not save the voice message' });
  });
}

function discardUpload(filePath) {
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {});
}

const personSelect = { id: true, firstName: true, lastName: true, staffCode: true, departmentId: true, userId: true, photoKey: true };
const userSelect = { id: true, name: true, email: true, lastSeenAt: true };

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

function voiceClock(ms) {
  const total = Math.max(0, Math.round((Number(ms) || 0) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function messagePreview(message) {
  if (!message) return '';
  const spoken = String(message.body || '').trim();
  if (voiceExpired(message) && !spoken) return EXPIRED_LABEL;
  if (message.audioUrl && !spoken) {
    const ms = Number(message.audioDuration) || 0;
    return ms ? `Voice message · ${voiceClock(ms)}` : 'Voice message';
  }
  return clip(message.body);
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

const messageInclude = {
  author: { select: personSelect },
  authorUser: { select: userSelect },
  reactions: { select: { emoji: true, userId: true } },
  replyTo: {
    select: {
      id: true,
      body: true,
      audioUrl: true,
      createdAt: true,
      asDepartment: true,
      authorId: true,
      authorUserId: true,
      author: { select: personSelect },
      authorUser: { select: userSelect },
    },
  },
};

function presenceOf(members, req) {
  const others = (members || []).filter((member) => !isMine(member, req) && member.userId);
  if (!others.length) return null;
  const online = others.some((member) => isUserConnected(member.userId));
  const seen = others
    .map((member) => member.user?.lastSeenAt)
    .filter(Boolean)
    .sort((left, right) => new Date(right) - new Date(left))[0] || null;
  return {
    userId: others.length === 1 ? others[0].userId : null,
    online,
    lastSeenAt: online || !seen ? null : new Date(seen).toISOString(),
  };
}

function receiptOf(message, req, members) {
  if (!messageIsMine(message, req)) return null;
  const others = (members || []).filter((member) => !isMine(member, req));
  if (!others.length) return 'sent';
  const sentAt = new Date(message.createdAt).getTime();
  const read = others.every((member) => member.lastReadAt && new Date(member.lastReadAt).getTime() >= sentAt);
  if (read) return 'read';
  const delivered = others.every((member) => member.lastDeliveredAt && new Date(member.lastDeliveredAt).getTime() >= sentAt);
  return delivered ? 'delivered' : 'sent';
}

async function noteDelivered(req, conversations) {
  const now = new Date();
  const pending = [];
  for (const conversation of conversations || []) {
    const mine = (conversation.members || []).find((member) => isMine(member, req));
    const incoming = (conversation.messages || []).find((message) => !messageIsMine(message, req));
    if (!mine || !incoming) continue;
    const delivered = mine.lastDeliveredAt ? new Date(mine.lastDeliveredAt).getTime() : 0;
    if (delivered >= new Date(incoming.createdAt).getTime()) continue;
    pending.push({ id: mine.id, conversation });
  }
  if (!pending.length) return;
  await prisma.hbmsConversationMember.updateMany({
    where: { id: { in: pending.map((item) => item.id) } },
    data: { lastDeliveredAt: now },
  });
  for (const item of pending) {
    publishUsers(
      item.conversation.members.filter((member) => !isMine(member, req)).map((member) => member.userId).filter(Boolean),
      { type: 'delivered', conversationId: item.conversation.id },
    );
  }
}

function presentMessage(message, req, departmentName, members) {
  const grouped = new Map();
  for (const reaction of message.reactions || []) {
    const row = grouped.get(reaction.emoji) || { emoji: reaction.emoji, count: 0, mine: false };
    row.count += 1;
    if (Number(reaction.userId) === Number(req.userId)) row.mine = true;
    grouped.set(reaction.emoji, row);
  }
  const expired = voiceExpired(message);
  const spoken = String(message.body || '').trim();
  return {
    id: message.id,
    body: expired && !spoken ? EXPIRED_LABEL : message.body,
    audio: message.audioUrl && !expired ? {
      url: message.audioUrl,
      duration: Number(message.audioDuration) || 0,
    } : null,
    forwarded: Boolean(message.forwarded),
    createdAt: message.createdAt,
    mine: messageIsMine(message, req),
    asDepartment: message.asDepartment,
    author: userLabel(message.authorUser, message.author),
    authorEmployeeId: message.author?.id || null,
    authorPhotoKey: message.author?.photoKey || null,
    departmentName: departmentName || null,
    reply: message.replyTo ? {
      id: message.replyTo.id,
      body: messagePreview(message.replyTo),
      author: message.replyTo.asDepartment
        ? (departmentName || 'Department')
        : userLabel(message.replyTo.authorUser, message.replyTo.author),
      mine: messageIsMine(message.replyTo, req),
    } : null,
    reactions: [...grouped.values()],
    receipt: receiptOf(message, req, members),
    link: presentLink(message.linkPreview),
  };
}

function attachPreview(message, members) {
  if (!message || message.linkPreview || !firstUrl(message.body)) return;
  readLinkPreview(firstUrl(message.body)).then(async (link) => {
    if (!link) return;
    await prisma.hbmsConversationMessage.update({ where: { id: message.id }, data: { linkPreview: link } });
    publishUsers((members || []).map((member) => member.userId), {
      type: 'link',
      conversationId: message.conversationId,
      messageId: message.id,
      link: presentLink(link),
    });
  }).catch(() => {});
}

async function visibleDepartmentIds(access) {
  if (access.orgWide) {
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
  if (access.orgWide) return true;
  if (access.employeeId && memberIds.has(access.employeeId)) return true;
  return (access.departmentIds || []).includes(departmentId);
}

function canSpeakAsDepartment(access, department) {
  if (!department) return false;
  if (access.orgWide) return true;
  return Boolean(access.employeeId && department.managerId === access.employeeId);
}

function worksOnProject(access, projectId) {
  if (!projectId || !access.employeeId) return false;
  if (access.orgWide) return true;
  return (access.memberProjectIds || []).includes(projectId) || (access.managedProjectIds || []).includes(projectId);
}

function isProjectAdmin(access, conversation) {
  if (!conversation || conversation.kind !== 'PROJECT') return false;
  if (access.orgWide) return true;
  if (!access.employeeId) return false;
  if (conversation.createdById === access.employeeId) return true;
  return conversation.project?.managerId === access.employeeId;
}

async function projectTeam(projectId) {
  const project = await prisma.hbmsProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
      managerId: true,
      businessUnit: { select: { code: true, name: true } },
      manager: { select: { id: true, userId: true, status: true } },
      members: {
        where: { employee: { status: { not: 'INACTIVE' } } },
        select: { employee: { select: { id: true, userId: true } } },
      },
    },
  });
  if (!project) return null;
  const people = new Map();
  for (const member of project.members) people.set(member.employee.id, member.employee.userId || null);
  if (project.manager && project.manager.status !== 'INACTIVE') {
    people.set(project.manager.id, project.manager.userId || null);
  }
  return { project, people };
}

async function syncProjectMembers(conversationId, people) {
  const current = await prisma.hbmsConversationMember.findMany({
    where: { conversationId },
    select: { id: true, employeeId: true },
  });
  const wanted = new Set(people.keys());
  const remove = current.filter((member) => member.employeeId && !wanted.has(member.employeeId)).map((member) => member.id);
  const present = new Set(current.map((member) => member.employeeId).filter(Boolean));
  const add = [...people.entries()].filter(([employeeId]) => !present.has(employeeId));
  if (remove.length) await prisma.hbmsConversationMember.deleteMany({ where: { id: { in: remove } } });
  if (add.length) {
    await prisma.hbmsConversationMember.createMany({
      data: add.map(([employeeId, userId]) => ({ conversationId, employeeId, userId })),
    });
  }
}

const memberInclude = {
  employee: { select: personSelect },
  user: { select: userSelect },
};

async function loadConversation(id) {
  return prisma.hbmsConversation.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true, managerId: true, businessUnit: { select: { code: true, name: true } } } },
      project: { select: { id: true, name: true, code: true, managerId: true, businessUnit: { select: { code: true, name: true } } } },
      members: { include: memberInclude },
    },
  });
}

async function canRead(access, conversation, userId) {
  if (!conversation) return false;
  const member = conversation.members.some((item) => item.userId === userId || (access.employeeId && item.employeeId === access.employeeId));
  if (conversation.kind === 'DIRECT') return member;
  if (conversation.kind === 'PROJECT') return member || isProjectAdmin(access, conversation);
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
      unitCode: conversation.department?.businessUnit?.code || null,
      unitName: conversation.department?.businessUnit?.name || 'Business unit',
      departmentId: conversation.departmentId,
      memberCount: conversation.members.length,
      lastBody: messagePreview(last),
      lastAt: last?.createdAt || conversation.updatedAt,
      unread,
    };
  }
  if (conversation.kind === 'PROJECT') {
    return {
      id: conversation.id,
      kind: conversation.kind,
      title: conversation.project?.name || 'Project',
      detail: conversation.project?.code || 'Project group',
      unitCode: conversation.project?.businessUnit?.code || null,
      unitName: conversation.project?.businessUnit?.name || 'Project',
      projectId: conversation.projectId,
      memberCount: conversation.members.length,
      canManage: isProjectAdmin(req.access, conversation),
      lastBody: messagePreview(last),
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
    lastBody: messagePreview(last),
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
    const mine = [{ userId: req.userId }, ...(me ? [{ employeeId: me }] : [])];
    const projectIds = req.access.orgWide
      ? null
      : [...new Set([...(req.access.memberProjectIds || []), ...(req.access.managedProjectIds || [])])];
    const [conversations, projects] = await Promise.all([
      prisma.hbmsConversation.findMany({
        where: {
          OR: [
            { kind: 'DIRECT', members: { some: { OR: mine } } },
            { kind: 'PROJECT', ...(req.access.orgWide ? {} : { members: { some: { OR: mine } } }) },
            ...(departmentIds.length ? [{ kind: 'DEPARTMENT', departmentId: { in: departmentIds } }] : []),
          ],
        },
        include: {
          department: { select: { id: true, name: true, businessUnit: { select: { code: true, name: true } } } },
          project: { select: { id: true, name: true, code: true, managerId: true, businessUnit: { select: { code: true, name: true } } } },
          members: { include: memberInclude },
          messages: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.hbmsProject.findMany({
        where: {
          status: { not: 'CANCELLED' },
          ...(projectIds ? { id: { in: projectIds } } : {}),
        },
        select: {
          id: true,
          name: true,
          code: true,
          businessUnit: { select: { code: true, name: true } },
          members: { where: { employee: { status: { not: 'INACTIVE' } } }, select: { employeeId: true } },
          manager: { select: { id: true, status: true } },
          conversation: {
            select: {
              id: true,
              ...(me ? { members: { where: { employeeId: me }, select: { id: true } } } : {}),
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);
    await noteDelivered(req, conversations);
    res.json({
      data: {
        me,
        canSend: true,
        conversations: conversations.map((conversation) => summaryOf(conversation, req)),
        people: await messageableUsers(req.userId),
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
          code: project.code,
          unitCode: project.businessUnit?.code || null,
          unitName: project.businessUnit?.name || '',
          memberCount: project.members.length + (project.manager && project.manager.status !== 'INACTIVE' && !project.members.some((member) => member.employeeId === project.manager.id) ? 1 : 0),
          conversationId: project.conversation?.id || null,
          joined: Boolean(project.conversation?.members?.length),
        })),
      },
    });
  } catch (error) {
    handlePrismaError(res, error, 'Could not load conversations');
  }
});

router.post('/', async (req, res) => {
  try {
    const projectId = req.body.projectId || null;
    if (projectId) {
      if (!req.access.employeeId) return res.status(400).json({ error: 'A staff profile is required to create a project group' });
      if (!worksOnProject(req.access, projectId)) return res.status(403).json({ error: 'You can start a group only for a project you work on' });
      const team = await projectTeam(projectId);
      if (!team) return res.status(404).json({ error: 'Project not found' });
      if (team.project.status === 'CANCELLED') return res.status(400).json({ error: 'This project is cancelled' });
      if (!team.people.size) return res.status(400).json({ error: 'This project has no team members' });
      const existing = await prisma.hbmsConversation.findUnique({
        where: { projectId },
        include: { members: { select: { employeeId: true } }, project: { select: { managerId: true } } },
      });
      if (existing) {
        const joined = existing.members.some((member) => member.employeeId === req.access.employeeId) || isProjectAdmin(req.access, existing);
        if (!joined) return res.status(403).json({ error: 'This project group already exists. Ask the admin to update the members.' });
        return res.status(201).json({ data: { id: existing.id } });
      }
      const created = await prisma.hbmsConversation.create({
        data: {
          kind: 'PROJECT',
          projectId,
          createdById: req.access.employeeId,
          members: {
            create: [...team.people.entries()].map(([employeeId, userId]) => ({ employeeId, userId })),
          },
        },
      });
      await writeAudit(req.userId, 'conversation.project-create', 'HbmsConversation', created.id, { projectId, members: team.people.size });
      publishEmployees([...team.people.keys()], { type: 'conversations' }).catch(() => {});
      return res.status(201).json({ data: { id: created.id } });
    }
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
    publishUsers([req.userId, other.userId], { type: 'conversations' });
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
    const messages = await prisma.hbmsConversationMessage.findMany({
      where: { conversationId: fresh.id },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    messages.filter((message) => !message.linkPreview && firstUrl(message.body)).slice(-3).forEach((message) => {
      attachPreview(message, fresh.members);
    });
    const reader = fresh.members.find((member) => isMine(member, req));
    const previousRead = reader?.lastReadAt ? new Date(reader.lastReadAt).getTime() : 0;
    const markedNew = messages.some((message) => !messageIsMine(message, req) && new Date(message.createdAt).getTime() > previousRead);
    await prisma.hbmsConversationMember.updateMany({
      where: {
        conversationId: fresh.id,
        OR: [{ userId: req.userId }, ...(req.access.employeeId ? [{ employeeId: req.access.employeeId }] : [])],
      },
      data: { lastReadAt: new Date() },
    });
    if (markedNew) {
      publishUsers(
        fresh.members.filter((member) => !isMine(member, req)).map((member) => member.userId).filter(Boolean),
        { type: 'read', conversationId: fresh.id },
      );
    }
    const other = fresh.members.find((member) => !isMine(member, req));
    const account = fresh.kind === 'DIRECT' ? accountOf(other?.user, other?.employee) : null;
    const projectTitle = fresh.project?.name || 'Project';
    const canSend = fresh.kind === 'PROJECT'
      ? fresh.members.some((member) => isMine(member, req)) || isProjectAdmin(req.access, fresh)
      : fresh.kind === 'DIRECT'
        || Boolean(req.access.employeeId && fresh.members.some((member) => member.employeeId === req.access.employeeId))
        || req.access.orgWide;
    const title = fresh.kind === 'DEPARTMENT'
      ? fresh.department?.name
      : fresh.kind === 'PROJECT'
        ? projectTitle
        : account.name;
    const detail = fresh.kind === 'DEPARTMENT'
      ? `${fresh.department?.businessUnit?.name || 'Department'} · ${fresh.members.length === 1 ? '1 person' : `${fresh.members.length} people`}`
      : fresh.kind === 'PROJECT'
        ? `${fresh.project?.code || 'Project'} · ${fresh.members.length === 1 ? '1 person' : `${fresh.members.length} people`}`
        : (account.email || 'Direct message');
    res.json({
      data: {
        id: fresh.id,
        kind: fresh.kind,
        title,
        detail,
        unitCode: fresh.kind === 'PROJECT' ? fresh.project?.businessUnit?.code || null : fresh.department?.businessUnit?.code || null,
        unitName: fresh.kind === 'PROJECT' ? fresh.project?.businessUnit?.name || null : fresh.department?.businessUnit?.name || null,
        projectId: fresh.projectId || null,
        canManage: isProjectAdmin(req.access, fresh),
        employeeId: account?.employeeId || null,
        photoKey: account?.photoKey || null,
        firstName: account?.firstName || '',
        lastName: account?.lastName || '',
        canSpeakAsDepartment: fresh.kind === 'DEPARTMENT' && canSpeakAsDepartment(req.access, fresh.department),
        canSend,
        presence: presenceOf(fresh.members, req),
        members: fresh.members.map((member) => ({
          id: member.id,
          employeeId: member.employeeId,
          name: userLabel(member.user, member.employee),
          staffCode: member.employee?.staffCode || '',
          photoKey: member.employee?.photoKey || null,
        })),
        messages: messages.map((message) => presentMessage(message, req, fresh.department?.name || null, fresh.members)),
      },
    });
  } catch (error) {
    handlePrismaError(res, error, 'Could not open the conversation');
  }
});

router.post('/:id/typing', async (req, res) => {
  try {
    const conversation = await loadConversation(req.params.id);
    if (!conversation || !(await canRead(req.access, conversation, req.userId))) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const mine = conversation.members.find((member) => isMine(member, req));
    const typing = req.body.typing !== false;
    publishUsers(
      conversation.members.map((member) => member.userId).filter((userId) => userId && userId !== req.userId),
      {
        type: 'typing',
        conversationId: conversation.id,
        userId: req.userId,
        name: userLabel(mine?.user, mine?.employee),
        typing,
      },
    );
    res.json({ data: { ok: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Could not share typing');
  }
});

async function sendConversationMessage(req, res, extras = {}) {
  const audioFile = extras.audioFile || null;
  let saved = false;
  try {
    let audioUrl = extras.audioUrl || null;
    let audioDuration = Number(extras.audioDuration) || 0;
    const forwardAudioId = !audioUrl && req.body.forwardAudioId ? String(req.body.forwardAudioId) : '';
    if (forwardAudioId) {
      const source = await prisma.hbmsConversationMessage.findUnique({
        where: { id: forwardAudioId },
        select: { audioUrl: true, audioDuration: true, conversationId: true },
      });
      if (!source?.audioUrl) {
        discardUpload(audioFile);
        return res.status(400).json({ error: 'That voice message is no longer available' });
      }
      const sourceConversation = await loadConversation(source.conversationId);
      if (!sourceConversation || !(await canRead(req.access, sourceConversation, req.userId))) {
        discardUpload(audioFile);
        return res.status(404).json({ error: 'That voice message is no longer available' });
      }
      audioUrl = source.audioUrl;
      audioDuration = Number(source.audioDuration) || 0;
    }
    const body = String(extras.body != null ? extras.body : (req.body.body || '')).trim();
    if (!body && !audioUrl) {
      discardUpload(audioFile);
      return res.status(400).json({ error: 'Write a message' });
    }
    if (body.length > 2000) {
      discardUpload(audioFile);
      return res.status(400).json({ error: 'Keep the message under 2000 characters' });
    }
    const conversation = await loadConversation(req.params.id);
    if (!conversation || !(await canRead(req.access, conversation, req.userId))) {
      discardUpload(audioFile);
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const fresh = conversation.kind === 'DEPARTMENT' ? await loadConversation(req.params.id) : conversation;
    const member = fresh.members.some((item) => isMine(item, req));
    if (fresh.kind === 'DIRECT' && !member) {
      discardUpload(audioFile);
      return res.status(403).json({ error: 'You are not in this conversation' });
    }
    if (fresh.kind === 'PROJECT' && !member && !isProjectAdmin(req.access, fresh)) {
      discardUpload(audioFile);
      return res.status(403).json({ error: 'You are not in this project group' });
    }
    if (fresh.kind === 'DEPARTMENT' && !member && !req.access.orgWide) {
      discardUpload(audioFile);
      return res.status(403).json({ error: 'You are not in this conversation' });
    }
    const asDepartment = Boolean(req.body.asDepartment) && fresh.kind === 'DEPARTMENT' && canSpeakAsDepartment(req.access, fresh.department);
    if (req.body.asDepartment && !asDepartment) {
      discardUpload(audioFile);
      return res.status(403).json({ error: 'Only the department manager can send as the department' });
    }
    const replyToId = req.body.replyToId ? String(req.body.replyToId) : null;
    if (replyToId) {
      const quoted = await prisma.hbmsConversationMessage.findFirst({
        where: { id: replyToId, conversationId: fresh.id },
        select: { id: true },
      });
      if (!quoted) {
        discardUpload(audioFile);
        return res.status(400).json({ error: 'That message is no longer in this chat' });
      }
    }
    const message = await prisma.hbmsConversationMessage.create({
      data: {
        conversationId: fresh.id,
        authorId: req.access.employeeId || null,
        authorUserId: req.userId,
        body,
        audioUrl: audioUrl || null,
        audioDuration: audioUrl ? Math.max(0, Math.min(300000, Math.round(audioDuration))) : null,
        asDepartment,
        forwarded: Boolean(req.body.forwarded),
        replyToId,
      },
      include: messageInclude,
    });
    saved = true;
    attachPreview(message, fresh.members);
    const deliveredAt = new Date(Math.max(Date.now(), new Date(message.createdAt).getTime()));
    const reached = fresh.members.filter((item) => !isMine(item, req) && item.userId && isUserConnected(item.userId));
    if (reached.length) {
      await prisma.hbmsConversationMember.updateMany({
        where: { id: { in: reached.map((item) => item.id) } },
        data: { lastDeliveredAt: deliveredAt },
      });
      for (const item of reached) item.lastDeliveredAt = deliveredAt;
    }
    await prisma.hbmsConversation.update({ where: { id: fresh.id }, data: { updatedAt: new Date() } });
    const person = userLabel(message.authorUser, message.author);
    const speaker = asDepartment ? (fresh.department?.name || 'The department') : person;
    const preview = messagePreview(message);
    publishUsers(fresh.members.map((item) => item.userId), {
      type: 'message',
      conversationId: fresh.id,
      title: speaker,
      body: preview,
      authorUserId: req.userId,
    });
    sendPush(
      fresh.members.map((item) => item.userId).filter((userId) => userId && userId !== req.userId),
      { title: speaker, body: preview, data: { conversationId: fresh.id } },
    ).catch(() => {});
    publishUsers(fresh.members.map((item) => item.userId), { type: 'conversations', conversationId: fresh.id });
    await notifyWorkers(
      fresh.members.map((item) => item.employeeId).filter((id) => id && id !== req.access.employeeId),
      {
        kind: 'CONVERSATION',
        title: asDepartment ? `${speaker} sent a department message` : `Message from ${speaker}`,
        body: preview,
        entityType: 'conversation',
        entityId: fresh.id,
      },
    );
    await writeAudit(req.userId, 'conversation.message', 'HbmsConversation', fresh.id, { asDepartment, voice: Boolean(audioUrl) });
    res.status(201).json({
      data: presentMessage(message, req, fresh.department?.name || null, fresh.members),
    });
  } catch (error) {
    if (!saved) discardUpload(audioFile);
    handlePrismaError(res, error, 'Could not send the message');
  }
}

router.post('/:id/voice', acceptVoice, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Record a voice message' });
  const duration = Math.max(0, Math.min(300000, Math.round(Number(req.body.duration) || 0)));
  return sendConversationMessage(req, res, {
    body: '',
    audioUrl: `/uploads/${req.file.filename}`,
    audioDuration: duration,
    audioFile: req.file.path,
  });
});

router.post('/:id/messages', (req, res) => sendConversationMessage(req, res));

router.post('/:id/messages/:messageId/reactions', async (req, res) => {
  try {
    const emoji = String(req.body.emoji || '').trim();
    if (!emoji || emoji.length > 16 || /\s/.test(emoji)) {
      return res.status(400).json({ error: 'Choose an emoji' });
    }
    const conversation = await loadConversation(req.params.id);
    if (!conversation || !(await canRead(req.access, conversation, req.userId))) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const message = await prisma.hbmsConversationMessage.findFirst({
      where: { id: req.params.messageId, conversationId: conversation.id },
      select: { id: true },
    });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    const where = { messageId_userId: { messageId: message.id, userId: req.userId } };
    const existing = await prisma.hbmsMessageReaction.findUnique({ where });
    if (existing && existing.emoji === emoji) {
      await prisma.hbmsMessageReaction.delete({ where: { id: existing.id } });
    } else if (existing) {
      await prisma.hbmsMessageReaction.update({ where: { id: existing.id }, data: { emoji } });
    } else {
      await prisma.hbmsMessageReaction.create({
        data: { messageId: message.id, userId: req.userId, emoji },
      });
    }
    publishUsers(conversation.members.map((item) => item.userId), {
      type: 'reaction',
      conversationId: conversation.id,
    });
    res.json({ data: { ok: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Could not react to the message');
  }
});

router.post('/:id/members', async (req, res) => {
  try {
    const conversation = await loadConversation(req.params.id);
    if (!conversation || conversation.kind !== 'PROJECT') return res.status(404).json({ error: 'Project group not found' });
    if (!isProjectAdmin(req.access, conversation)) return res.status(403).json({ error: 'Only the group admin can update members' });
    const team = await projectTeam(conversation.projectId);
    if (!team || !team.people.size) return res.status(400).json({ error: 'This project has no team members' });
    await syncProjectMembers(conversation.id, team.people);
    await writeAudit(req.userId, 'conversation.project-members', 'HbmsConversation', conversation.id, { members: team.people.size });
    publishEmployees([...team.people.keys()], { type: 'conversations', conversationId: conversation.id }).catch(() => {});
    res.json({ data: { members: team.people.size } });
  } catch (error) {
    handlePrismaError(res, error, 'Could not update the group');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const conversation = await loadConversation(req.params.id);
    if (!conversation || conversation.kind !== 'PROJECT') return res.status(404).json({ error: 'Project group not found' });
    if (!isProjectAdmin(req.access, conversation)) return res.status(403).json({ error: 'Only the group admin can delete this group' });
    const memberIds = conversation.members.map((member) => member.employeeId);
    await prisma.hbmsConversation.delete({ where: { id: conversation.id } });
    publishEmployees(memberIds, { type: 'conversations', conversationId: conversation.id }).catch(() => {});
    await writeAudit(req.userId, 'conversation.project-delete', 'HbmsConversation', conversation.id, { projectId: conversation.projectId });
    res.json({ data: { deleted: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Could not delete the group');
  }
});

module.exports = router;
