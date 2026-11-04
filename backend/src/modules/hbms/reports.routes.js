const express = require('express');
const { prisma, parseDate, resolveMoneyParty, projectProgress, handlePrismaError, writeAudit } = require('./utils');
const { attachAccess, scopeReport, canManageProject } = require('./access');

const router = express.Router();
router.use(attachAccess);

const OPEN_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'];
const LOAD_BAND = {
  FULL_TIME: 8,
  PART_TIME: 4,
  INTERN: 4,
  TRAINER: 3,
  FREELANCE: 3,
};
const ROLE_LABEL = {
  LEAD: 'Project lead',
  CREATIVE: 'Freelance creative',
  INTERN: 'Intern',
  TRAINING: 'Trainer',
  PART_TIME: 'Part-time staff',
  STAFF: 'Full-time staff',
};

function plural(count, one, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function dateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function isoWeekday(value) {
  const day = new Date(value).getUTCDay();
  return day === 0 ? 7 : day;
}

function isWorkday(day, workDays) {
  const allowed = String(workDays || '1,2,3,4,5').split(',').map((item) => Number(item));
  return allowed.includes(isoWeekday(day));
}

function onHoliday(day, unitId, holidays) {
  const key = dateKey(day);
  return holidays.some((holiday) => dateKey(holiday.holidayDate) === key && (!holiday.businessUnitId || holiday.businessUnitId === unitId));
}

function onLeave(day, requests) {
  const key = dateKey(day);
  return requests.some((request) => dateKey(request.startDate) <= key && dateKey(request.endDate) >= key);
}

function periodBounds(query) {
  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const defaultTo = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
  const from = query.from ? parseDate(query.from) : defaultFrom;
  let to = query.to ? parseDate(query.to) : defaultTo;
  if (!from || from.invalid || !to || to.invalid) return { invalid: true };
  if (query.to && to.getUTCHours() === 0 && to.getUTCMinutes() === 0 && to.getUTCSeconds() === 0) {
    to = new Date(to);
    to.setUTCHours(23, 59, 59, 999);
  }
  if (from > to) return { invalid: true };
  const labelTo = query.to
    ? dateKey(parseDate(query.to))
    : dateKey(new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0)));
  return { from, to, labelFrom: dateKey(from), labelTo };
}

function inPeriod(value, from, to) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return time >= from.getTime() && time <= to.getTime();
}

function completionDate(task) {
  return task.reviewedAt || task.updatedAt;
}

function finishedOnTime(task) {
  if (!task.dueDate) return true;
  return new Date(completionDate(task)) <= new Date(task.dueDate);
}

function money(amount) {
  return Math.round(Number(amount) || 0);
}

function percent(part, whole) {
  if (!whole) return null;
  return Math.round((part / whole) * 100);
}

function personName(person) {
  if (!person) return null;
  return `${person.firstName} ${person.lastName}`;
}

function roleLens(worker) {
  const position = worker.position?.title || '';
  const leads = worker.managedProjects.length > 0
    || worker.directReports.length > 0
    || /lead|manager|coordinator/i.test(position);
  if (worker.employmentType === 'TRAINER') return 'TRAINING';
  if (worker.employmentType === 'INTERN') return 'INTERN';
  if (worker.employmentType === 'FREELANCE' || worker.attendancePolicy === 'EVENT') return 'CREATIVE';
  if (worker.employmentType === 'PART_TIME') return 'PART_TIME';
  if (leads) return 'LEAD';
  return 'STAFF';
}

function readingFor(firstName, lens) {
  if (lens === 'LEAD') {
    return `${firstName} is read as a lead. Team delivery, overdue work, and on-time completion matter more than how many tasks were closed.`;
  }
  if (lens === 'CREATIVE') {
    return `${firstName} is read as a freelance creative. Approved event hours and on-time delivery of assigned work are the measures. Daily office attendance is not.`;
  }
  if (lens === 'INTERN') {
    return `${firstName} is read as an intern. Learning progress and a smaller delivery load are the measures. Task count alone is not the rating.`;
  }
  if (lens === 'TRAINING') {
    return `${firstName} is read as a trainer. Session attendance and learner completion are the measures. Delivery tasks are secondary.`;
  }
  if (lens === 'PART_TIME') {
    return `${firstName} is read on a part-time load. On-time delivery and attendance matter, against a smaller workload than a full-time role.`;
  }
  return `${firstName} is read as full-time staff. On-time delivery, overdue work, attendance, and workload are weighed together. The number of tasks closed is not the rating.`;
}

function workloadReading(openCount, employmentType, blocked) {
  const band = LOAD_BAND[employmentType] || 5;
  const blockedText = blocked ? `, including ${plural(blocked, 'blocked task')}` : '';
  if (openCount === 0) return `No open tasks${blockedText}`;
  if (openCount <= band) return `${plural(openCount, 'open task')}${blockedText}, within the usual range for this role`;
  return `${plural(openCount, 'open task')}${blockedText}, above the usual range for this role`;
}

function attendanceFor(worker, rows, holidays, leave, timesheets, from, to) {
  const today = dateKey(dateOnly(new Date()));
  let present = 0;
  let late = 0;
  let absent = 0;
  let leaveDays = 0;
  let missing = 0;
  let hours = 0;
  let eventHours = 0;
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  while (cursor <= end) {
    const key = dateKey(cursor);
    const row = rows.find((item) => dateKey(item.workDate) === key);
    if (onLeave(cursor, leave) && isWorkday(cursor, worker.workDays)) leaveDays += 1;
    else if (row && row.approvalStatus !== 'PENDING' && row.approvalStatus !== 'REJECTED') {
      if (row.status === 'PRESENT') present += 1;
      if (row.status === 'LATE') late += 1;
      if (row.status === 'ABSENT') absent += 1;
      hours += Number(row.hours || 0);
      if (row.source === 'EVENT' && row.approvalStatus === 'APPROVED') eventHours += Number(row.hours || 0);
    }
    else if (
      ['OFFICE', 'REMOTE'].includes(worker.attendancePolicy)
      && key < today
      && isWorkday(cursor, worker.workDays)
      && !onHoliday(cursor, worker.businessUnitId, holidays)
    ) {
      missing += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  const timesheetHours = timesheets
    .filter((item) => item.status === 'APPROVED')
    .reduce((sum, item) => sum + Number(item.hours), 0);
  const round = (value) => Math.round(value * 100) / 100;
  return {
    present,
    late,
    absent,
    leaveDays,
    missing,
    hours: round(hours),
    eventHours: round(eventHours),
    timesheetHours: round(timesheetHours),
    expectsDailyCheckIn: ['OFFICE', 'REMOTE'].includes(worker.attendancePolicy),
  };
}

function attendanceIndicator(worker, attendance) {
  if (worker.attendancePolicy === 'EVENT') {
    return {
      label: 'Event hours',
      value: `${attendance.eventHours} approved hours`,
      detail: 'Office presence is not a measure for this role.',
    };
  }
  if (worker.attendancePolicy === 'FLEXIBLE') {
    return {
      label: 'Schedule',
      value: attendance.hours ? `${attendance.hours} recorded hours` : 'No daily check-in required',
      detail: 'A flexible schedule is not scored like office attendance.',
    };
  }
  const attended = attendance.present + attendance.late;
  const missed = attendance.absent + attendance.missing;
  const measured = attended + missed;
  if (!measured) {
    return { label: 'Attendance', value: 'No office days to measure in this period', detail: 'Approved leave is excluded from this measure.' };
  }
  const lateText = attendance.late ? `, with ${plural(attendance.late, 'late arrival')}` : '';
  return {
    label: 'Attendance',
    value: `${attended} of ${measured} office days attended${lateText}`,
    detail: 'Approved leave is excluded. A late arrival still counts as attended.',
  };
}

function projectReport(project, now) {
  const tasks = project.tasks.filter((task) => task.status !== 'CANCELLED');
  const done = tasks.filter((task) => task.status === 'DONE');
  const onTime = done.filter(finishedOnTime);
  const outstanding = tasks.filter((task) => task.status !== 'DONE');
  const overdue = outstanding.filter((task) => task.dueDate && new Date(task.dueDate) < now);
  const milestones = project.milestones;
  const completedMilestones = milestones.filter((item) => item.status === 'COMPLETED');
  const approved = project.expenses.filter((item) => item.status === 'APPROVED');
  const pending = project.expenses.filter((item) => item.status === 'PENDING');
  const actual = approved.reduce((sum, item) => sum + item.amount, 0);
  const pendingAmount = pending.reduce((sum, item) => sum + item.amount, 0);
  const paid = (project.payments || []).reduce((sum, item) => sum + item.amount, 0);
  const financial = project.budgetAmount == null
    ? { enabled: false }
    : {
      enabled: true,
      budget: project.budgetAmount,
      actual,
      pending: pendingAmount,
      remaining: project.budgetAmount - actual,
      paid,
      profit: paid - actual,
      repayment: project.budgetAmount - paid,
      currency: project.budgetCurrency || 'RWF',
    };
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    status: project.status,
    category: project.category,
    businessUnit: project.businessUnit,
    manager: personName(project.manager),
    progress: projectProgress(project.tasks),
    milestones: {
      completed: completedMilestones.length,
      total: milestones.length,
      titles: completedMilestones.map((item) => item.title),
    },
    outstanding: {
      count: outstanding.length,
      overdue: overdue.length,
      titles: overdue.slice(0, 6).map((task) => task.title),
    },
    deadline: {
      completed: done.length,
      onTime: onTime.length,
      rate: percent(onTime.length, done.length),
      milestonesOverdue: milestones.filter((item) => item.status !== 'COMPLETED' && item.dueDate && new Date(item.dueDate) < now).length,
    },
    financial,
  };
}

function programReport(program) {
  const enrolled = program.enrollments.filter((item) => item.status !== 'WITHDRAWN');
  const completedEnrollments = program.enrollments.filter((item) => item.status === 'COMPLETED');
  const marks = program.sessions.flatMap((session) => session.attendance);
  const attended = marks.filter((mark) => mark.status === 'PRESENT' || mark.status === 'LATE').length;
  const enrolledIds = new Set(enrolled.map((item) => item.participantId));
  const submissions = program.assignments.flatMap((assignment) => assignment.submissions)
    .filter((submission) => enrolledIds.has(submission.participantId));
  const assignmentDone = submissions.filter((submission) => submission.status === 'SUBMITTED' || submission.status === 'GRADED').length;
  const assignmentExpected = enrolled.length * program.assignments.length;
  const scores = submissions.filter((submission) => submission.status === 'GRADED' && submission.score != null).map((submission) => submission.score);
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;
  return {
    id: program.id,
    name: program.name,
    kind: program.kind,
    status: program.status,
    businessUnit: program.businessUnit,
    coordinator: personName(program.coordinator),
    enrolled: enrolled.length,
    capacity: program.capacity,
    attendanceRate: percent(attended, marks.length),
    attendanceMarked: marks.length,
    assignmentCompletion: percent(assignmentDone, assignmentExpected),
    assignmentDone,
    assignmentExpected,
    completionRate: percent(completedEnrollments.length, enrolled.length),
    completedEnrollments: completedEnrollments.length,
    outcomes: program.outcomes || '',
    averageScore,
    progress: programProgressLike(program, enrolled),
  };
}

function programProgressLike(program, enrolled) {
  if (enrolled.length && program.assignments.length) {
    const expected = enrolled.length * program.assignments.length;
    const graded = program.assignments.reduce((sum, assignment) => sum + assignment.submissions.filter((submission) => (
      submission.status === 'GRADED' && enrolled.some((item) => item.participantId === submission.participantId)
    )).length, 0);
    return percent(graded, expected);
  }
  if (program.sessions.length) {
    const held = program.sessions.filter((session) => new Date(session.startsAt) <= new Date()).length;
    return percent(held, program.sessions.length);
  }
  return program.status === 'COMPLETED' ? 100 : 0;
}

function trainingIndicator(programs) {
  if (!programs.length) return null;
  const enrolled = programs.reduce((sum, program) => sum + program.enrolled, 0);
  const withAttendance = programs.filter((program) => program.attendanceRate != null);
  const attendance = withAttendance.length
    ? Math.round(withAttendance.reduce((sum, program) => sum + program.attendanceRate, 0) / withAttendance.length)
    : null;
  const withAssignments = programs.filter((program) => program.assignmentCompletion != null);
  const assignments = withAssignments.length
    ? Math.round(withAssignments.reduce((sum, program) => sum + program.assignmentCompletion, 0) / withAssignments.length)
    : null;
  const parts = [`${plural(enrolled, 'enrolled participant')} across ${plural(programs.length, 'program')}`];
  if (attendance != null) parts.push(`${attendance}% session attendance`);
  if (assignments != null) parts.push(`${assignments}% of assignments completed`);
  return {
    label: 'Training results',
    value: parts.join(' · '),
    detail: 'This follows the programs this worker coordinates or trains.',
  };
}

function learningIndicator(participantId, programs) {
  const joined = programs.filter((program) => program.enrollments.some((item) => item.participantId === participantId && item.status !== 'WITHDRAWN'));
  if (!joined.length) return null;
  let expected = 0;
  let done = 0;
  let marks = 0;
  let attended = 0;
  joined.forEach((program) => {
    program.sessions.forEach((session) => {
      session.attendance.filter((mark) => mark.participantId === participantId).forEach((mark) => {
        marks += 1;
        if (mark.status === 'PRESENT' || mark.status === 'LATE') attended += 1;
      });
    });
    program.assignments.forEach((assignment) => {
      expected += 1;
      const submission = assignment.submissions.find((item) => item.participantId === participantId);
      if (submission && (submission.status === 'SUBMITTED' || submission.status === 'GRADED')) done += 1;
    });
  });
  const parts = [plural(joined.length, 'program')];
  if (marks) parts.push(`${percent(attended, marks)}% of marked sessions attended`);
  if (expected) parts.push(`${done} of ${expected} assignments completed`);
  return {
    label: 'Learning progress',
    value: parts.join(' · '),
    detail: 'Internship and training progress is separate from staff task delivery.',
  };
}

function workerReport(worker, tasks, attendance, projectsById, programReports, programs, from, to, now) {
  const assigned = tasks.filter((task) => task.status !== 'CANCELLED');
  const open = assigned.filter((task) => OPEN_STATUSES.includes(task.status));
  const completed = assigned.filter((task) => task.status === 'DONE' && inPeriod(completionDate(task), from, to));
  const onTime = completed.filter(finishedOnTime);
  const overdue = open.filter((task) => task.dueDate && new Date(task.dueDate) < now);
  const blocked = open.filter((task) => task.status === 'BLOCKED').length;
  const projectIds = new Set([
    ...worker.managedProjects.map((project) => project.id),
    ...worker.memberships.map((member) => member.project.id),
  ]);
  const projects = [...projectIds].map((id) => {
    const project = projectsById.get(id);
    if (!project) return null;
    const membership = worker.memberships.find((member) => member.project.id === id);
    const role = worker.managedProjects.some((item) => item.id === id) ? 'MANAGER' : membership?.role || 'MEMBER';
    return { id: project.id, code: project.code, name: project.name, status: project.status, role, progress: project.progress, overdue: project.outstanding.overdue };
  }).filter(Boolean);
  const lens = roleLens(worker);
  const relatedProgramIds = new Set([
    ...worker.coordinatedPrograms.map((program) => program.id),
    ...worker.trainingRoles.map((role) => role.programId),
  ]);
  const relatedPrograms = programReports.filter((program) => relatedProgramIds.has(program.id));
  const indicators = [
    {
      label: 'On-time delivery',
      value: completed.length
        ? `${onTime.length} of ${completed.length} completed tasks met the deadline`
        : 'No tasks were completed in this period',
      detail: 'This is a rate. The raw number of closed tasks is not the rating.',
    },
    {
      label: 'Overdue work',
      value: overdue.length ? plural(overdue.length, 'task is past its deadline', 'tasks are past their deadline') : 'No overdue tasks',
      detail: overdue.slice(0, 4).map((task) => task.title).join(' · '),
    },
    {
      label: 'Workload',
      value: workloadReading(open.length, worker.employmentType, blocked),
      detail: `The usual open range for this role is ${LOAD_BAND[worker.employmentType] || 5} tasks.`,
    },
    attendanceIndicator(worker, attendance),
  ];
  if (lens === 'LEAD') {
    const active = projects.filter((project) => project.status === 'ACTIVE' || project.status === 'ON_HOLD');
    indicators.unshift({
      label: 'Team delivery',
      value: active.length
        ? active.map((project) => `${project.code} is ${project.progress}% complete${project.overdue ? `, ${plural(project.overdue, 'overdue task')}` : ''}`).join(' · ')
        : 'No active projects to lead',
      detail: 'A lead is read on the project, not on a personal task count.',
    });
  }
  const training = trainingIndicator(relatedPrograms);
  if (training && (lens === 'TRAINING' || lens === 'LEAD' || relatedPrograms.length)) indicators.push(training);
  const learning = worker.learnerProfile ? learningIndicator(worker.learnerProfile.id, programs) : null;
  if (learning && (lens === 'INTERN' || lens === 'CREATIVE')) indicators.push(learning);
  return {
    id: worker.id,
    name: personName(worker),
    staffCode: worker.staffCode,
    employmentType: worker.employmentType,
    position: worker.position?.title || '',
    department: worker.department?.name || '',
    businessUnit: worker.businessUnit,
    status: worker.status,
    attendancePolicy: worker.attendancePolicy,
    lens,
    roleLabel: ROLE_LABEL[lens],
    reading: readingFor(worker.firstName, lens),
    tasksCompleted: completed.length,
    tasksOnTime: onTime.length,
    tasksOverdue: overdue.length,
    overdueTitles: overdue.slice(0, 6).map((task) => task.title),
    workload: { open: open.length, inReview: open.filter((task) => task.status === 'IN_REVIEW').length, blocked },
    attendance,
    projects,
    indicators,
  };
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function unitReport(unit, workers, projects, programs, attendanceRows) {
  const unitProjects = projects.filter((project) => project.businessUnit.id === unit.id);
  const active = unitProjects.filter((project) => project.status === 'ACTIVE');
  const unitPrograms = programs.filter((program) => program.businessUnit.id === unit.id && program.status === 'ACTIVE');
  const workerIds = new Set(workers.filter((worker) => worker.businessUnit.id === unit.id).map((worker) => worker.id));
  const hours = attendanceRows
    .filter((row) => workerIds.has(row.employeeId) && row.approvalStatus !== 'PENDING' && row.approvalStatus !== 'REJECTED')
    .reduce((sum, row) => sum + Number(row.hours || 0), 0);
  const overdueTasks = unitProjects.reduce((sum, project) => sum + project.outstanding.overdue, 0);
  const openTasks = unitProjects.reduce((sum, project) => sum + project.outstanding.count, 0);
  const enrolledParticipants = unitPrograms.reduce((sum, program) => sum + program.enrolled, 0);
  const summary = `${unit.name} has ${plural(active.length, 'active project')}, ${plural(overdueTasks, 'overdue task')}, and ${plural(enrolledParticipants, 'enrolled participant')}.`;
  return {
    id: unit.id,
    code: unit.code,
    name: unit.name,
    workers: workerIds.size,
    activeProjects: active.length,
    averageProgress: average(active.map((project) => project.progress)),
    openTasks,
    overdueTasks,
    enrolledParticipants,
    activePrograms: unitPrograms.length,
    attendanceHours: Math.round(hours * 100) / 100,
    summary,
  };
}

router.get('/', async (req, res) => {
  try {
    if (!req.access.tabs.includes('reports')) return res.status(403).json({ error: 'You do not have permission to view reports' });
    const period = periodBounds(req.query);
    if (period.invalid) return res.status(400).json({ error: 'Choose a valid report period' });
    const { from, to } = period;
    const now = new Date();
    const [workers, projects, programs, attendanceRows, holidays, leave, timesheets, units] = await Promise.all([
      prisma.employee.findMany({
        where: { status: { not: 'INACTIVE' } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          staffCode: true,
          employmentType: true,
          status: true,
          attendancePolicy: true,
          workDays: true,
          businessUnitId: true,
          businessUnit: { select: { id: true, code: true, name: true } },
          position: { select: { title: true } },
          department: { select: { name: true } },
          managedProjects: { select: { id: true } },
          memberships: { select: { role: true, project: { select: { id: true } } } },
          coordinatedPrograms: { select: { id: true } },
          trainingRoles: { select: { programId: true } },
          directReports: { select: { id: true } },
          learnerProfile: { select: { id: true } },
          assignments: {
            select: {
              task: {
                select: { id: true, title: true, status: true, dueDate: true, reviewedAt: true, updatedAt: true },
              },
            },
          },
        },
        orderBy: { staffCode: 'asc' },
      }),
      prisma.hbmsProject.findMany({
        include: {
          businessUnit: { select: { id: true, code: true, name: true } },
          manager: { select: { firstName: true, lastName: true } },
          tasks: { select: { status: true, title: true, dueDate: true, reviewedAt: true, updatedAt: true } },
          milestones: { select: { title: true, status: true, dueDate: true } },
          expenses: { select: { amount: true, status: true } },
          payments: { select: { amount: true } },
        },
        orderBy: { code: 'asc' },
      }),
      prisma.hbmsProgram.findMany({
        include: {
          businessUnit: { select: { id: true, code: true, name: true } },
          coordinator: { select: { firstName: true, lastName: true } },
          enrollments: { select: { status: true, participantId: true } },
          sessions: { select: { startsAt: true, attendance: { select: { status: true, participantId: true } } } },
          assignments: { select: { submissions: { select: { status: true, score: true, participantId: true } } } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.hbmsAttendance.findMany({
        where: { workDate: { gte: from, lte: to } },
        select: { employeeId: true, workDate: true, status: true, hours: true, source: true, approvalStatus: true },
      }),
      prisma.hbmsHoliday.findMany({ where: { holidayDate: { gte: from, lte: to } } }),
      prisma.hbmsLeaveRequest.findMany({
        where: { status: 'APPROVED', startDate: { lte: to }, endDate: { gte: from } },
      }),
      prisma.hbmsTimesheet.findMany({
        where: { workDate: { gte: from, lte: to } },
        select: { employeeId: true, hours: true, status: true },
      }),
      prisma.businessUnit.findMany({ orderBy: { code: 'asc' } }),
    ]);

    const projectReports = projects.map((project) => projectReport(project, now));
    const projectsById = new Map(projectReports.map((project) => [project.id, project]));
    const programReports = programs.map(programReport);
    const workerReports = workers.map((worker) => workerReport(
      worker,
      worker.assignments.map((item) => item.task),
      attendanceFor(
        worker,
        attendanceRows.filter((row) => row.employeeId === worker.id),
        holidays,
        leave.filter((request) => request.employeeId === worker.id),
        timesheets.filter((sheet) => sheet.employeeId === worker.id),
        from,
        to,
      ),
      projectsById,
      programReports,
      programs,
      from,
      to,
      now,
    ));
    const unitReports = units.map((unit) => unitReport(unit, workerReports, projectReports, programReports, attendanceRows));
    const activeProjects = projectReports.filter((project) => project.status === 'ACTIVE');
    const organization = {
      activeProjects: activeProjects.length,
      averageProgress: average(activeProjects.map((project) => project.progress)),
      overdueTasks: projectReports.reduce((sum, project) => sum + project.outstanding.overdue, 0),
      openTasks: projectReports.reduce((sum, project) => sum + project.outstanding.count, 0),
      enrolledParticipants: programReports.filter((program) => program.status === 'ACTIVE').reduce((sum, program) => sum + program.enrolled, 0),
      summary: `${unitReports.map((unit) => unit.summary).join(' ')} Together, active projects are ${average(activeProjects.map((project) => project.progress))}% complete and ${plural(projectReports.reduce((sum, project) => sum + project.outstanding.overdue, 0), 'task is overdue', 'tasks are overdue')}.`,
      note: 'Organizational performance mixes delivery, deadlines, attendance, and training outcomes. It is not a total of tasks closed.',
    };
    res.json({
      data: scopeReport({
        period: { from: period.labelFrom, to: period.labelTo },
        workers: workerReports,
        projects: projectReports,
        programs: programReports,
        units: unitReports,
        organization,
      }, req.access),
    });
  } catch (error) {
    handlePrismaError(res, error, 'Could not build the reports');
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const project = await prisma.hbmsProject.findUnique({
      where: { id: req.body.projectId },
      include: {
        departments: { select: { departmentId: true } },
        members: { select: { employeeId: true } },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!canManageProject(req.access, project)) return res.status(403).json({ error: 'You do not have permission to record an expense on this project' });
    if (project.budgetAmount == null) return res.status(400).json({ error: 'Financial tracking is not enabled for this project' });
    const amount = Number(req.body.amount);
    const description = String(req.body.description || '').trim();
    if (!Number.isInteger(amount) || amount <= 0) return res.status(400).json({ error: 'Enter the expense as a whole number' });
    if (!description) return res.status(400).json({ error: 'Describe the expense' });
    const spentOn = parseDate(req.body.spentOn);
    if (spentOn?.invalid) return res.status(400).json({ error: 'Invalid expense date' });
    const spentBy = resolveMoneyParty(project, req.body.spentByKind, req.body.spentById, 'used this expense');
    if (spentBy.error) return res.status(400).json({ error: spentBy.error });
    const expense = await prisma.hbmsExpense.create({
      data: {
        projectId: project.id,
        amount,
        currency: project.budgetCurrency || 'RWF',
        description,
        status: 'APPROVED',
        spentOn: spentOn ?? null,
        spentByKind: spentBy.kind,
        spentById: spentBy.employeeId,
      },
    });
    await writeAudit(req.userId, 'expense.create', 'HbmsExpense', expense.id, { projectId: project.id, amount });
    res.status(201).json({ data: expense });
  } catch (error) {
    handlePrismaError(res, error, 'Could not record the expense');
  }
});

module.exports = router;
