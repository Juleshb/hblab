const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { prisma, isOneOf, handlePrismaError, writeAudit } = require('./utils');
const { attachAccess } = require('./access');
const { CATEGORIES, SENSITIVITIES, DEFAULT_SENSITIVITY, canReadDocument } = require('./documentAccess');
const {
  INCOMING_ROOT,
  isAllowed,
  storeUploadedFile,
  openStoredFile,
  deleteStoredFile,
  removePath,
} = require('./objectStore');

const router = express.Router();
router.use(attachAccess);

const personSelect = { id: true, firstName: true, lastName: true, staffCode: true };

const documentInclude = {
  employee: { select: personSelect },
  project: {
    select: {
      id: true,
      name: true,
      code: true,
      managerId: true,
      members: { select: { employeeId: true } },
    },
  },
  program: {
    select: {
      id: true,
      name: true,
      coordinatorId: true,
      trainers: { select: { employeeId: true } },
    },
  },
  meeting: {
    select: {
      id: true,
      title: true,
      attendees: { select: { employeeId: true } },
    },
  },
  businessUnit: { select: { id: true, name: true, code: true } },
  grants: {
    select: {
      employeeId: true,
      employee: { select: personSelect },
    },
  },
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(INCOMING_ROOT, { recursive: true });
      cb(null, INCOMING_ROOT);
    },
    filename: (req, file, cb) => {
      const safeName = path.basename(file.originalname || 'file').replace(/[^\w.\-]+/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (isAllowed(file)) return cb(null, true);
    cb(new Error('Upload a document, photo, or video file'));
  },
});

function actorFrom(req) {
  const access = req.access;
  return {
    role: req.userRole,
    isSuperAdmin: access.unrestricted,
    isCeo: access.roles.includes('CEO'),
    isHr: access.hr,
    isClient: access.isClient,
    clientOnly: access.clientOnly,
    employee: access.employee,
    visibleProjectIds: access.projectIds || [],
    visibleProgramIds: access.programIds || [],
    businessUnitIds: access.businessUnitIds || [],
  };
}

function canStoreDocument(req) {
  const access = req.access;
  if (access.orgWide) return true;
  const category = String(req.body?.category || '');
  if (category === 'CONTRACT' || category === 'CLIENT_AGREEMENT') return false;
  const employeeId = req.body?.employeeId || null;
  if (employeeId && employeeId !== access.employeeId) return false;
  if (req.body?.projectId && (access.projectIds || []).includes(req.body.projectId)) return true;
  if (req.body?.programId && (access.programIds || []).includes(req.body.programId)) return true;
  if (employeeId && employeeId === access.employeeId) return true;
  return false;
}

function uploadSingle(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Photos and video must be 200 MB or smaller'
      : error.message;
    return res.status(400).json({ error: message });
  });
}

function idList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
}

function present(document) {
  return {
    id: document.id,
    title: document.title,
    category: document.category,
    sensitivity: document.sensitivity,
    fileName: document.fileName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    storage: document.storage,
    storageLabel: document.storage === 'OBJECT' ? 'Object storage' : 'Private files',
    provider: document.provider,
    employee: document.employee,
    project: document.project
      ? { id: document.project.id, name: document.project.name, code: document.project.code }
      : null,
    program: document.program
      ? { id: document.program.id, name: document.program.name }
      : null,
    meeting: document.meeting
      ? { id: document.meeting.id, title: document.meeting.title }
      : null,
    businessUnit: document.businessUnit,
    grants: (document.grants || []).map((grant) => grant.employee),
    createdAt: document.createdAt,
  };
}

async function loadDocument(id) {
  return prisma.hbmsDocument.findUnique({
    where: { id },
    include: documentInclude,
  });
}

router.get('/', async (req, res) => {
  try {
    const where = {};
    if (req.query.category) where.category = String(req.query.category);
    if (req.query.sensitivity) where.sensitivity = String(req.query.sensitivity);
    if (req.query.employeeId) where.employeeId = String(req.query.employeeId);
    if (req.query.projectId) where.projectId = String(req.query.projectId);
    if (req.query.programId) where.programId = String(req.query.programId);
    if (req.query.meetingId) where.meetingId = String(req.query.meetingId);
    const documents = await prisma.hbmsDocument.findMany({
      where,
      include: documentInclude,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const actor = actorFrom(req);
    res.json({ data: documents.filter((document) => canReadDocument(actor, document)).map(present) });
  } catch (error) {
    handlePrismaError(res, error, 'Could not load documents');
  }
});

router.post('/', uploadSingle, async (req, res) => {
  const file = req.file;
  let stored = null;
  try {
    if (!canStoreDocument(req)) {
      if (file?.path) await removePath(file.path);
      return res.status(403).json({ error: 'You do not have permission to store this document' });
    }
    const title = String(req.body.title || '').trim();
    const category = String(req.body.category || '').trim();
    const sensitivity = String(req.body.sensitivity || DEFAULT_SENSITIVITY[category] || '');
    if (!file) return res.status(400).json({ error: 'Choose a file to store' });
    if (!title || !isOneOf(category, CATEGORIES) || !isOneOf(sensitivity, SENSITIVITIES)) {
      await removePath(file.path);
      if (!title) return res.status(400).json({ error: 'Enter a document title' });
      if (!isOneOf(category, CATEGORIES)) return res.status(400).json({ error: 'Choose a document category' });
      return res.status(400).json({ error: 'Choose a sensitivity level' });
    }

    const employeeId = req.body.employeeId || null;
    const projectId = req.body.projectId || null;
    const programId = req.body.programId || null;
    const meetingId = req.body.meetingId || null;
    const businessUnitId = req.body.businessUnitId || null;
    const grantIds = idList(req.body.grantIds);

    stored = await storeUploadedFile(file);
    const document = await prisma.hbmsDocument.create({
      data: {
        title,
        category,
        sensitivity,
        fileName: path.basename(file.originalname || file.filename),
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        storage: stored.storage,
        storageKey: stored.storageKey,
        provider: stored.provider,
        employeeId,
        projectId,
        programId,
        meetingId,
        businessUnitId,
        uploadedById: req.userId,
        grants: grantIds.length
          ? { create: grantIds.map((employeeId) => ({ employeeId })) }
          : undefined,
      },
      include: documentInclude,
    });
    await writeAudit(req.userId, 'document.create', 'HbmsDocument', document.id, {
      category,
      sensitivity,
      storage: stored.storage,
      provider: stored.provider,
    });
    res.status(201).json({ data: present(document) });
  } catch (error) {
    if (stored) await deleteStoredFile(stored).catch(() => {});
    else if (file?.path) await removePath(file.path);
    if (error.status) return res.status(error.status).json({ error: error.message });
    handlePrismaError(res, error, 'Could not store the document');
  }
});

router.get('/:id/file', async (req, res) => {
  try {
    const document = await loadDocument(req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found' });
    const actor = actorFrom(req);
    if (!canReadDocument(actor, document)) {
      return res.status(403).json({ error: 'You do not have access to this document' });
    }
    const stream = await openStoredFile(document);
    const safeName = document.fileName.replace(/["\r\n]/g, '');
    const disposition = document.mimeType.startsWith('image/') || document.mimeType.startsWith('video/')
      ? 'inline'
      : 'attachment';
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ error: 'Stored file was not found' });
    });
    stream.pipe(res);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    handlePrismaError(res, error, 'Could not open the document');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!req.access.orgWide && !req.access.roles.includes('HR')) {
      return res.status(403).json({ error: 'You do not have permission to remove this document' });
    }
    const document = await loadDocument(req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found' });
    await prisma.hbmsDocument.delete({ where: { id: document.id } });
    await deleteStoredFile(document);
    await writeAudit(req.userId, 'document.delete', 'HbmsDocument', document.id, { title: document.title });
    res.json({ data: { removed: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Could not remove the document');
  }
});

module.exports = router;
