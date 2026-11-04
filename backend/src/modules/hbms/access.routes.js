const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma, handlePrismaError, writeAudit } = require('./utils');
const { updateLoginAccount } = require('./loginAccount');
const {
  ROLE_INFO,
  attachAccess,
  loadEmployeePreview,
  publicAccess,
} = require('./access');

const router = express.Router();
router.use(attachAccess);

const ASSIGNABLE = ROLE_INFO.map(([role]) => role).filter((role) => role !== 'SUPER_ADMIN');

router.get('/me', (req, res) => {
  res.json({ data: publicAccess(req.access) });
});

router.get('/login', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        employeeProfile: { select: { id: true, firstName: true, lastName: true, photoKey: true, staffCode: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Login not found' });
    res.json({
      data: {
        email: user.email,
        name: user.name || '',
        staffCode: user.employeeProfile?.staffCode || '',
        worker: user.employeeProfile
          ? {
            id: user.employeeProfile.id,
            firstName: user.employeeProfile.firstName,
            lastName: user.employeeProfile.lastName,
            photoKey: user.employeeProfile.photoKey,
          }
          : null,
      },
    });
  } catch (error) {
    handlePrismaError(res, error, 'Could not load your login');
  }
});

router.patch('/login', async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    if (!currentPassword) return res.status(400).json({ error: 'Enter your current password' });
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, password: true } });
    if (!user) return res.status(404).json({ error: 'Login not found' });
    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) return res.status(400).json({ error: 'Current password is incorrect' });
    const result = await updateLoginAccount(req.userId, {
      name: req.body?.name,
      email: req.body?.email,
      password: req.body?.newPassword,
    });
    if (result.error) return res.status(result.status).json({ error: result.error });
    await writeAudit(req.userId, 'user.login-update', 'User', String(req.userId), {
      email: result.data.email,
      passwordChanged: result.data.passwordChanged,
    });
    res.json({ data: { email: result.data.email, name: result.data.name } });
  } catch (error) {
    handlePrismaError(res, error, 'Could not update your login');
  }
});

router.get('/directory', async (req, res) => {
  try {
    if (!req.access.orgWide) return res.status(403).json({ error: 'Only a director or super administrator can assign roles' });
    const [users, employees, projects, departments] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          hbmsRoles: { select: { role: true } },
          hbmsClientAccess: { select: { projectId: true } },
          employeeProfile: { select: { id: true, firstName: true, lastName: true, staffCode: true, photoKey: true } },
        },
        orderBy: { email: 'asc' },
      }),
      prisma.employee.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          staffCode: true,
          userId: true,
          businessUnit: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { staffCode: 'asc' },
      }),
      prisma.hbmsProject.findMany({
        select: { id: true, code: true, name: true, businessUnit: { select: { name: true } } },
        orderBy: { code: 'asc' },
      }),
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          managerId: true,
          businessUnit: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);
    res.json({
      data: {
        roles: ROLE_INFO.map(([role, label, detail]) => ({ role, label, detail })),
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          appRole: user.role,
          roles: user.role === 'ADMIN'
            ? [...new Set(['SUPER_ADMIN', ...user.hbmsRoles.map((item) => item.role)])]
            : user.hbmsRoles.map((item) => item.role),
          lockedSuperAdmin: user.role === 'ADMIN',
          employee: user.employeeProfile,
          clientProjectIds: user.hbmsClientAccess.map((item) => item.projectId),
        })),
        employees,
        projects,
        departments,
      },
    });
  } catch (error) {
    handlePrismaError(res, error, 'Could not load roles');
  }
});

router.get('/preview/:employeeId', async (req, res) => {
  try {
    if (!req.access.orgWide) return res.status(403).json({ error: 'Only a director or super administrator can preview access' });
    const preview = await loadEmployeePreview(req.params.employeeId);
    if (!preview) return res.status(404).json({ error: 'Worker not found' });
    const projects = preview.access.projectIds
      ? await prisma.hbmsProject.findMany({
        where: { id: { in: preview.access.projectIds } },
        select: { id: true, code: true, name: true, businessUnit: { select: { name: true } } },
      })
      : [];
    res.json({
      data: {
        worker: {
          id: preview.employee.id,
          name: `${preview.employee.firstName} ${preview.employee.lastName}`,
          staffCode: preview.employee.staffCode,
          linked: Boolean(preview.employee.userId),
        },
        access: publicAccess(preview.access),
        projects,
        seesEveryProject: preview.access.projectIds == null,
        confidentialHr: preview.access.canReadConfidentialHr,
      },
    });
  } catch (error) {
    handlePrismaError(res, error, 'Could not preview access');
  }
});

router.put('/users/:userId', async (req, res) => {
  try {
    if (!req.access.orgWide) return res.status(403).json({ error: 'Only a director or super administrator can assign roles' });
    const userId = Number(req.params.userId);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const requested = uniqueRoles(req.body.roles);
    if (requested.some((role) => !ASSIGNABLE.includes(role) && role !== 'SUPER_ADMIN')) {
      return res.status(400).json({ error: 'Choose a known role' });
    }
    if (requested.includes('SUPER_ADMIN') && !req.access.unrestricted) {
      return res.status(403).json({ error: 'Only a super administrator can assign that role' });
    }
    const roles = requested.filter((role) => role !== 'SUPER_ADMIN' || user.role === 'ADMIN' || req.access.unrestricted);
    const storedRoles = roles.filter((role) => role !== 'SUPER_ADMIN' || user.role !== 'ADMIN');
    const employeeId = req.body.employeeId || null;
    const clientProjectIds = Array.isArray(req.body.clientProjectIds) ? req.body.clientProjectIds.filter(Boolean) : [];
    const departmentIds = Array.isArray(req.body.departmentIds) ? req.body.departmentIds.filter(Boolean) : [];

    if (employeeId) {
      const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
      if (!employee) return res.status(400).json({ error: 'Choose a valid worker' });
    }
    if (roles.includes('CLIENT') && clientProjectIds.length) {
      const found = await prisma.hbmsProject.count({ where: { id: { in: clientProjectIds } } });
      if (found !== clientProjectIds.length) return res.status(400).json({ error: 'Choose a valid project for the client' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.hbmsUserRole.deleteMany({ where: { userId } });
      if (storedRoles.length) {
        await tx.hbmsUserRole.createMany({ data: storedRoles.map((role) => ({ userId, role })) });
      }
      await tx.hbmsClientAccess.deleteMany({ where: { userId } });
      if (roles.includes('CLIENT') && clientProjectIds.length) {
        await tx.hbmsClientAccess.createMany({ data: clientProjectIds.map((projectId) => ({ userId, projectId })) });
      }
      if (employeeId) {
        await tx.employee.updateMany({ where: { userId, NOT: { id: employeeId } }, data: { userId: null } });
        await tx.employee.update({ where: { id: employeeId }, data: { userId } });
      }
      if (roles.includes('DEPARTMENT_MANAGER') && employeeId) {
        await tx.department.updateMany({
          where: { managerId: employeeId, ...(departmentIds.length ? { id: { notIn: departmentIds } } : {}) },
          data: { managerId: null },
        });
        if (departmentIds.length) {
          await tx.department.updateMany({ where: { id: { in: departmentIds } }, data: { managerId: employeeId } });
        }
      }
    });
    res.json({ data: { saved: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Could not save roles');
  }
});

function uniqueRoles(value) {
  const list = Array.isArray(value) ? value : [];
  return [...new Set(list.map((role) => String(role)))];
}

module.exports = router;
