const prisma = require('../../prismaClient');

const UNITS = [
  {
    code: 'HBLAB',
    name: 'HBLab',
    description: 'Training, technology, and learning operations',
  },
  {
    code: 'HBSTUDIO',
    name: 'HBStudio',
    description: 'Creative production and studio operations',
  },
];

const DEPARTMENTS = {
  HBLAB: [
    'Software Development',
    'Training and Internship',
    'IT Support and Networking',
    'Administration',
    'Sales and Marketing',
  ],
  HBSTUDIO: [
    'Photography',
    'Videography',
    'Live Streaming',
    'Podcast Production',
    'Digital Marketing',
    'Content Creation',
  ],
};

async function ensureDepartments() {
  const units = await prisma.businessUnit.findMany();
  for (const unit of units) {
    if (unit.code === 'HBLAB') {
      const engineering = await prisma.department.findFirst({
        where: { businessUnitId: unit.id, name: 'Engineering' },
      });
      const software = await prisma.department.findFirst({
        where: { businessUnitId: unit.id, name: 'Software Development' },
      });
      if (engineering && !software) {
        await prisma.department.update({
          where: { id: engineering.id },
          data: { name: 'Software Development' },
        });
      }
    }
    if (unit.code === 'HBSTUDIO') {
      const production = await prisma.department.findFirst({
        where: { businessUnitId: unit.id, name: 'Production' },
        include: { _count: { select: { employees: true } } },
      });
      if (production && production._count.employees === 0) {
        await prisma.department.delete({ where: { id: production.id } });
      }
    }

    for (const name of DEPARTMENTS[unit.code] || []) {
      const existing = await prisma.department.findFirst({
        where: { businessUnitId: unit.id, name },
      });
      if (!existing) {
        await prisma.department.create({ data: { name, businessUnitId: unit.id } });
      }
    }
  }
}

async function ensureHbmsSeed() {
  for (const unit of UNITS) {
    await prisma.businessUnit.upsert({
      where: { code: unit.code },
      update: { name: unit.name, description: unit.description },
      create: unit,
    });
  }
  await ensureDepartments();
}

module.exports = { ensureHbmsSeed };
