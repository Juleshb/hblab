const express = require('express');
const path = require('path');
const multer = require('multer');
const { attachAccess, guardWrites, allowsProgram, canManageProgram, canTrainProgram, applyIdScope } = require('./access');
const {
  prisma,
  parsePagination,
  isOneOf,
  parseDate,
  handlePrismaError,
  writeAudit,
} = require('./utils');

const router = express.Router();
router.use(attachAccess);
router.use(guardWrites((req) => req.access.orgWide || req.access.roles.includes('PROGRAM_COORDINATOR') || req.access.trainerProgramIds.length > 0));

const PROGRAM_KINDS = ['SOFTWARE_TRAINING', 'MEDIA_TRAINING', 'HOLIDAY', 'INTERNSHIP', 'WORKSHOP', 'HACKATHON', 'COURSE'];
const PROGRAM_STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const TRAINER_ROLES = ['TRAINER', 'FACILITATOR'];
const ENROLLMENT_STATUSES = ['REGISTERED', 'ACTIVE', 'COMPLETED', 'WITHDRAWN'];
const ASSIGNMENT_KINDS = ['ASSIGNMENT', 'ASSESSMENT', 'PROJECT'];
const SUBMISSION_STATUSES = ['PENDING', 'SUBMITTED', 'GRADED'];
const ATTENDANCE = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];

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

const personSelect = { id: true, firstName: true, lastName: true, email: true, staffCode: true };

const detailInclude = {
  businessUnit: { select: { id: true, code: true, name: true } },
  coordinator: { select: personSelect },
  trainers: {
    include: { employee: { select: personSelect } },
    orderBy: { createdAt: 'asc' },
  },
  sessions: {
    include: { attendance: true },
    orderBy: { startsAt: 'asc' },
  },
  enrollments: {
    include: {
      participant: {
        include: { employee: { select: personSelect } },
      },
    },
    orderBy: { registeredAt: 'asc' },
  },
  materials: { orderBy: { createdAt: 'asc' } },
  assignments: {
    include: { submissions: true },
    orderBy: { createdAt: 'asc' },
  },
  reports: { orderBy: { createdAt: 'desc' } },
};

function parseCapacity(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const capacity = Number(value);
  if (!Number.isInteger(capacity) || capacity < 0) return { invalid: true };
  return capacity;
}

function parseScore(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const score = Number(value);
  if (!Number.isInteger(score) || score < 0 || score > 100) return { invalid: true };
  return score;
}

function activeEnrollments(program) {
  return (program.enrollments || []).filter((enrollment) => enrollment.status !== 'WITHDRAWN');
}

function programProgress(program) {
  const enrolled = activeEnrollments(program);
  const assignments = program.assignments || [];
  if (enrolled.length && assignments.length) {
    const expected = enrolled.length * assignments.length;
    const graded = assignments.reduce((sum, assignment) => sum + (assignment.submissions || []).filter((submission) => (
      submission.status === 'GRADED' && enrolled.some((enrollment) => enrollment.participantId === submission.participantId)
    )).length, 0);
    return Math.round((graded / expected) * 100);
  }
  const sessions = program.sessions || [];
  if (sessions.length) {
    const held = sessions.filter((session) => new Date(session.startsAt) <= new Date()).length;
    return Math.round((held / sessions.length) * 100);
  }
  return program.status === 'COMPLETED' ? 100 : 0;
}

function present(program) {
  const enrolled = activeEnrollments(program);
  return {
    ...program,
    progress: programProgress(program),
    participantCount: enrolled.length,
  };
}

async function loadProgram(id) {
  const program = await prisma.hbmsProgram.findUnique({ where: { id }, include: detailInclude });
  return program ? present(program) : null;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function learnerForWorker(employeeId) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw httpError(404, 'Worker not found');
  const existing = await prisma.hbmsParticipant.findUnique({ where: { employeeId } });
  if (existing) return existing;
  return prisma.hbmsParticipant.create({
    data: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      employeeId: employee.id,
    },
  });
}

async function assertRoom(programId) {
  const program = await prisma.hbmsProgram.findUnique({
    where: { id: programId },
    include: { enrollments: { select: { status: true } } },
  });
  if (!program) throw httpError(404, 'Program not found');
  const taken = program.enrollments.filter((enrollment) => enrollment.status !== 'WITHDRAWN').length;
  if (program.capacity != null && taken >= program.capacity) {
    throw httpError(400, 'This program has reached its number of participants');
  }
  return program;
}

router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const where = {};
    if (req.access.programIds) where.id = { in: req.access.programIds };
    if (req.query.businessUnitId) where.businessUnitId = req.query.businessUnitId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.kind) where.kind = req.query.kind;
    if (req.query.q) where.name = { contains: String(req.query.q).trim(), mode: 'insensitive' };

    const [total, programs] = await Promise.all([
      prisma.hbmsProgram.count({ where }),
      prisma.hbmsProgram.findMany({
        where,
        include: detailInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    res.json({ data: programs.map(present), meta: { page, limit, total } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load programs');
  }
});

router.get('/participants', async (req, res) => {
  try {
    if (!req.access.orgWide && !req.access.roles.includes('PROGRAM_COORDINATOR') && !req.access.trainerProgramIds.length && !req.access.hr) {
      return res.status(403).json({ error: 'You do not have permission to view participants' });
    }
    const where = {};
    if (req.query.q) {
      const q = String(req.query.q).trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    const participants = await prisma.hbmsParticipant.findMany({
      where,
      include: { employee: { select: personSelect } },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 100,
    });
    res.json({ data: participants });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load participants');
  }
});

router.use('/:id', async (req, res, next) => {
  if (req.method === 'GET') return next();
  const program = await prisma.hbmsProgram.findUnique({
    where: { id: req.params.id },
    select: { id: true, businessUnitId: true, coordinatorId: true },
  });
  if (!program) return res.status(404).json({ error: 'Program not found' });
  const training = ['/attendance', '/assignments', '/sessions', '/materials'].some((part) => req.path.includes(part));
  const allowed = training ? canTrainProgram(req.access, program.id) : canManageProgram(req.access, program);
  if (!allowed) return res.status(403).json({ error: 'You do not have permission to change this program' });
  return next();
});

router.get('/:id', async (req, res) => {
  try {
    const program = await loadProgram(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    if (!allowsProgram(req.access, program.id)) return res.status(404).json({ error: 'Program not found' });
    res.json({ data: program });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load program');
  }
});

router.post('/', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Program name is required' });
    if (!req.body.businessUnitId) return res.status(400).json({ error: 'Business unit is required' });
    if (!req.access.orgWide && !req.access.roles.includes('PROGRAM_COORDINATOR')) {
      return res.status(403).json({ error: 'You do not have permission to create a program' });
    }
    if (!req.access.orgWide && req.access.businessUnitId && req.body.businessUnitId !== req.access.businessUnitId) {
      return res.status(403).json({ error: 'You can create programs only in your business unit' });
    }
    if (req.body.kind && !isOneOf(req.body.kind, PROGRAM_KINDS)) return res.status(400).json({ error: 'Invalid program type' });
    if (req.body.status && !isOneOf(req.body.status, PROGRAM_STATUSES)) return res.status(400).json({ error: 'Invalid program status' });
    const startDate = parseDate(req.body.startDate);
    const endDate = parseDate(req.body.endDate);
    if (startDate?.invalid || endDate?.invalid) return res.status(400).json({ error: 'Invalid date' });
    const capacity = parseCapacity(req.body.capacity);
    if (capacity?.invalid) return res.status(400).json({ error: 'Number of participants must be a whole number' });

    const created = await prisma.hbmsProgram.create({
      data: {
        name,
        description: req.body.description ? String(req.body.description).trim() : null,
        objectives: req.body.objectives ? String(req.body.objectives).trim() : null,
        kind: req.body.kind || 'INTERNSHIP',
        status: req.body.status || 'PLANNED',
        businessUnitId: req.body.businessUnitId,
        coordinatorId: req.body.coordinatorId || null,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
        capacity: capacity ?? null,
        outcomes: req.body.outcomes ? String(req.body.outcomes).trim() : null,
      },
    });
    await writeAudit(req.userId, 'program.create', 'HbmsProgram', created.id, { name });
    res.status(201).json({ data: await loadProgram(created.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to create program');
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = {};
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ error: 'Program name is required' });
      data.name = name;
    }
    if (req.body.description !== undefined) data.description = req.body.description ? String(req.body.description).trim() : null;
    if (req.body.objectives !== undefined) data.objectives = req.body.objectives ? String(req.body.objectives).trim() : null;
    if (req.body.outcomes !== undefined) data.outcomes = req.body.outcomes ? String(req.body.outcomes).trim() : null;
    if (req.body.kind !== undefined) {
      if (!isOneOf(req.body.kind, PROGRAM_KINDS)) return res.status(400).json({ error: 'Invalid program type' });
      data.kind = req.body.kind;
    }
    if (req.body.status !== undefined) {
      if (!isOneOf(req.body.status, PROGRAM_STATUSES)) return res.status(400).json({ error: 'Invalid program status' });
      data.status = req.body.status;
    }
    if (req.body.businessUnitId !== undefined) data.businessUnitId = req.body.businessUnitId;
    if (req.body.coordinatorId !== undefined) data.coordinatorId = req.body.coordinatorId || null;
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
    if (req.body.capacity !== undefined) {
      const capacity = parseCapacity(req.body.capacity);
      if (capacity?.invalid) return res.status(400).json({ error: 'Number of participants must be a whole number' });
      data.capacity = capacity;
    }
    await prisma.hbmsProgram.update({ where: { id: req.params.id }, data });
    const program = await loadProgram(req.params.id);
    res.json({ data: program });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to update program');
  }
});

router.post('/:id/trainers', async (req, res) => {
  try {
    const { employeeId, role } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Choose a worker' });
    if (role && !isOneOf(role, TRAINER_ROLES)) return res.status(400).json({ error: 'Invalid trainer role' });
    const worker = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    await prisma.hbmsProgramTrainer.upsert({
      where: { programId_employeeId: { programId: req.params.id, employeeId } },
      update: { role: role || 'TRAINER' },
      create: { programId: req.params.id, employeeId, role: role || 'TRAINER' },
    });
    res.status(201).json({ data: await loadProgram(req.params.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to add trainer');
  }
});

router.delete('/:id/trainers/:employeeId', async (req, res) => {
  try {
    const removed = await prisma.hbmsProgramTrainer.deleteMany({
      where: { programId: req.params.id, employeeId: req.params.employeeId },
    });
    if (!removed.count) return res.status(404).json({ error: 'Trainer not found' });
    res.json({ data: await loadProgram(req.params.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to remove trainer');
  }
});

router.post('/:id/sessions', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Session title is required' });
    const startsAt = parseDate(req.body.startsAt);
    const endsAt = parseDate(req.body.endsAt);
    if (!startsAt || startsAt.invalid) return res.status(400).json({ error: 'Session date is required' });
    if (endsAt?.invalid) return res.status(400).json({ error: 'Invalid end time' });
    const program = await prisma.hbmsProgram.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!program) return res.status(404).json({ error: 'Program not found' });
    await prisma.hbmsProgramSession.create({
      data: {
        programId: program.id,
        title,
        startsAt,
        endsAt: endsAt || null,
        location: req.body.location ? String(req.body.location).trim() : null,
      },
    });
    res.status(201).json({ data: await loadProgram(program.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to add session');
  }
});

router.delete('/:id/sessions/:sessionId', async (req, res) => {
  try {
    const removed = await prisma.hbmsProgramSession.deleteMany({
      where: { id: req.params.sessionId, programId: req.params.id },
    });
    if (!removed.count) return res.status(404).json({ error: 'Session not found' });
    res.json({ data: await loadProgram(req.params.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to remove session');
  }
});

router.put('/:id/sessions/:sessionId/attendance', async (req, res) => {
  try {
    const session = await prisma.hbmsProgramSession.findFirst({
      where: { id: req.params.sessionId, programId: req.params.id },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const records = Array.isArray(req.body.records) ? req.body.records : [];
    for (const record of records) {
      if (!ATTENDANCE.includes(record.status)) return res.status(400).json({ error: 'Invalid attendance status' });
    }
    await prisma.$transaction(records.map((record) => prisma.hbmsProgramAttendance.upsert({
      where: { sessionId_participantId: { sessionId: session.id, participantId: record.participantId } },
      update: { status: record.status },
      create: { sessionId: session.id, participantId: record.participantId, status: record.status },
    })));
    res.json({ data: await loadProgram(req.params.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to save attendance');
  }
});

router.post('/:id/enrollments', async (req, res) => {
  try {
    await assertRoom(req.params.id);
    let participant;
    if (req.body.participantId) {
      participant = await prisma.hbmsParticipant.findUnique({ where: { id: req.body.participantId } });
      if (!participant) return res.status(404).json({ error: 'Participant not found' });
    } else if (req.body.employeeId) {
      participant = await learnerForWorker(req.body.employeeId);
    } else {
      const firstName = String(req.body.firstName || '').trim();
      const lastName = String(req.body.lastName || '').trim();
      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : null;
      if (!firstName || !lastName) return res.status(400).json({ error: 'Participant name is required' });
      if (email) {
        const worker = await prisma.employee.findUnique({ where: { email } });
        if (worker) {
          return res.status(400).json({ error: 'That email belongs to a worker. Register them as a learner instead of creating an employee.' });
        }
      }
      participant = await prisma.hbmsParticipant.create({
        data: {
          firstName,
          lastName,
          email,
          phone: req.body.phone ? String(req.body.phone).trim() : null,
        },
      });
    }
    if (req.body.status && !isOneOf(req.body.status, ENROLLMENT_STATUSES)) {
      return res.status(400).json({ error: 'Invalid registration status' });
    }
    await prisma.hbmsProgramEnrollment.create({
      data: {
        programId: req.params.id,
        participantId: participant.id,
        status: req.body.status || 'REGISTERED',
      },
    });
    res.status(201).json({ data: await loadProgram(req.params.id) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    handlePrismaError(res, error, 'Failed to register participant');
  }
});

router.patch('/:id/enrollments/:enrollmentId', async (req, res) => {
  try {
    if (!isOneOf(req.body.status, ENROLLMENT_STATUSES)) return res.status(400).json({ error: 'Invalid registration status' });
    const enrollment = await prisma.hbmsProgramEnrollment.findFirst({
      where: { id: req.params.enrollmentId, programId: req.params.id },
    });
    if (!enrollment) return res.status(404).json({ error: 'Registration not found' });
    await prisma.hbmsProgramEnrollment.update({
      where: { id: enrollment.id },
      data: { status: req.body.status },
    });
    res.json({ data: await loadProgram(req.params.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to update registration');
  }
});

router.post('/:id/materials', (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) return res.status(400).json({ error: error.message || 'Upload failed' });
    return next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose a file to upload' });
    const program = await prisma.hbmsProgram.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!program) return res.status(404).json({ error: 'Program not found' });
    await prisma.hbmsProgramMaterial.create({
      data: {
        programId: program.id,
        title: String(req.body.title || req.file.originalname).trim(),
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
      },
    });
    res.status(201).json({ data: await loadProgram(program.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to store training material');
  }
});

router.delete('/:id/materials/:materialId', async (req, res) => {
  try {
    const removed = await prisma.hbmsProgramMaterial.deleteMany({
      where: { id: req.params.materialId, programId: req.params.id },
    });
    if (!removed.count) return res.status(404).json({ error: 'Material not found' });
    res.json({ data: await loadProgram(req.params.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to remove material');
  }
});

router.post('/:id/assignments', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Assignment title is required' });
    if (req.body.kind && !isOneOf(req.body.kind, ASSIGNMENT_KINDS)) return res.status(400).json({ error: 'Invalid assignment type' });
    const dueDate = parseDate(req.body.dueDate);
    if (dueDate?.invalid) return res.status(400).json({ error: 'Invalid due date' });
    const program = await prisma.hbmsProgram.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!program) return res.status(404).json({ error: 'Program not found' });
    await prisma.hbmsProgramAssignment.create({
      data: {
        programId: program.id,
        title,
        description: req.body.description ? String(req.body.description).trim() : null,
        kind: req.body.kind || 'ASSIGNMENT',
        dueDate: dueDate ?? null,
      },
    });
    res.status(201).json({ data: await loadProgram(program.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to add assignment');
  }
});

router.put('/:id/assignments/:assignmentId/submissions/:participantId', async (req, res) => {
  try {
    const assignment = await prisma.hbmsProgramAssignment.findFirst({
      where: { id: req.params.assignmentId, programId: req.params.id },
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (req.body.status && !isOneOf(req.body.status, SUBMISSION_STATUSES)) {
      return res.status(400).json({ error: 'Invalid submission status' });
    }
    const score = parseScore(req.body.score);
    if (score?.invalid) return res.status(400).json({ error: 'Score must be a whole number from 0 to 100' });
    const status = score != null ? 'GRADED' : (req.body.status || 'SUBMITTED');
    await prisma.hbmsProgramSubmission.upsert({
      where: {
        assignmentId_participantId: {
          assignmentId: assignment.id,
          participantId: req.params.participantId,
        },
      },
      update: {
        status,
        score: score === undefined ? undefined : score,
        feedback: req.body.feedback !== undefined ? (req.body.feedback ? String(req.body.feedback).trim() : null) : undefined,
      },
      create: {
        assignmentId: assignment.id,
        participantId: req.params.participantId,
        status,
        score: score ?? null,
        feedback: req.body.feedback ? String(req.body.feedback).trim() : null,
      },
    });
    res.json({ data: await loadProgram(req.params.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to record assessment');
  }
});

router.post('/:id/reports', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const body = String(req.body.body || '').trim();
    if (!title || !body) return res.status(400).json({ error: 'Report title and outcome are required' });
    const program = await prisma.hbmsProgram.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!program) return res.status(404).json({ error: 'Program not found' });
    await prisma.hbmsProgramReport.create({ data: { programId: program.id, title, body } });
    res.status(201).json({ data: await loadProgram(program.id) });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to add report');
  }
});

module.exports = router;
