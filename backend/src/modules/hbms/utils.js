const prisma = require('../../prismaClient');

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERN', 'TRAINER', 'FREELANCE'];
const EMPLOYEE_STATUSES = ['ACTIVE', 'ON_LEAVE', 'INACTIVE'];
const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const PROJECT_CATEGORIES = ['SOFTWARE', 'WEBSITE', 'ECOMMERCE', 'MOBILE', 'INFRASTRUCTURE', 'PHOTOGRAPHY', 'VIDEO', 'LIVESTREAM', 'MARKETING', 'BRANDING', 'PODCAST', 'OTHER'];
const PROJECT_ROLES = ['MANAGER', 'MEMBER', 'REVIEWER'];
const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED', 'CANCELLED'];
const OPEN_TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'];
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const MILESTONE_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
const MONEY_PARTIES = ['CLIENT', 'MEMBER'];

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function isOneOf(value, allowed) {
  return allowed.includes(value);
}

function resolveMoneyParty(project, kind, employeeId, action) {
  if (!isOneOf(kind, MONEY_PARTIES)) return { error: `Choose who ${action}` };
  if (kind === 'CLIENT') return { kind: 'CLIENT', employeeId: null };
  const id = String(employeeId || '').trim();
  if (!id) return { error: `Choose the team member who ${action}` };
  const memberIds = new Set((project?.members || []).map((member) => member.employeeId));
  if (project?.managerId) memberIds.add(project.managerId);
  if (!memberIds.has(id)) return { error: 'Choose the client or a member of this project team' };
  return { kind: 'MEMBER', employeeId: id };
}

function parseDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { invalid: true };
  return date;
}

function parseSkills(value) {
  if (value == null || value === '') return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return list.map((item) => String(item).trim()).filter(Boolean);
}

function projectProgress(tasks) {
  const countable = tasks.filter((task) => task.status !== 'CANCELLED');
  if (!countable.length) return 0;
  const done = countable.filter((task) => task.status === 'DONE').length;
  return Math.round((done / countable.length) * 100);
}

async function writeAudit(actorId, action, entityType, entityId, metadata) {
  await prisma.hbmsAuditLog.create({
    data: {
      actorId: actorId || null,
      action,
      entityType,
      entityId,
      metadata: metadata || undefined,
    },
  });
}

function handlePrismaError(res, error, fallback) {
  if (error.code === 'P2002') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }
  if (error.code === 'P2003') {
    return res.status(400).json({ error: 'A related record was not found' });
  }
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }
  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}

const employeeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  staffCode: true,
  employmentType: true,
  status: true,
  skills: true,
  photoKey: true,
  photoProvider: true,
  businessUnitId: true,
  departmentId: true,
  positionId: true,
  reportsToId: true,
  attendancePolicy: true,
  workDays: true,
  shiftStart: true,
  shiftEnd: true,
  userId: true,
  user: { select: { id: true, email: true, name: true } },
  createdAt: true,
  updatedAt: true,
  businessUnit: { select: { id: true, code: true, name: true } },
  department: { select: { id: true, name: true } },
  position: { select: { id: true, title: true, responsibilities: true } },
  reportsTo: { select: { id: true, firstName: true, lastName: true } },
};

module.exports = {
  prisma,
  EMPLOYMENT_TYPES,
  EMPLOYEE_STATUSES,
  PROJECT_STATUSES,
  PROJECT_CATEGORIES,
  PROJECT_ROLES,
  TASK_STATUSES,
  OPEN_TASK_STATUSES,
  TASK_PRIORITIES,
  MILESTONE_STATUSES,
  parsePagination,
  isOneOf,
  parseDate,
  resolveMoneyParty,
  parseSkills,
  projectProgress,
  writeAudit,
  handlePrismaError,
  employeeSelect,
};
