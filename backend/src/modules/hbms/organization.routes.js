const express = require('express');
const { prisma, handlePrismaError, writeAudit } = require('./utils');
const { attachAccess, guardWrites } = require('./access');

const router = express.Router();
router.use(attachAccess);
router.use(guardWrites((req) => req.access.orgWide));

router.get('/business-units', async (req, res) => {
  try {
    const units = await prisma.businessUnit.findMany({
      orderBy: { name: 'asc' },
      include: {
        departments: {
          orderBy: { name: 'asc' },
          include: {
            manager: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { employees: true } },
          },
        },
        _count: { select: { employees: true, projects: true } },
      },
    });
    res.json({ data: units });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load business units');
  }
});

router.get('/positions', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      orderBy: { title: 'asc' },
      include: { _count: { select: { employees: true } } },
    });
    res.json({ data: positions });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load positions');
  }
});

router.post('/positions', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const responsibilities = req.body.responsibilities ? String(req.body.responsibilities).trim() : null;
    if (!title) return res.status(400).json({ error: 'Position title is required' });

    const position = await prisma.position.create({ data: { title, responsibilities } });
    await writeAudit(req.userId, 'position.create', 'Position', position.id, { title });
    res.status(201).json({ data: position });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to create position');
  }
});

router.patch('/positions/:id', async (req, res) => {
  try {
    const data = {};
    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) return res.status(400).json({ error: 'Position title is required' });
      data.title = title;
    }
    if (req.body.responsibilities !== undefined) {
      data.responsibilities = req.body.responsibilities ? String(req.body.responsibilities).trim() : null;
    }
    const position = await prisma.position.update({ where: { id: req.params.id }, data });
    res.json({ data: position });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to update position');
  }
});

router.post('/departments', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const { businessUnitId, managerId } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required' });
    if (!businessUnitId) return res.status(400).json({ error: 'Business unit is required' });

    const department = await prisma.department.create({
      data: {
        name,
        businessUnitId,
        managerId: managerId || null,
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        businessUnit: { select: { id: true, code: true, name: true } },
      },
    });
    await writeAudit(req.userId, 'department.create', 'Department', department.id, {
      name,
      businessUnitId,
    });
    res.status(201).json({ data: department });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'That department already exists in this business unit' });
    }
    handlePrismaError(res, error, 'Failed to create department');
  }
});

router.patch('/departments/:id', async (req, res) => {
  try {
    const name = req.body.name !== undefined ? String(req.body.name).trim() : undefined;
    if (name === '') return res.status(400).json({ error: 'Department name is required' });

    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(req.body.managerId !== undefined ? { managerId: req.body.managerId || null } : {}),
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await writeAudit(req.userId, 'department.update', 'Department', department.id, {
      name: department.name,
    });
    res.json({ data: department });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'That department already exists in this business unit' });
    }
    handlePrismaError(res, error, 'Failed to update department');
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { employees: true } } },
    });
    if (!department) return res.status(404).json({ error: 'Department not found' });

    await prisma.department.delete({ where: { id: department.id } });
    await writeAudit(req.userId, 'department.delete', 'Department', department.id, {
      name: department.name,
      unassigned: department._count.employees,
    });
    res.json({ data: { removed: true, unassigned: department._count.employees } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to remove department');
  }
});

module.exports = router;
