const CATEGORIES = [
  'CONTRACT',
  'REQUIREMENTS',
  'CLIENT_AGREEMENT',
  'DELIVERABLE',
  'TRAINING',
  'INTERNSHIP_REPORT',
  'PRODUCTION',
  'POLICY',
  'MINUTES',
];

const SENSITIVITIES = ['INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];

const DEFAULT_SENSITIVITY = {
  CONTRACT: 'CONFIDENTIAL',
  REQUIREMENTS: 'CONFIDENTIAL',
  CLIENT_AGREEMENT: 'RESTRICTED',
  DELIVERABLE: 'CONFIDENTIAL',
  TRAINING: 'INTERNAL',
  INTERNSHIP_REPORT: 'CONFIDENTIAL',
  PRODUCTION: 'CONFIDENTIAL',
  POLICY: 'INTERNAL',
  MINUTES: 'CONFIDENTIAL',
};

function relatedEmployeeIds(document) {
  const ids = new Set();
  if (document.employeeId) ids.add(document.employeeId);
  if (document.project?.managerId) ids.add(document.project.managerId);
  for (const member of document.project?.members || []) ids.add(member.employeeId);
  if (document.program?.coordinatorId) ids.add(document.program.coordinatorId);
  for (const trainer of document.program?.trainers || []) ids.add(trainer.employeeId);
  for (const attendee of document.meeting?.attendees || []) ids.add(attendee.employeeId);
  for (const grant of document.grants || []) ids.add(grant.employeeId);
  return ids;
}

function hasGrant(actor, document) {
  const employeeId = actor.employee?.id;
  if (!employeeId) return false;
  return (document.grants || []).some((grant) => grant.employeeId === employeeId);
}

function canReadDocument(actor, document) {
  if (!actor || !document) return false;
  if (actor.role === 'ADMIN' || actor.isSuperAdmin) return true;
  if (actor.isClient && actor.clientOnly) {
    return document.category === 'DELIVERABLE'
      && Boolean(document.projectId)
      && (actor.visibleProjectIds || []).includes(document.projectId);
  }
  if (document.sensitivity === 'RESTRICTED') return hasGrant(actor, document);
  if ((actor.isHr || actor.isCeo) && (document.sensitivity === 'INTERNAL' || document.sensitivity === 'CONFIDENTIAL')) {
    return true;
  }
  const employee = actor.employee;
  if (!employee || employee.status === 'INACTIVE') return false;
  if (document.sensitivity === 'INTERNAL') {
    if (document.category === 'POLICY' || document.category === 'TRAINING') return true;
    if (!document.projectId && !document.businessUnitId) return true;
    if (document.employeeId === employee.id) return true;
    if (document.projectId && (actor.visibleProjectIds || []).includes(document.projectId)) return true;
    if (document.programId && (actor.visibleProgramIds || []).includes(document.programId)) return true;
    if (document.businessUnitId && (actor.businessUnitIds || []).includes(document.businessUnitId) && !document.projectId) return true;
    return false;
  }
  if (document.sensitivity === 'CONFIDENTIAL') return relatedEmployeeIds(document).has(employee.id);
  return false;
}

module.exports = {
  CATEGORIES,
  SENSITIVITIES,
  DEFAULT_SENSITIVITY,
  canReadDocument,
};
