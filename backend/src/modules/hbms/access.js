const auth = require('../../middleware/authMiddleware');
const { prisma } = require('./utils');

const ROLE_INFO = [
  ['SUPER_ADMIN', 'Super Administrator', 'Full access to both business units. Platform settings stay with the application administrator account.'],
  ['CEO', 'CEO / Director', 'Organization-wide overview, reports, projects, staff, and approvals.'],
  ['DEPARTMENT_MANAGER', 'Department Manager', 'Department workers, and projects linked to that department. Not confidential HR records, and not every project in the other business unit.'],
  ['PROJECT_MANAGER', 'Project Manager', 'Assigned projects, milestones, and project teams.'],
  ['HR', 'HR / Administrator', 'Staff records, attendance, leave, and documents.'],
  ['PROGRAM_COORDINATOR', 'Program Coordinator', 'Training programs, participants, schedules, and reports for their business unit.'],
  ['TRAINER', 'Trainer', 'Assigned programs, attendance, assignments, and assessments.'],
  ['WORKER', 'Worker / Employee', 'Personal profile, assigned projects, tasks, announcements, and permitted documents.'],
  ['INTERN', 'Intern', 'Assigned training, tasks, learning materials, and feedback.'],
  ['CLIENT', 'Client', 'Selected project progress and approved deliverables.'],
];

const TAB_ORDER = ['overview', 'organization', 'workers', 'projects', 'programs', 'tasks', 'attendance', 'messages', 'documents', 'reports', 'roles'];

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function buildAccess(facts) {
  const roles = new Set(facts.roles || []);
  if (facts.appRole === 'ADMIN') roles.add('SUPER_ADMIN');
  const unrestricted = roles.has('SUPER_ADMIN');
  const orgWide = unrestricted || roles.has('CEO');
  const hr = orgWide || roles.has('HR');
  const employee = facts.employee || null;
  const departmentIds = unique(facts.managedDepartmentIds);
  const departmentScope = departmentIds.length > 0;
  const managedProjectIds = unique(facts.managedProjectIds);
  const memberProjectIds = unique(facts.memberProjectIds);
  const departmentProjectIds = departmentScope ? unique(facts.departmentProjectIds) : [];
  const clientProjectIds = roles.has('CLIENT') ? unique(facts.clientProjectIds) : [];
  const coordinatedProgramIds = unique(facts.coordinatedProgramIds);
  const trainerProgramIds = unique(facts.trainerProgramIds);
  const enrolledProgramIds = unique(facts.enrolledProgramIds);
  const unitProgramIds = roles.has('PROGRAM_COORDINATOR') ? unique(facts.unitProgramIds) : [];
  const isIntern = roles.has('INTERN') || employee?.employmentType === 'INTERN';
  const isWorker = Boolean(employee) || roles.has('WORKER') || isIntern;
  const isClient = roles.has('CLIENT');

  const projectIds = orgWide
    ? null
    : unique([
      ...departmentProjectIds,
      ...managedProjectIds,
      ...memberProjectIds,
      ...clientProjectIds,
    ]);
  const programIds = orgWide
    ? null
    : unique([...coordinatedProgramIds, ...unitProgramIds, ...trainerProgramIds, ...enrolledProgramIds]);
  const staffIds = orgWide || hr
    ? null
    : unique([
      ...(employee ? [employee.id] : []),
      ...(departmentScope ? facts.departmentEmployeeIds || [] : []),
    ]);
  const directoryIds = orgWide || hr
    ? null
    : unique([...(staffIds || []), ...(facts.teammateIds || [])]);

  const tabs = [];
  const add = (tab) => {
    if (!tabs.includes(tab)) tabs.push(tab);
  };
  const clientOnly = isClient && !orgWide && !hr && !isWorker && !departmentScope && !managedProjectIds.length && !roles.has('PROGRAM_COORDINATOR') && !trainerProgramIds.length;
  if (clientOnly) {
    if (clientProjectIds.length) add('projects');
    add('documents');
  } else {
    if (orgWide || hr || departmentScope || isWorker || managedProjectIds.length) add('overview');
    if (orgWide || hr || departmentScope) add('organization');
    if (orgWide || hr || departmentScope || isWorker) add('workers');
    if (orgWide || (projectIds && projectIds.length) || roles.has('PROJECT_MANAGER')) add('projects');
    if (orgWide || roles.has('PROGRAM_COORDINATOR') || trainerProgramIds.length || enrolledProgramIds.length) add('programs');
    if (orgWide || departmentScope || managedProjectIds.length || isWorker) add('tasks');
    if (orgWide || hr || departmentScope || (isWorker && !isClient)) add('attendance');
    if (orgWide || hr || departmentScope || (isWorker && !clientOnly)) add('messages');
    if (orgWide || hr || departmentScope || isWorker || isClient) add('documents');
    if (orgWide || hr || departmentScope || managedProjectIds.length || roles.has('PROGRAM_COORDINATOR') || trainerProgramIds.length) add('reports');
  }
  if (unrestricted || roles.has('CEO')) add('roles');
  const orderedTabs = TAB_ORDER.filter((tab) => tabs.includes(tab));
  const allowed = unrestricted || orderedTabs.length > 0;

  return {
    allowed,
    roles: [...roles],
    unrestricted,
    orgWide,
    hr,
    departmentScope,
    departmentIds: departmentScope ? departmentIds : [],
    managedProjectIds,
    trainerProgramIds,
    clientProjectIds,
    projectIds,
    programIds,
    staffIds,
    directoryIds,
    employeeId: employee?.id || null,
    businessUnitId: employee?.businessUnitId || null,
    businessUnitIds: unique(facts.businessUnitIds || (employee ? [employee.businessUnitId] : [])),
    isIntern,
    isWorker,
    isClient,
    clientOnly,
    canReadConfidentialHr: unrestricted || hr || roles.has('CEO'),
    tabs: orderedTabs,
    employee: employee
      ? {
        id: employee.id,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        photoKey: employee.photoKey || null,
        status: employee.status,
        departmentId: employee.departmentId || null,
        businessUnitId: employee.businessUnitId,
        employmentType: employee.employmentType,
      }
      : null,
  };
}

async function factsForEmployee(employee, roles, clientProjectIds) {
  if (!employee) {
    return {
      roles,
      employee: null,
      clientProjectIds,
      managedDepartmentIds: [],
      departmentProjectIds: [],
      departmentEmployeeIds: [],
      managedProjectIds: [],
      memberProjectIds: [],
      teammateIds: [],
      coordinatedProgramIds: [],
      trainerProgramIds: [],
      enrolledProgramIds: [],
      unitProgramIds: [],
    };
  }
  const departmentRows = await prisma.department.findMany({
    where: { managerId: employee.id },
    select: { id: true },
  });
  const departmentIds = departmentRows.map((row) => row.id);
  const [departmentProjects, departmentEmployees, managedProjects, memberships, programs, training, enrollments, unitPrograms] = await Promise.all([
    departmentIds.length
      ? prisma.hbmsProject.findMany({
        where: { departments: { some: { departmentId: { in: departmentIds } } } },
        select: { id: true },
      })
      : [],
    departmentIds.length
      ? prisma.employee.findMany({
        where: { departmentId: { in: departmentIds } },
        select: { id: true },
      })
      : [],
    prisma.hbmsProject.findMany({ where: { managerId: employee.id }, select: { id: true } }),
    prisma.hbmsProjectMember.findMany({
      where: { employeeId: employee.id },
      select: { projectId: true, project: { select: { members: { select: { employeeId: true } } } } },
    }),
    prisma.hbmsProgram.findMany({ where: { coordinatorId: employee.id }, select: { id: true } }),
    prisma.hbmsProgramTrainer.findMany({ where: { employeeId: employee.id }, select: { programId: true } }),
    employee.learnerProfile
      ? prisma.hbmsProgramEnrollment.findMany({
        where: { participantId: employee.learnerProfile.id, status: { not: 'WITHDRAWN' } },
        select: { programId: true },
      })
      : [],
    prisma.hbmsProgram.findMany({ where: { businessUnitId: employee.businessUnitId }, select: { id: true } }),
  ]);
  const teammateIds = memberships.flatMap((membership) => membership.project.members.map((member) => member.employeeId));
  return {
    roles,
    employee,
    clientProjectIds,
    managedDepartmentIds: departmentIds,
    departmentProjectIds: departmentProjects.map((project) => project.id),
    departmentEmployeeIds: departmentEmployees.map((person) => person.id),
    managedProjectIds: managedProjects.map((project) => project.id),
    memberProjectIds: memberships.map((membership) => membership.projectId),
    teammateIds,
    coordinatedProgramIds: programs.map((program) => program.id),
    trainerProgramIds: training.map((role) => role.programId),
    enrolledProgramIds: enrollments.map((enrollment) => enrollment.programId),
    unitProgramIds: unitPrograms.map((program) => program.id),
    businessUnitIds: [employee.businessUnitId],
  };
}

async function loadAccess(userId, appRole) {
  const [roleRows, employee, clientRows] = await Promise.all([
    prisma.hbmsUserRole.findMany({ where: { userId } }),
    prisma.employee.findFirst({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoKey: true,
        status: true,
        departmentId: true,
        businessUnitId: true,
        employmentType: true,
        learnerProfile: { select: { id: true } },
      },
    }),
    prisma.hbmsClientAccess.findMany({ where: { userId }, select: { projectId: true } }),
  ]);
  const facts = await factsForEmployee(
    employee,
    roleRows.map((row) => row.role),
    clientRows.map((row) => row.projectId),
  );
  facts.appRole = appRole;
  return buildAccess(facts);
}

async function loadEmployeePreview(employeeId) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      staffCode: true,
      status: true,
      departmentId: true,
      businessUnitId: true,
      employmentType: true,
      userId: true,
      learnerProfile: { select: { id: true } },
    },
  });
  if (!employee) return null;
  const [roleRows, clientRows] = employee.userId
    ? await Promise.all([
      prisma.hbmsUserRole.findMany({ where: { userId: employee.userId } }),
      prisma.hbmsClientAccess.findMany({ where: { userId: employee.userId }, select: { projectId: true } }),
    ])
    : [[], []];
  const facts = await factsForEmployee(
    employee,
    roleRows.map((row) => row.role),
    clientRows.map((row) => row.projectId),
  );
  const access = buildAccess(facts);
  return { employee, access };
}

function allowsProject(access, projectId) {
  if (!projectId) return false;
  if (access.projectIds == null) return true;
  return access.projectIds.includes(projectId);
}

function allowsProgram(access, programId) {
  if (!programId) return false;
  if (access.programIds == null) return true;
  return access.programIds.includes(programId);
}

function allowsStaff(access, employeeId) {
  if (!employeeId) return false;
  if (access.staffIds == null) return true;
  return access.staffIds.includes(employeeId);
}

function allowsDirectory(access, employeeId) {
  if (!employeeId) return false;
  if (access.directoryIds == null) return true;
  return access.directoryIds.includes(employeeId);
}

function canManageProject(access, project) {
  if (!project) return false;
  if (access.orgWide) return true;
  if (access.managedProjectIds.includes(project.id)) return true;
  const links = project.departments || [];
  return access.departmentScope && links.some((link) => access.departmentIds.includes(link.departmentId || link));
}

function canApprove(access, employee) {
  if (!employee) return false;
  if (access.orgWide || access.hr) return true;
  if (access.departmentScope && employee.departmentId && access.departmentIds.includes(employee.departmentId)) return true;
  return false;
}

function canRecordFor(access, employee) {
  if (!employee) return false;
  if (access.employeeId && access.employeeId === employee.id) return true;
  return canApprove(access, employee);
}

function canManageProgram(access, program) {
  if (!program) return false;
  if (access.orgWide) return true;
  if (!access.roles.includes('PROGRAM_COORDINATOR')) return false;
  return access.programIds == null || access.programIds.includes(program.id);
}

function canTrainProgram(access, programId) {
  if (access.orgWide) return true;
  if (access.roles.includes('PROGRAM_COORDINATOR') && allowsProgram(access, programId)) return true;
  return access.trainerProgramIds.includes(programId);
}

function applyIdScope(where, field, ids, requested) {
  if (requested && ids && !ids.includes(requested)) return false;
  if (requested) where[field] = requested;
  else if (ids) where[field] = { in: ids };
  return true;
}

function publicAccess(access) {
  return {
    allowed: access.allowed,
    roles: access.roles,
    roleInfo: ROLE_INFO,
    tabs: access.tabs,
    unrestricted: access.unrestricted,
    orgWide: access.orgWide,
    hr: access.hr,
    departmentScope: access.departmentScope,
    canReadConfidentialHr: access.canReadConfidentialHr,
    employee: access.employee,
    clientOnly: access.clientOnly,
    projectCount: access.projectIds ? access.projectIds.length : null,
    programCount: access.programIds ? access.programIds.length : null,
  };
}

function attachAccess(req, res, next) {
  auth()(req, res, async () => {
    try {
      req.access = await loadAccess(req.userId, req.userRole);
      const ownProfile = req.baseUrl.endsWith('/access') && req.path === '/me';
      if (!req.access.allowed && !ownProfile) {
        return res.status(403).json({ error: 'You do not have access to HBMS' });
      }
      return next();
    } catch (error) {
      console.error('Failed to resolve HBMS access', error);
      return res.status(500).json({ error: 'Could not resolve access' });
    }
  });
}

function guardWrites(allow) {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    if (allow(req)) return next();
    return res.status(403).json({ error: 'You do not have permission for this change' });
  };
}

function scopeReport(data, access) {
  if (access.orgWide) return data;
  const next = { ...data };
  if (access.projectIds) next.projects = data.projects.filter((project) => access.projectIds.includes(project.id));
  if (access.staffIds) next.workers = data.workers.filter((worker) => access.staffIds.includes(worker.id));
  if (access.programIds) next.programs = data.programs.filter((program) => access.programIds.includes(program.id));
  if (!access.hr) {
    next.projects = next.projects.map((project) => (
      access.managedProjectIds.includes(project.id) ? project : { ...project, financial: { enabled: false } }
    ));
  }
  const unitIds = new Set([
    ...next.projects.map((project) => project.businessUnit?.id),
    ...next.workers.map((worker) => worker.businessUnit?.id),
    ...next.programs.map((program) => program.businessUnit?.id),
  ]);
  next.units = data.units.filter((unit) => unitIds.has(unit.id)).map((unit) => {
    const projects = next.projects.filter((project) => project.businessUnit?.id === unit.id);
    const active = projects.filter((project) => project.status === 'ACTIVE');
    const overdue = projects.reduce((sum, project) => sum + project.outstanding.overdue, 0);
    const enrolled = next.programs
      .filter((program) => program.businessUnit?.id === unit.id && program.status === 'ACTIVE')
      .reduce((sum, program) => sum + program.enrolled, 0);
    const summary = `${unit.name} has ${active.length} active ${active.length === 1 ? 'project' : 'projects'}, ${overdue} overdue ${overdue === 1 ? 'task' : 'tasks'}, and ${enrolled} enrolled ${enrolled === 1 ? 'participant' : 'participants'} in this scope.`;
    return { ...unit, activeProjects: active.length, overdueTasks: overdue, enrolledParticipants: enrolled, summary };
  });
  next.organization = {
    ...data.organization,
    summary: next.units.map((unit) => unit.summary).join(' ') || 'Nothing in this role’s scope for the selected period.',
    note: 'This report follows your role. Confidential HR records and projects outside your scope are left out.',
  };
  return next;
}

function scopeDashboard(data, access) {
  if (access.orgWide) return data;
  const next = { ...data };
  if (access.projectIds) {
    next.projects = {
      ...data.projects,
      progress: data.projects.progress.filter((project) => access.projectIds.includes(project.id)),
    };
    next.projects.active = next.projects.progress.filter((project) => project.status === 'ACTIVE').length;
    next.deadlines = data.deadlines.filter((item) => !item.projectId || access.projectIds.includes(item.projectId));
  }
  if (access.programIds && data.programs?.items) {
    next.programs = {
      ...data.programs,
      items: data.programs.items.filter((program) => access.programIds.includes(program.id)),
    };
    next.programs.active = next.programs.items.length;
  }
  if (!access.hr) {
    next.workers = { total: access.staffIds ? access.staffIds.length : 0, byType: {} };
    next.attendance = {
      present: 0,
      late: 0,
      absent: 0,
      onLeave: 0,
      hours: 0,
      recorded: 0,
      week: (data.attendance?.week || []).map((day) => ({ ...day, present: 0, absent: 0, leave: 0 })),
    };
    next.approvals = { total: 0, tasks: 0, leave: 0, expenses: 0, items: [] };
    next.activity = [];
    next.summary = 'Showing the work in your role. Organization-wide totals stay with directors and HR.';
  }
  return next;
}

module.exports = {
  ROLE_INFO,
  buildAccess,
  loadAccess,
  loadEmployeePreview,
  allowsProject,
  allowsProgram,
  allowsStaff,
  allowsDirectory,
  canManageProject,
  canApprove,
  canRecordFor,
  canManageProgram,
  canTrainProgram,
  applyIdScope,
  publicAccess,
  attachAccess,
  guardWrites,
  scopeReport,
  scopeDashboard,
};
