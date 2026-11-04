const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { attachAccess, guardWrites, allowsProject, canManageProject, applyIdScope } = require('./access');
const { sendTemporaryPassword } = require('./mail');
const {
  prisma,
  PROJECT_STATUSES,
  PROJECT_CATEGORIES,
  PROJECT_ROLES,
  MILESTONE_STATUSES,
  parsePagination,
  isOneOf,
  parseDate,
  resolveMoneyParty,
  projectProgress,
  handlePrismaError,
  writeAudit,
} = require('./utils');

const router = express.Router();
router.use(attachAccess);
router.use(guardWrites((req) => req.access.orgWide || req.access.managedProjectIds.length > 0 || req.access.departmentScope));

const departmentLinkInclude = {
  include: {
    department: {
      select: {
        id: true,
        name: true,
        businessUnit: { select: { id: true, name: true } },
      },
    },
  },
  orderBy: { department: { name: 'asc' } },
};

const listInclude = {
  businessUnit: { select: { id: true, code: true, name: true } },
  manager: { select: { id: true, firstName: true, lastName: true, photoKey: true } },
  departments: departmentLinkInclude,
  _count: { select: { members: true, tasks: true, milestones: true } },
  tasks: { select: { status: true } },
};

function cleanText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function clientContactData(body) {
  const data = {};
  if (body.clientContactName !== undefined) data.clientContactName = cleanText(body.clientContactName);
  if (body.clientPhone !== undefined) data.clientPhone = cleanText(body.clientPhone);
  if (body.clientEmail !== undefined) {
    const email = String(body.clientEmail || '').trim().toLowerCase();
    if (!email) data.clientEmail = null;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { invalid: true, error: 'Enter a valid client email' };
    } else data.clientEmail = email;
  }
  return data;
}

function parseBudget(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const amount = Number(String(value).replace(/,/g, '').trim());
  if (!Number.isInteger(amount) || amount < 0) return { invalid: true };
  return amount;
}

async function nextProjectCode(tx, businessUnitId) {
  const unit = await tx.businessUnit.findUnique({ where: { id: businessUnitId }, select: { code: true } });
  const prefix = unit?.code === 'HBSTUDIO' ? 'HBS' : 'HBL';
  const rows = await tx.hbmsProject.findMany({
    where: { code: { startsWith: `${prefix}-` } },
    select: { code: true },
  });
  const highest = rows.reduce((max, row) => {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(row.code || '');
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(3, '0')}`;
}

async function setProjectDepartments(tx, projectId, departmentIds) {
  if (!Array.isArray(departmentIds)) return;
  const ids = [...new Set(departmentIds.filter(Boolean))];
  const found = await tx.department.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  if (found.length !== ids.length) {
    const error = new Error('Choose departments that exist');
    error.status = 400;
    throw error;
  }
  await tx.hbmsProjectDepartment.deleteMany({ where: { projectId } });
  if (ids.length) {
    await tx.hbmsProjectDepartment.createMany({
      data: ids.map((departmentId) => ({ projectId, departmentId })),
    });
  }
}

function withProgress(project, { keepTasks = false } = {}) {
  const tasks = project.tasks || [];
  const progress = projectProgress(tasks);
  if (keepTasks) return { ...project, progress };
  const { tasks: _tasks, ...rest } = project;
  return { ...rest, progress };
}

async function assertManaged(req, res, projectId) {
  const project = await prisma.hbmsProject.findUnique({
    where: { id: projectId },
    select: { id: true, businessUnitId: true, departments: { select: { departmentId: true } } },
  });
  if (!project || !canManageProject(req.access, project)) {
    res.status(403).json({ error: 'You do not have permission to change this project' });
    return null;
  }
  return project;
}

router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const where = {};
    if (!applyIdScope(where, 'id', req.access.projectIds, null)) return res.json({ data: [], meta: { page, limit, total: 0 } });
    if (req.query.businessUnitId) where.businessUnitId = req.query.businessUnitId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) {
      where.name = { contains: String(req.query.q).trim(), mode: 'insensitive' };
    }

    const [total, projects] = await Promise.all([
      prisma.hbmsProject.count({ where }),
      prisma.hbmsProject.findMany({
        where,
        include: listInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      data: projects.map(withProgress),
      meta: { page, limit, total },
    });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load projects');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.hbmsProject.findUnique({
      where: { id: req.params.id },
      include: {
        businessUnit: { select: { id: true, code: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true, email: true, photoKey: true } },
        departments: departmentLinkInclude,
        members: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                photoKey: true,
                status: true,
                departmentId: true,
                department: { select: { id: true, name: true } },
                businessUnit: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        milestones: { orderBy: { dueDate: 'asc' } },
        clientAccess: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { user: { name: 'asc' } },
        },
        payments: {
          include: {
            payer: { select: { id: true, firstName: true, lastName: true } },
            receiver: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: [{ paidOn: 'desc' }, { createdAt: 'desc' }],
        },
        expenses: {
          select: {
            id: true,
            amount: true,
            currency: true,
            description: true,
            status: true,
            spentOn: true,
            createdAt: true,
            spentByKind: true,
            spentBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: [{ spentOn: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        },
        tasks: {
          include: {
            assignees: {
              include: {
                employee: { select: { id: true, firstName: true, lastName: true, photoKey: true } },
              },
            },
            comments: {
              include: { author: { select: { id: true, firstName: true, lastName: true } } },
              orderBy: { createdAt: 'asc' },
            },
            files: { orderBy: { createdAt: 'asc' } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!allowsProject(req.access, project.id)) return res.status(404).json({ error: 'Project not found' });
    const shaped = withProgress(project, { keepTasks: true });
    shaped.viewer = {
      clientOnly: Boolean(req.access.clientOnly),
      canIssueLogin: Boolean(req.access.orgWide),
      canManage: canManageProject(req.access, project),
    };
    if (!canManageProject(req.access, project)) {
      shaped.budgetAmount = null;
      shaped.payments = [];
      shaped.expenses = [];
    }
    if (!req.access.orgWide && !req.access.clientOnly && !canManageProject(req.access, project)) {
      shaped.tasks = (shaped.tasks || []).filter((task) => (
        (task.assignees || []).some((item) => item.employeeId === req.access.employeeId || item.employee?.id === req.access.employeeId)
      ));
    }
    if (req.access.clientOnly) {
      shaped.budgetAmount = null;
      shaped.payments = [];
      shaped.expenses = [];
      shaped.members = [];
      shaped.departments = [];
      shaped.clientAccess = [];
      shaped.tasks = (shaped.tasks || []).map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        progress: task.progress || 0,
        dueDate: task.dueDate,
        assignees: [],
        comments: [],
        files: [],
      }));
    }
    res.json({ data: shaped });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load project');
  }
});

router.post('/', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const { businessUnitId, managerId, description, clientName, status, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });
    if (!businessUnitId) return res.status(400).json({ error: 'Business unit is required' });
    if (!req.access.orgWide && !(req.access.departmentScope && req.access.businessUnitId === businessUnitId)) {
      return res.status(403).json({ error: 'You can create projects only in your business unit' });
    }
    if (status && !isOneOf(status, PROJECT_STATUSES)) {
      return res.status(400).json({ error: 'Invalid project status' });
    }
    if (category && !isOneOf(category, PROJECT_CATEGORIES)) {
      return res.status(400).json({ error: 'Invalid project category' });
    }

    const startDate = parseDate(req.body.startDate);
    const endDate = parseDate(req.body.endDate);
    if (startDate?.invalid || endDate?.invalid) {
      return res.status(400).json({ error: 'Invalid date' });
    }
    const budgetAmount = parseBudget(req.body.budgetAmount);
    if (budgetAmount?.invalid) return res.status(400).json({ error: 'Budget must be a whole number of RWF' });
    const contact = clientContactData(req.body);
    if (contact.invalid) return res.status(400).json({ error: contact.error });

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.hbmsProject.create({
        data: {
          name,
          code: await nextProjectCode(tx, businessUnitId),
          description: description ? String(description).trim() : null,
          businessUnitId,
          managerId: managerId || null,
          clientName: clientName ? String(clientName).trim() : null,
          clientContactName: contact.clientContactName || null,
          clientEmail: contact.clientEmail || null,
          clientPhone: contact.clientPhone || null,
          budgetAmount: budgetAmount ?? null,
          budgetCurrency: 'RWF',
          requiresApproval: req.body.requiresApproval === undefined ? true : Boolean(req.body.requiresApproval),
          status: status || 'PLANNING',
          category: category || 'SOFTWARE',
          startDate: startDate ?? null,
          endDate: endDate ?? null,
        },
      });

      if (managerId) {
        await tx.hbmsProjectMember.create({
          data: { projectId: created.id, employeeId: managerId, role: 'MANAGER' },
        });
        const manager = await tx.employee.findUnique({
          where: { id: managerId },
          select: { departmentId: true },
        });
        if (manager?.departmentId && !(req.body.departmentIds || []).includes(manager.departmentId)) {
          req.body.departmentIds = [...(req.body.departmentIds || []), manager.departmentId];
        }
      }
      await setProjectDepartments(tx, created.id, req.body.departmentIds);
      return created;
    });

    await writeAudit(req.userId, 'project.create', 'HbmsProject', project.id, {
      name: project.name,
      businessUnitId: project.businessUnitId,
    });
    res.status(201).json({ data: project });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    handlePrismaError(res, error, 'Failed to create project');
  }
});

router.patch('/:id', async (req, res) => {
  try {
    if (!await assertManaged(req, res, req.params.id)) return;
    const data = {};
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ error: 'Project name is required' });
      data.name = name;
    }
    if (req.body.description !== undefined) {
      data.description = req.body.description ? String(req.body.description).trim() : null;
    }
    if (req.body.clientName !== undefined) {
      data.clientName = req.body.clientName ? String(req.body.clientName).trim() : null;
    }
    const contact = clientContactData(req.body);
    if (contact.invalid) return res.status(400).json({ error: contact.error });
    Object.assign(data, contact);
    if (req.body.businessUnitId !== undefined) data.businessUnitId = req.body.businessUnitId;
    if (req.body.managerId !== undefined) data.managerId = req.body.managerId || null;
    if (req.body.status !== undefined) {
      if (!isOneOf(req.body.status, PROJECT_STATUSES)) {
        return res.status(400).json({ error: 'Invalid project status' });
      }
      data.status = req.body.status;
    }
    if (req.body.category !== undefined) {
      if (!isOneOf(req.body.category, PROJECT_CATEGORIES)) {
        return res.status(400).json({ error: 'Invalid project category' });
      }
      data.category = req.body.category;
    }
    if (req.body.startDate !== undefined) {
      const startDate = parseDate(req.body.startDate);
      if (startDate?.invalid) return res.status(400).json({ error: 'Invalid start date' });
      data.startDate = startDate;
    }
    if (req.body.endDate !== undefined) {
      const endDate = parseDate(req.body.endDate);
      if (endDate?.invalid) return res.status(400).json({ error: 'Invalid end date' });
      data.endDate = endDate;
    }
    if (req.body.budgetAmount !== undefined) {
      const budgetAmount = parseBudget(req.body.budgetAmount);
      if (budgetAmount?.invalid) return res.status(400).json({ error: 'Budget must be a whole number of RWF' });
      data.budgetAmount = budgetAmount;
    }
    if (req.body.requiresApproval !== undefined) {
      data.requiresApproval = Boolean(req.body.requiresApproval);
    }

    const project = await prisma.$transaction(async (tx) => {
      const updated = await tx.hbmsProject.update({
        where: { id: req.params.id },
        data,
      });
      await setProjectDepartments(tx, updated.id, req.body.departmentIds);
      return updated;
    });
    await writeAudit(req.userId, 'project.update', 'HbmsProject', project.id, {
      status: project.status,
    });
    res.json({ data: project });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    handlePrismaError(res, error, 'Failed to update project');
  }
});

router.post('/:id/client-login', async (req, res) => {
  try {
    if (!await assertManaged(req, res, req.params.id)) return;
    if (!req.access.orgWide) {
      return res.status(403).json({ error: 'Only an administrator or the CEO can give a client login' });
    }
    const name = cleanText(req.body.name);
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = cleanText(req.body.phone);
    if (!name) return res.status(400).json({ error: 'Enter the contact name' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid client email' });

    await prisma.hbmsProject.update({
      where: { id: req.params.id },
      data: { clientContactName: name, clientEmail: email, clientPhone: phone },
    });

    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });
    let temporaryPassword = null;
    const created = !user;
    if (!user) {
      temporaryPassword = crypto.randomBytes(9).toString('base64url');
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: await bcrypt.hash(temporaryPassword, 12),
          role: 'STUDENT',
          status: 'Active',
          phone,
        },
        select: { id: true, email: true, name: true, role: true },
      });
    } else if (req.body.reset) {
      if (user.role === 'ADMIN') return res.status(400).json({ error: 'This email belongs to an administrator. Choose the client email instead.' });
      temporaryPassword = crypto.randomBytes(9).toString('base64url');
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await bcrypt.hash(temporaryPassword, 12), name },
      });
    }

    await prisma.hbmsUserRole.createMany({
      data: [{ userId: user.id, role: 'CLIENT' }],
      skipDuplicates: true,
    });
    await prisma.hbmsClientAccess.upsert({
      where: { userId_projectId: { userId: user.id, projectId: req.params.id } },
      update: {},
      create: { userId: user.id, projectId: req.params.id },
    });

    let emailed = false;
    if (temporaryPassword) {
      try {
        emailed = await sendTemporaryPassword({ to: email, name, password: temporaryPassword });
      } catch (error) {
        console.error('Client login email failed:', error.message);
      }
    }
    await writeAudit(req.userId, 'project.client-login', 'HbmsProject', req.params.id, {
      userId: user.id,
      email,
      created,
      emailed,
    });
    res.json({
      data: {
        userId: user.id,
        email,
        name,
        created,
        existing: !created,
        emailed,
        temporaryPassword,
      },
    });
  } catch (error) {
    handlePrismaError(res, error, 'Could not give the client a login');
  }
});

function parseMoney(value) {
  const amount = Number(String(value ?? '').replace(/,/g, '').trim());
  if (!Number.isInteger(amount) || amount <= 0) return { invalid: true };
  return amount;
}

router.post('/:id/payments', async (req, res) => {
  try {
    if (!await assertManaged(req, res, req.params.id)) return;
    const amount = parseMoney(req.body.amount);
    if (amount?.invalid) return res.status(400).json({ error: 'Enter the amount paid as a whole number of RWF' });
    const paidOn = parseDate(req.body.paidOn);
    if (paidOn?.invalid) return res.status(400).json({ error: 'Invalid payment date' });
    const note = cleanText(req.body.note);
    const project = await prisma.hbmsProject.findUnique({
      where: { id: req.params.id },
      select: { budgetCurrency: true, managerId: true, members: { select: { employeeId: true } } },
    });
    const payer = resolveMoneyParty(project, req.body.payerKind, req.body.payerId, 'paid');
    if (payer.error) return res.status(400).json({ error: payer.error });
    const receiver = resolveMoneyParty(project, req.body.receiverKind, req.body.receiverId, 'received the payment');
    if (receiver.error) return res.status(400).json({ error: receiver.error });
    const payment = await prisma.hbmsPayment.create({
      data: {
        projectId: req.params.id,
        amount,
        currency: project?.budgetCurrency || 'RWF',
        paidOn: paidOn ?? null,
        note,
        payerKind: payer.kind,
        payerId: payer.employeeId,
        receiverKind: receiver.kind,
        receiverId: receiver.employeeId,
      },
    });
    await writeAudit(req.userId, 'payment.create', 'HbmsPayment', payment.id, { projectId: req.params.id, amount });
    res.status(201).json({ data: payment });
  } catch (error) {
    handlePrismaError(res, error, 'Could not record the payment');
  }
});

router.patch('/:id/payments/:paymentId', async (req, res) => {
  try {
    if (!await assertManaged(req, res, req.params.id)) return;
    const existing = await prisma.hbmsPayment.findUnique({ where: { id: req.params.paymentId }, select: { id: true, projectId: true } });
    if (!existing || existing.projectId !== req.params.id) return res.status(404).json({ error: 'Payment not found' });
    const project = await prisma.hbmsProject.findUnique({
      where: { id: req.params.id },
      select: { managerId: true, members: { select: { employeeId: true } } },
    });
    const payer = resolveMoneyParty(project, req.body.payerKind, req.body.payerId, 'paid');
    if (payer.error) return res.status(400).json({ error: payer.error });
    const receiver = resolveMoneyParty(project, req.body.receiverKind, req.body.receiverId, 'received the payment');
    if (receiver.error) return res.status(400).json({ error: receiver.error });
    const payment = await prisma.hbmsPayment.update({
      where: { id: existing.id },
      data: {
        payerKind: payer.kind,
        payerId: payer.employeeId,
        receiverKind: receiver.kind,
        receiverId: receiver.employeeId,
      },
    });
    await writeAudit(req.userId, 'payment.people', 'HbmsPayment', payment.id, { projectId: req.params.id });
    res.json({ data: payment });
  } catch (error) {
    handlePrismaError(res, error, 'Could not update the payment');
  }
});

router.delete('/:id/payments/:paymentId', async (req, res) => {
  try {
    if (!await assertManaged(req, res, req.params.id)) return;
    const payment = await prisma.hbmsPayment.findUnique({ where: { id: req.params.paymentId }, select: { id: true, projectId: true } });
    if (!payment || payment.projectId !== req.params.id) return res.status(404).json({ error: 'Payment not found' });
    await prisma.hbmsPayment.delete({ where: { id: payment.id } });
    await writeAudit(req.userId, 'payment.remove', 'HbmsPayment', payment.id, { projectId: req.params.id });
    res.json({ data: { removed: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Could not remove the payment');
  }
});

router.post('/:id/expenses', async (req, res) => {
  try {
    if (!await assertManaged(req, res, req.params.id)) return;
    const amount = parseMoney(req.body.amount);
    if (amount?.invalid) return res.status(400).json({ error: 'Enter the expense as a whole number of RWF' });
    const description = cleanText(req.body.description);
    if (!description) return res.status(400).json({ error: 'Describe the expense' });
    const spentOn = parseDate(req.body.spentOn);
    if (spentOn?.invalid) return res.status(400).json({ error: 'Invalid expense date' });
    const project = await prisma.hbmsProject.findUnique({
      where: { id: req.params.id },
      select: { budgetCurrency: true, managerId: true, members: { select: { employeeId: true } } },
    });
    const spentBy = resolveMoneyParty(project, req.body.spentByKind, req.body.spentById, 'used this expense');
    if (spentBy.error) return res.status(400).json({ error: spentBy.error });
    const expense = await prisma.hbmsExpense.create({
      data: {
        projectId: req.params.id,
        amount,
        currency: project?.budgetCurrency || 'RWF',
        description,
        status: 'APPROVED',
        spentOn: spentOn ?? null,
        spentByKind: spentBy.kind,
        spentById: spentBy.employeeId,
      },
    });
    await writeAudit(req.userId, 'expense.create', 'HbmsExpense', expense.id, { projectId: req.params.id, amount });
    res.status(201).json({ data: expense });
  } catch (error) {
    handlePrismaError(res, error, 'Could not record the expense');
  }
});

router.patch('/:id/expenses/:expenseId', async (req, res) => {
  try {
    if (!await assertManaged(req, res, req.params.id)) return;
    const existing = await prisma.hbmsExpense.findUnique({ where: { id: req.params.expenseId }, select: { id: true, projectId: true } });
    if (!existing || existing.projectId !== req.params.id) return res.status(404).json({ error: 'Expense not found' });
    const project = await prisma.hbmsProject.findUnique({
      where: { id: req.params.id },
      select: { managerId: true, members: { select: { employeeId: true } } },
    });
    const spentBy = resolveMoneyParty(project, req.body.spentByKind, req.body.spentById, 'used this expense');
    if (spentBy.error) return res.status(400).json({ error: spentBy.error });
    const spentOn = parseDate(req.body.spentOn);
    if (spentOn?.invalid) return res.status(400).json({ error: 'Invalid expense date' });
    const expense = await prisma.hbmsExpense.update({
      where: { id: existing.id },
      data: {
        spentByKind: spentBy.kind,
        spentById: spentBy.employeeId,
        ...(spentOn !== undefined ? { spentOn } : {}),
      },
    });
    await writeAudit(req.userId, 'expense.people', 'HbmsExpense', expense.id, { projectId: req.params.id });
    res.json({ data: expense });
  } catch (error) {
    handlePrismaError(res, error, 'Could not update the expense');
  }
});

router.delete('/:id/expenses/:expenseId', async (req, res) => {
  try {
    if (!await assertManaged(req, res, req.params.id)) return;
    const expense = await prisma.hbmsExpense.findUnique({ where: { id: req.params.expenseId }, select: { id: true, projectId: true } });
    if (!expense || expense.projectId !== req.params.id) return res.status(404).json({ error: 'Expense not found' });
    await prisma.hbmsExpense.delete({ where: { id: expense.id } });
    await writeAudit(req.userId, 'expense.remove', 'HbmsExpense', expense.id, { projectId: req.params.id });
    res.json({ data: { removed: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Could not remove the expense');
  }
});

router.post('/:id/members', async (req, res) => {
  try {
    if (!await assertManaged(req, res, req.params.id)) return;
    const { employeeId, role } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Employee is required' });
    if (role && !isOneOf(role, PROJECT_ROLES)) {
      return res.status(400).json({ error: 'Invalid project role' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { departmentId: true },
    });
    if (!employee) return res.status(404).json({ error: 'Worker not found' });

    const member = await prisma.$transaction(async (tx) => {
      if (employee.departmentId) {
        await tx.hbmsProjectDepartment.upsert({
          where: {
            projectId_departmentId: {
              projectId: req.params.id,
              departmentId: employee.departmentId,
            },
          },
          update: {},
          create: { projectId: req.params.id, departmentId: employee.departmentId },
        });
      }
      return tx.hbmsProjectMember.upsert({
        where: {
          projectId_employeeId: { projectId: req.params.id, employeeId },
        },
        update: { role: role || 'MEMBER' },
        create: {
          projectId: req.params.id,
          employeeId,
          role: role || 'MEMBER',
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
      });
    });
    await writeAudit(req.userId, 'project.member', 'HbmsProject', req.params.id, {
      employeeId,
      role: member.role,
    });
    res.status(201).json({ data: member });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to add project member');
  }
});

router.delete('/:id/members/:employeeId', async (req, res) => {
  try {
    if (!await assertManaged(req, res, req.params.id)) return;
    await prisma.hbmsProjectMember.delete({
      where: {
        projectId_employeeId: {
          projectId: req.params.id,
          employeeId: req.params.employeeId,
        },
      },
    });
    await writeAudit(req.userId, 'project.member.remove', 'HbmsProject', req.params.id, {
      employeeId: req.params.employeeId,
    });
    res.json({ data: { removed: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to remove project member');
  }
});

router.post('/:id/milestones', async (req, res) => {
  try {
    if (!await assertManaged(req, res, req.params.id)) return;
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Milestone title is required' });
    const dueDate = parseDate(req.body.dueDate);
    if (dueDate?.invalid) return res.status(400).json({ error: 'Invalid due date' });

    const milestone = await prisma.hbmsMilestone.create({
      data: {
        projectId: req.params.id,
        title,
        dueDate: dueDate ?? null,
      },
    });
    res.status(201).json({ data: milestone });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to create milestone');
  }
});

router.patch('/milestones/:id', async (req, res) => {
  try {
    const current = await prisma.hbmsMilestone.findUnique({ where: { id: req.params.id }, select: { projectId: true } });
    if (!current) return res.status(404).json({ error: 'Milestone not found' });
    if (!await assertManaged(req, res, current.projectId)) return;
    const data = {};
    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) return res.status(400).json({ error: 'Milestone title is required' });
      data.title = title;
    }
    if (req.body.status !== undefined) {
      if (!isOneOf(req.body.status, MILESTONE_STATUSES)) {
        return res.status(400).json({ error: 'Invalid milestone status' });
      }
      data.status = req.body.status;
    }
    if (req.body.dueDate !== undefined) {
      const dueDate = parseDate(req.body.dueDate);
      if (dueDate?.invalid) return res.status(400).json({ error: 'Invalid due date' });
      data.dueDate = dueDate;
    }

    const milestone = await prisma.hbmsMilestone.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ data: milestone });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to update milestone');
  }
});

module.exports = router;
