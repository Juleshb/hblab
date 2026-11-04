const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { INCOMING_ROOT, storeUploadedFile, openStoredFile, deleteStoredFile, removePath } = require('./objectStore');
const { updateLoginAccount } = require('./loginAccount');
const { sendTemporaryPassword } = require('./mail');
const { attachAccess, guardWrites, allowsDirectory, allowsStaff, canApprove } = require('./access');
const { publishAll } = require('./live');
const {
  prisma,
  EMPLOYMENT_TYPES,
  EMPLOYEE_STATUSES,
  parsePagination,
  isOneOf,
  parseDate,
  parseSkills,
  employeeSelect,
  handlePrismaError,
  writeAudit,
} = require('./utils');

const router = express.Router();
router.use(attachAccess);
router.use(guardWrites((req) => {
  if (req.access.orgWide) return true;
  if (req.path === '/leave' || /^\/leave\/[^/]+\/decision$/.test(req.path)) {
    return Boolean(req.access.employeeId) || req.access.departmentScope;
  }
  if (/^\/[^/]+\/photo$/.test(req.path)) return Boolean(req.access.employeeId);
  if (req.method === 'PATCH' && req.access.employeeId && req.path === `/${req.access.employeeId}`) return true;
  return false;
}));

const DOCUMENT_KINDS = ['CONTRACT', 'IDENTIFICATION', 'CERTIFICATE', 'OTHER'];

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(INCOMING_ROOT, { recursive: true });
      cb(null, INCOMING_ROOT);
    },
    filename: (req, file, cb) => {
      const safeName = path.basename(file.originalname || 'photo').replace(/[^\w.\-]+/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype || '')
      || /\.(jpe?g|png|webp|gif)$/i.test(file.originalname || '');
    cb(allowed ? null : new Error('Upload a JPEG, PNG, WebP, or GIF picture'), allowed);
  },
});

function canIssueLogin(access) {
  return Boolean(access?.orgWide);
}

async function deliverTemporaryPassword(data) {
  if (!data?.temporaryPassword || !data.email) return { ...data, emailed: false };
  try {
    const emailed = await sendTemporaryPassword({
      to: data.email,
      name: data.name,
      password: data.temporaryPassword,
    });
    return { ...data, emailed };
  } catch (error) {
    console.error('Login email failed:', error.message);
    return { ...data, emailed: false };
  }
}

function temporaryPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

async function loginPlan(employeeId) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      staffCode: true,
      employmentType: true,
      userId: true,
      position: { select: { title: true } },
      managedDepartments: { select: { name: true } },
      managedProjects: { select: { code: true, name: true } },
      coordinatedPrograms: { select: { name: true } },
      trainingRoles: { select: { role: true, program: { select: { name: true } } } },
      user: { select: { id: true, email: true, name: true, role: true, hbmsRoles: { select: { role: true } } } },
    },
  });
  if (!employee) return null;
  const reasons = [];
  const add = (role, because) => {
    if (!reasons.some((item) => item.role === role)) reasons.push({ role, because });
  };
  if (employee.managedDepartments.length) {
    add('DEPARTMENT_MANAGER', `Manages ${employee.managedDepartments.map((item) => item.name).join(', ')}`);
  }
  if (employee.managedProjects.length) {
    add('PROJECT_MANAGER', `Manages ${employee.managedProjects.map((item) => item.code).join(', ')}`);
  }
  if (employee.coordinatedPrograms.length) {
    add('PROGRAM_COORDINATOR', `Coordinates ${employee.coordinatedPrograms.map((item) => item.name).join(', ')}`);
  }
  const training = employee.trainingRoles.filter((item) => item.role === 'TRAINER' || item.role === 'FACILITATOR');
  if (employee.employmentType === 'TRAINER' || training.length) {
    add('TRAINER', training.length
      ? `Trains ${training.map((item) => item.program.name).join(', ')}`
      : 'Recorded as a trainer');
  }
  if (/\bhr\b|human resource/i.test(employee.position?.title || '')) {
    add('HR', `Position is ${employee.position.title}`);
  }
  if (employee.employmentType === 'INTERN') add('INTERN', 'Employment type is intern');
  else add('WORKER', 'Staff member');
  return {
    employee,
    linked: Boolean(employee.userId),
    email: employee.user?.email || employee.email,
    name: employee.user?.name || `${employee.firstName} ${employee.lastName}`,
    roles: reasons.map((item) => item.role),
    reasons,
    currentRoles: employee.user?.hbmsRoles.map((item) => item.role) || [],
  };
}

async function issueLogin(employeeId, { reset = false } = {}) {
  const plan = await loginPlan(employeeId);
  if (!plan) return { status: 404, error: 'Worker not found' };
  let user = plan.employee.user;
  let temporary = null;

  if (!user) {
    const existing = await prisma.user.findUnique({
      where: { email: plan.employee.email },
      include: { employeeProfile: { select: { id: true } } },
    });
    if (existing?.employeeProfile && existing.employeeProfile.id !== employeeId) {
      return { status: 409, error: `${plan.employee.email} already belongs to another login` };
    }
    if (existing) {
      user = existing;
      await prisma.employee.update({ where: { id: employeeId }, data: { userId: existing.id } });
    } else {
      temporary = temporaryPassword();
      user = await prisma.user.create({
        data: {
          email: plan.employee.email,
          name: `${plan.employee.firstName} ${plan.employee.lastName}`,
          password: await bcrypt.hash(temporary, 12),
          role: 'STUDENT',
          status: 'Active',
          phone: plan.employee.phone,
        },
      });
      await prisma.employee.update({ where: { id: employeeId }, data: { userId: user.id } });
    }
  } else if (reset) {
    temporary = temporaryPassword();
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(temporary, 12) },
    });
  }

  if (user.role === 'ADMIN') {
    const current = await prisma.hbmsUserRole.findMany({ where: { userId: user.id }, select: { role: true } });
    const have = new Set(current.map((item) => item.role));
    const missing = plan.roles.filter((role) => !have.has(role));
    if (missing.length) {
      await prisma.hbmsUserRole.createMany({ data: missing.map((role) => ({ userId: user.id, role })) });
    }
  } else {
    await prisma.hbmsUserRole.deleteMany({ where: { userId: user.id } });
    await prisma.hbmsUserRole.createMany({ data: plan.roles.map((role) => ({ userId: user.id, role })) });
  }

  return {
    data: {
      id: plan.employee.id,
      name: `${plan.employee.firstName} ${plan.employee.lastName}`,
      staffCode: plan.employee.staffCode,
      email: user.email,
      roles: plan.roles,
      reasons: plan.reasons,
      temporaryPassword: temporary,
    },
  };
}

function imageType(key) {
  if (/\.png$/i.test(key)) return 'image/png';
  if (/\.webp$/i.test(key)) return 'image/webp';
  if (/\.gif$/i.test(key)) return 'image/gif';
  return 'image/jpeg';
}

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
    const allowed = /\.(pdf|png|jpe?g|docx?|webp)$/i.test(file.originalname);
    cb(allowed ? null : new Error('Upload a PDF, Word, or image file'), allowed);
  },
});

async function nextStaffCode(db) {
  const rows = await db.employee.findMany({ select: { staffCode: true } });
  const highest = rows.reduce((max, row) => {
    const match = /^HB-(\d+)$/.exec(row.staffCode || '');
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `HB-${String(highest + 1).padStart(3, '0')}`;
}

function readEmployeeBody(body, { partial = false } = {}) {
  const data = {};
  const required = ['firstName', 'lastName', 'email', 'businessUnitId'];

  if (!partial) {
    for (const field of required) {
      if (!String(body[field] || '').trim()) return { error: `${field} is required` };
    }
  }

  if (body.firstName !== undefined) data.firstName = String(body.firstName).trim();
  if (body.lastName !== undefined) data.lastName = String(body.lastName).trim();
  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!email.includes('@')) return { error: 'A valid email is required' };
    data.email = email;
  }
  if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
  if (body.businessUnitId !== undefined) data.businessUnitId = body.businessUnitId;
  if (body.departmentId !== undefined) data.departmentId = body.departmentId || null;
  if (body.positionId !== undefined) data.positionId = body.positionId || null;
  if (body.reportsToId !== undefined) data.reportsToId = body.reportsToId || null;
  if (body.userId !== undefined) data.userId = body.userId ? Number(body.userId) : null;
  if (body.skills !== undefined) data.skills = parseSkills(body.skills);
  if (body.employmentType !== undefined) {
    if (!isOneOf(body.employmentType, EMPLOYMENT_TYPES)) return { error: 'Invalid employment type' };
    data.employmentType = body.employmentType;
  }
  if (body.status !== undefined) {
    if (!isOneOf(body.status, EMPLOYEE_STATUSES)) return { error: 'Invalid status' };
    data.status = body.status;
  }
  if (body.attendancePolicy !== undefined) {
    if (!isOneOf(body.attendancePolicy, ['OFFICE', 'REMOTE', 'EVENT', 'FLEXIBLE'])) {
      return { error: 'Invalid attendance policy' };
    }
    data.attendancePolicy = body.attendancePolicy;
  }
  if (body.workDays !== undefined) {
    const days = String(body.workDays).split(',').map((item) => item.trim()).filter(Boolean);
    if (!days.length || days.some((day) => !['1', '2', '3', '4', '5', '6', '7'].includes(day))) {
      return { error: 'Choose at least one working day' };
    }
    data.workDays = days.join(',');
  }
  if (body.shiftStart !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(String(body.shiftStart))) return { error: 'Shift start must be HH:MM' };
    data.shiftStart = body.shiftStart;
  }
  if (body.shiftEnd !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(String(body.shiftEnd))) return { error: 'Shift end must be HH:MM' };
    data.shiftEnd = body.shiftEnd;
  }
  return { data };
}

async function assertPlacement(data, employeeId) {
  if (data.reportsToId && data.reportsToId === employeeId) {
    return 'A worker cannot report to themselves';
  }
  const businessUnitId = data.businessUnitId
    || (employeeId
      ? (await prisma.employee.findUnique({ where: { id: employeeId }, select: { businessUnitId: true } }))?.businessUnitId
      : null);
  if (data.departmentId) {
    const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department || department.businessUnitId !== businessUnitId) {
      return 'Choose a department in the same business unit';
    }
  }
  return null;
}

const profileSelect = {
  ...employeeSelect,
  directReports: { select: { id: true, firstName: true, lastName: true, staffCode: true } },
  experiences: { orderBy: { startDate: 'desc' } },
  documents: { orderBy: { createdAt: 'desc' } },
  leaveRequests: { orderBy: { createdAt: 'desc' } },
  memberships: {
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          businessUnit: { select: { name: true } },
          departments: {
            include: {
              department: {
                select: { id: true, name: true, businessUnit: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  },
  learnerProfile: {
    select: {
      id: true,
      enrollments: {
        select: {
          id: true,
          status: true,
          program: { select: { id: true, name: true, status: true } },
        },
      },
    },
  },
  assignments: {
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          priority: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
  },
};

router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const where = {};
    if (req.access.directoryIds) where.id = { in: req.access.directoryIds };
    if (req.query.businessUnitId) where.businessUnitId = req.query.businessUnitId;
    if (req.query.departmentId) where.departmentId = req.query.departmentId;
    if (req.query.employmentType) where.employmentType = req.query.employmentType;
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) {
      const q = String(req.query.q).trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { staffCode: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        select: employeeSelect,
        orderBy: { staffCode: 'asc' },
        skip,
        take: limit,
      }),
    ]);
    res.json({ data: employees, meta: { page, limit, total } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load workers');
  }
});

router.get('/leave', async (req, res) => {
  try {
    const where = {};
    if (req.access.staffIds) where.employeeId = { in: req.access.staffIds };
    if (req.query.status) where.status = req.query.status;
    if (req.query.employeeId) {
      if (!allowsStaff(req.access, req.query.employeeId)) return res.json({ data: [] });
      where.employeeId = req.query.employeeId;
    }
    const requests = await prisma.hbmsLeaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffCode: true,
            businessUnit: { select: { name: true } },
            reportsTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ data: requests });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load leave requests');
  }
});

router.post('/leave', async (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const startDate = parseDate(req.body.startDate);
    const endDate = parseDate(req.body.endDate);
    if (!employeeId) return res.status(400).json({ error: 'Worker is required' });
    if (!allowsStaff(req.access, employeeId)) return res.status(403).json({ error: 'You do not have permission to request leave for this worker' });
    if (!startDate || startDate.invalid || !endDate || endDate.invalid) {
      return res.status(400).json({ error: 'A start and end date are required' });
    }
    if (endDate < startDate) return res.status(400).json({ error: 'The end date must be on or after the start date' });

    const request = await prisma.hbmsLeaveRequest.create({
      data: {
        employeeId,
        startDate,
        endDate,
        reason: reason ? String(reason).trim() : null,
        leaveType: ['ANNUAL', 'SICK', 'UNPAID', 'OTHER'].includes(req.body.leaveType) ? req.body.leaveType : 'ANNUAL',
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true, staffCode: true } } },
    });
    await writeAudit(req.userId, 'leave.create', 'HbmsLeaveRequest', request.id, { employeeId });
    res.status(201).json({ data: request });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to create leave request');
  }
});

router.post('/leave/:id/decision', async (req, res) => {
  try {
    const decision = req.body.decision;
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be approved or rejected' });
    }
    const existing = await prisma.hbmsLeaveRequest.findUnique({
      where: { id: req.params.id },
      include: { employee: { select: { id: true, departmentId: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Leave request not found' });
    if (!canApprove(req.access, existing.employee)) return res.status(403).json({ error: 'You do not have permission to decide this leave request' });
    if (existing.status !== 'PENDING') return res.status(400).json({ error: 'This request has already been decided' });

    const request = await prisma.$transaction(async (tx) => {
      const updated = await tx.hbmsLeaveRequest.update({
        where: { id: existing.id },
        data: {
          status: decision,
          reviewNote: req.body.note ? String(req.body.note).trim() : null,
          reviewedAt: new Date(),
        },
      });
      const today = new Date();
      if (decision === 'APPROVED' && existing.startDate <= today && existing.endDate >= today) {
        await tx.employee.update({
          where: { id: existing.employeeId },
          data: { status: 'ON_LEAVE' },
        });
      }
      return updated;
    });
    await writeAudit(req.userId, 'leave.decision', 'HbmsLeaveRequest', request.id, { decision });
    res.json({ data: request });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to review leave request');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: profileSelect,
    });
    if (!employee) return res.status(404).json({ error: 'Worker not found' });
    if (!allowsDirectory(req.access, employee.id)) return res.status(404).json({ error: 'Worker not found' });
    if (!allowsStaff(req.access, employee.id)) {
      delete employee.documents;
      delete employee.leaveRequests;
      delete employee.experiences;
    }
    const login = await loginPlan(employee.id);
    res.json({
      data: {
        ...employee,
        login: login && {
          linked: login.linked,
          email: login.email,
          name: login.name,
          roles: login.roles,
          reasons: login.reasons,
          currentRoles: login.currentRoles,
          canManage: canIssueLogin(req.access),
        },
      },
    });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load worker');
  }
});

router.post('/accounts', async (req, res) => {
  try {
    if (!canIssueLogin(req.access)) return res.status(403).json({ error: 'Only an administrator or the CEO can create staff logins' });
    const missing = await prisma.employee.findMany({
      where: { userId: null },
      select: { id: true },
      orderBy: { staffCode: 'asc' },
    });
    const created = [];
    for (const worker of missing) {
      const result = await issueLogin(worker.id, { reset: false });
      if (result.error) return res.status(result.status).json({ error: result.error });
      created.push(await deliverTemporaryPassword(result.data));
    }
    res.json({ data: created });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to create staff logins');
  }
});

router.post('/:id/account', async (req, res) => {
  try {
    if (!canIssueLogin(req.access)) return res.status(403).json({ error: 'Only an administrator or the CEO can create staff logins' });
    const changing = req.body && (req.body.email != null || req.body.name != null || (req.body.password != null && String(req.body.password) !== ''));
    if (changing && !req.body.reset) {
      const employee = await prisma.employee.findUnique({ where: { id: req.params.id }, select: { userId: true } });
      if (!employee) return res.status(404).json({ error: 'Worker not found' });
      if (!employee.userId) return res.status(400).json({ error: 'Create a login before changing it' });
      const result = await updateLoginAccount(employee.userId, req.body);
      if (result.error) return res.status(result.status).json({ error: result.error });
      await writeAudit(req.userId, 'employee.login-update', 'Employee', req.params.id, {
        email: result.data.email,
        passwordChanged: result.data.passwordChanged,
      });
      return res.json({ data: { email: result.data.email, name: result.data.name } });
    }
    const result = await issueLogin(req.params.id, { reset: Boolean(req.body?.reset) });
    if (result.error) return res.status(result.status).json({ error: result.error });
    const data = await deliverTemporaryPassword(result.data);
    await writeAudit(req.userId, req.body?.reset ? 'employee.password-reset' : 'employee.login', 'Employee', req.params.id, {
      email: data.email,
      roles: data.roles,
      emailed: data.emailed,
    });
    res.json({ data });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to save the staff login');
  }
});

async function canViewParticipantPhoto(access, employeeId) {
  if (allowsDirectory(access, employeeId) || access.orgWide) return true;
  const managed = [...new Set([...(access.managedProjectIds || []), ...(access.departmentProjectIds || [])])];
  const shared = [];
  if (access.employeeId) shared.push({ assignees: { some: { employeeId: access.employeeId } } });
  if (managed.length) shared.push({ projectId: { in: managed } });
  if (!shared.length) return false;
  const task = await prisma.hbmsTask.findFirst({
    where: {
      assignees: { some: { employeeId } },
      OR: shared,
    },
    select: { id: true },
  });
  return Boolean(task);
}

async function canSeeCard(req, employeeId) {
  if (!employeeId) return false;
  if (req.access.orgWide || req.access.employeeId === employeeId) return true;
  if (allowsDirectory(req.access, employeeId)) return true;
  if (await canViewParticipantPhoto(req.access, employeeId)) return true;
  if (!req.access.employeeId) return false;
  const person = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { status: true },
  });
  return Boolean(person && person.status !== 'INACTIVE');
}

const cardSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  staffCode: true,
  skills: true,
  photoKey: true,
  employmentType: true,
  businessUnit: { select: { name: true } },
  department: { select: { name: true } },
  position: { select: { title: true } },
};

router.get('/:id/card', async (req, res) => {
  try {
    if (!(await canSeeCard(req, req.params.id))) return res.status(404).json({ error: 'Profile not found' });
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: cardSelect,
    });
    if (!employee) return res.status(404).json({ error: 'Profile not found' });
    res.json({ data: employee });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load profile');
  }
});

router.get('/:id/photo', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: { id: true, photoKey: true, photoProvider: true },
    });
    if (!employee || !employee.photoKey || !(await canSeeCard(req, employee.id))) {
      return res.status(404).json({ error: 'No profile picture' });
    }
    const stream = await openStoredFile({
      provider: employee.photoProvider,
      storage: 'OBJECT',
      storageKey: employee.photoKey,
    });
    res.setHeader('Content-Type', imageType(employee.photoKey));
    res.setHeader('Cache-Control', 'private, max-age=300');
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ error: 'No profile picture' });
    });
    stream.pipe(res);
  } catch (error) {
    if (!res.headersSent) handlePrismaError(res, error, 'Failed to open the profile picture');
  }
});

router.post('/:id/photo', (req, res, next) => {
  photoUpload.single('file')(req, res, (error) => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'The picture must be 5 MB or smaller' : error.message;
    return res.status(400).json({ error: message || 'Upload failed' });
  });
}, async (req, res) => {
  try {
    if (!(req.access.orgWide || req.access.employeeId === req.params.id)) {
      return res.status(403).json({ error: 'You can change only your own profile picture' });
    }
    if (!req.file) return res.status(400).json({ error: 'Choose a picture' });
    const current = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: { id: true, photoKey: true, photoProvider: true },
    });
    if (!current) {
      await removePath(req.file.path);
      return res.status(404).json({ error: 'Worker not found' });
    }
    const stored = await storeUploadedFile(req.file);
    if (stored.storage !== 'OBJECT') {
      await deleteStoredFile(stored);
      return res.status(400).json({ error: 'A profile picture must be an image' });
    }
    if (current.photoKey) {
      await deleteStoredFile({
        provider: current.photoProvider,
        storage: 'OBJECT',
        storageKey: current.photoKey,
      }).catch(() => {});
    }
    const employee = await prisma.employee.update({
      where: { id: current.id },
      data: { photoKey: stored.storageKey, photoProvider: stored.provider },
      select: employeeSelect,
    });
    await writeAudit(req.userId, 'employee.photo', 'Employee', employee.id, { photoKey: stored.storageKey });
    publishAll({ type: 'profile', employeeId: employee.id });
    res.json({ data: employee });
  } catch (error) {
    if (req.file?.path) await removePath(req.file.path);
    handlePrismaError(res, error, 'Failed to store the profile picture');
  }
});

router.post('/', async (req, res) => {
  try {
    const parsed = readEmployeeBody(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const placementError = await assertPlacement(parsed.data);
    if (placementError) return res.status(400).json({ error: placementError });
    if (!req.access.orgWide) return res.status(403).json({ error: 'Only an administrator or the CEO can add workers' });

    const employee = await prisma.$transaction(async (tx) => tx.employee.create({
      data: {
        employmentType: 'FULL_TIME',
        staffCode: await nextStaffCode(tx),
        ...parsed.data,
        attendancePolicy: parsed.data.attendancePolicy || (parsed.data.employmentType === 'FREELANCE' ? 'FLEXIBLE' : 'OFFICE'),
      },
      select: employeeSelect,
    }));
    await writeAudit(req.userId, 'employee.create', 'Employee', employee.id, {
      email: employee.email,
      staffCode: employee.staffCode,
      businessUnitId: employee.businessUnitId,
    });
    res.status(201).json({ data: employee });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to create worker');
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const parsed = readEmployeeBody(req.body, { partial: true });
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const own = req.access.employeeId === req.params.id;
    if (!req.access.orgWide && !own) {
      return res.status(403).json({ error: 'You do not have permission to update this worker' });
    }
    if (!req.access.orgWide) {
      const safe = {};
      if (parsed.data.firstName !== undefined) safe.firstName = parsed.data.firstName;
      if (parsed.data.lastName !== undefined) safe.lastName = parsed.data.lastName;
      if (parsed.data.phone !== undefined) safe.phone = parsed.data.phone;
      if (parsed.data.skills !== undefined) safe.skills = parsed.data.skills;
      if (!safe.firstName && parsed.data.firstName !== undefined) return res.status(400).json({ error: 'First name is required' });
      if (!safe.lastName && parsed.data.lastName !== undefined) return res.status(400).json({ error: 'Last name is required' });
      if (!Object.keys(safe).length) return res.status(400).json({ error: 'Nothing to update' });
      parsed.data = safe;
    }
    const placementError = await assertPlacement(parsed.data, req.params.id);
    if (placementError) return res.status(400).json({ error: placementError });
    if (req.access.orgWide && !allowsStaff(req.access, req.params.id)) {
      return res.status(403).json({ error: 'You do not have permission to update this worker' });
    }

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: parsed.data,
      select: employeeSelect,
    });
    await writeAudit(req.userId, 'employee.update', 'Employee', employee.id, { status: employee.status });
    publishAll({ type: 'profile', employeeId: employee.id });
    res.json({ data: employee });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to update worker');
  }
});

router.post('/:id/experience', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Role title is required' });
    const startDate = parseDate(req.body.startDate);
    const endDate = parseDate(req.body.endDate);
    if (startDate?.invalid || endDate?.invalid) return res.status(400).json({ error: 'Invalid date' });

    const experience = await prisma.hbmsExperience.create({
      data: {
        employeeId: req.params.id,
        title,
        organization: req.body.organization ? String(req.body.organization).trim() : null,
        description: req.body.description ? String(req.body.description).trim() : null,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      },
    });
    res.status(201).json({ data: experience });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to add experience');
  }
});

router.delete('/:id/experience/:experienceId', async (req, res) => {
  try {
    const removed = await prisma.hbmsExperience.deleteMany({
      where: { id: req.params.experienceId, employeeId: req.params.id },
    });
    if (!removed.count) return res.status(404).json({ error: 'Experience record not found' });
    res.json({ data: { removed: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to remove experience');
  }
});

router.post('/:id/documents', (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) return res.status(400).json({ error: error.message || 'Upload failed' });
    return next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose a file to upload' });
    const title = String(req.body.title || req.file.originalname).trim();
    const kind = req.body.kind || 'CONTRACT';
    if (!isOneOf(kind, DOCUMENT_KINDS)) return res.status(400).json({ error: 'Invalid document type' });

    const document = await prisma.hbmsStaffDocument.create({
      data: {
        employeeId: req.params.id,
        title,
        kind,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
      },
    });
    await writeAudit(req.userId, 'document.create', 'HbmsStaffDocument', document.id, { title, kind });
    res.status(201).json({ data: document });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to store document');
  }
});

router.delete('/:id/documents/:documentId', async (req, res) => {
  try {
    const removed = await prisma.hbmsStaffDocument.deleteMany({
      where: { id: req.params.documentId, employeeId: req.params.id },
    });
    if (!removed.count) return res.status(404).json({ error: 'Document not found' });
    res.json({ data: { removed: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to remove document');
  }
});

module.exports = router;
