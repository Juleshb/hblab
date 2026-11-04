const express = require('express');

const router = express.Router();

router.use('/conversations', require('./conversations.routes'));
router.use('/calls', require('./calls.routes'));
router.use(require('./devices.routes'));
router.use('/access', require('./access.routes'));
router.use(require('./organization.routes'));
router.use('/employees', require('./employees.routes'));
router.use('/projects', require('./projects.routes'));
router.use('/programs', require('./programs.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use(require('./communications.routes'));
router.use('/documents', require('./documents.routes'));
router.use('/tasks', require('./tasks.routes'));
router.use('/calendar', require('./calendar.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/reports', require('./reports.routes'));

module.exports = router;
