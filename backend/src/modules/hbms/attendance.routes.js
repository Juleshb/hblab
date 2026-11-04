const express = require('express');
const { prisma, parseDate, handlePrismaError, writeAudit } = require('./utils');
const { attachAccess, guardWrites, canRecordFor, canApprove, allowsStaff } = require('./access');

const router = express.Router();
router.use(attachAccess);
router.use(guardWrites((req) => {
  if (req.path.startsWith('/holidays')) return req.access.orgWide || req.access.hr;
  if (req.access.orgWide || req.access.hr || req.access.departmentScope) return true;
  return ['/check-in', '/check-out', '/event-hours', '/timesheets', '/absence'].includes(req.path) && Boolean(req.access.employeeId);
}));

const POLICIES = ['OFFICE', 'REMOTE', 'EVENT', 'FLEXIBLE'];
const GRACE_MINUTES = 15;

const workerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  staffCode: true,
  status: true,
  attendancePolicy: true,
  workDays: true,
  shiftStart: true,
  shiftEnd: true,
  businessUnitId: true,
  departmentId: true,
  businessUnit: { select: { id: true, name: true } },
  reportsTo: { select: { id: true, firstName: true, lastName: true } },
};

function dateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function isoWeekday(value) {
  const day = new Date(value).getUTCDay();
  return day === 0 ? 7 : day;
}

function parseHours(value) {
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) return { invalid: true };
  return Math.round(hours * 100) / 100;
}

function scheduledMinutes(shift) {
  const match = /^(\d{2}):(\d{2})$/.exec(shift || '');
  if (!match) return 8 * 60;
  return Number(match[1]) * 60 + Number(match[2]);
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
  return requests.some((request) => request.status === 'APPROVED' && dateKey(request.startDate) <= key && dateKey(request.endDate) >= key);
}

async function dayContext(employeeId, day) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: workerSelect });
  if (!employee) return null;
  const [holidays, leave] = await Promise.all([
    prisma.hbmsHoliday.findMany({ where: { holidayDate: day } }),
    prisma.hbmsLeaveRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: day },
        endDate: { gte: day },
      },
    }),
  ]);
  return { employee, holiday: onHoliday(day, employee.businessUnitId, holidays), leave: leave.length > 0 };
}

const attendanceInclude = {
  employee: { select: { id: true, firstName: true, lastName: true, staffCode: true, attendancePolicy: true } },
  project: { select: { id: true, name: true, code: true } },
};

router.get('/report', async (req, res) => {
  try {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    if (!from || from.invalid || !to || to.invalid) return res.status(400).json({ error: 'A start and end date are required' });
    const where = {};
    if (req.access.staffIds) where.id = { in: req.access.staffIds };
    if (req.query.businessUnitId) where.businessUnitId = req.query.businessUnitId;
    if (req.query.employeeId) {
      if (!allowsStaff(req.access, req.query.employeeId)) return res.json({ data: [], meta: { from, to, holidays: [] } });
      where.id = req.query.employeeId;
    }
    const [workers, rows, holidays, leave, timesheets] = await Promise.all([
      prisma.employee.findMany({ where, select: workerSelect, orderBy: { staffCode: 'asc' } }),
      prisma.hbmsAttendance.findMany({
        where: {
          workDate: { gte: from, lte: to },
          ...(req.query.employeeId ? { employeeId: req.query.employeeId } : {}),
        },
        include: attendanceInclude,
      }),
      prisma.hbmsHoliday.findMany({ where: { holidayDate: { gte: from, lte: to } } }),
      prisma.hbmsLeaveRequest.findMany({
        where: {
          status: 'APPROVED',
          startDate: { lte: to },
          endDate: { gte: from },
          ...(req.query.employeeId ? { employeeId: req.query.employeeId } : {}),
        },
      }),
      prisma.hbmsTimesheet.findMany({
        where: {
          workDate: { gte: from, lte: to },
          ...(req.query.employeeId ? { employeeId: req.query.employeeId } : {}),
        },
        select: { employeeId: true, hours: true, status: true },
      }),
    ]);
    const today = dateKey(dateOnly(new Date()));
    const data = workers.map((worker) => {
      const ownRows = rows.filter((row) => row.employeeId === worker.id);
      const ownLeave = leave.filter((request) => request.employeeId === worker.id);
      let present = 0;
      let late = 0;
      let absent = 0;
      let leaveDays = 0;
      let missing = 0;
      let hours = 0;
      let pendingHours = 0;
      const cursor = new Date(from);
      while (cursor <= to) {
        const key = dateKey(cursor);
        const row = ownRows.find((item) => dateKey(item.workDate) === key);
        if (onLeave(cursor, ownLeave) && isWorkday(cursor, worker.workDays)) leaveDays += 1;
        else if (row) {
          if (row.approvalStatus === 'PENDING') pendingHours += Number(row.hours || 0);
          else if (row.approvalStatus !== 'REJECTED') {
            if (row.status === 'PRESENT') present += 1;
            if (row.status === 'LATE') late += 1;
            if (row.status === 'ABSENT') absent += 1;
            hours += Number(row.hours || 0);
          }
        } else if (
          ['OFFICE', 'REMOTE'].includes(worker.attendancePolicy)
          && key < today
          && isWorkday(cursor, worker.workDays)
          && !onHoliday(cursor, worker.businessUnitId, holidays)
        ) {
          missing += 1;
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      const sheetHours = timesheets
        .filter((item) => item.employeeId === worker.id && item.status === 'APPROVED')
        .reduce((sum, item) => sum + Number(item.hours), 0);
      return {
        ...worker,
        present,
        late,
        absent,
        leaveDays,
        missing,
        hours: Math.round(hours * 100) / 100,
        pendingHours: Math.round(pendingHours * 100) / 100,
        timesheetHours: Math.round(sheetHours * 100) / 100,
      };
    });
    res.json({ data, meta: { from, to, holidays } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to build the attendance report');
  }
});

router.get('/holidays', async (req, res) => {
  try {
    const holidays = await prisma.hbmsHoliday.findMany({
      include: { businessUnit: { select: { id: true, name: true } } },
      orderBy: { holidayDate: 'asc' },
    });
    res.json({ data: holidays });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load holidays');
  }
});

router.post('/holidays', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const holidayDate = parseDate(req.body.holidayDate);
    if (!name) return res.status(400).json({ error: 'Holiday name is required' });
    if (!holidayDate || holidayDate.invalid) return res.status(400).json({ error: 'Holiday date is required' });
    const holiday = await prisma.hbmsHoliday.create({
      data: {
        name,
        holidayDate,
        businessUnitId: req.body.businessUnitId || null,
      },
      include: { businessUnit: { select: { id: true, name: true } } },
    });
    res.status(201).json({ data: holiday });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to add holiday');
  }
});

router.delete('/holidays/:id', async (req, res) => {
  try {
    await prisma.hbmsHoliday.delete({ where: { id: req.params.id } });
    res.json({ data: { removed: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to remove holiday');
  }
});

router.get('/timesheets', async (req, res) => {
  try {
    const where = {};
    if (req.query.employeeId) where.employeeId = req.query.employeeId;
    if (req.query.status) where.status = req.query.status;
    const sheets = await prisma.hbmsTimesheet.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, staffCode: true } },
        project: { select: { id: true, name: true, code: true } },
      },
      orderBy: { workDate: 'desc' },
      take: 100,
    });
    res.json({ data: sheets });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load timesheets');
  }
});

router.post('/timesheets', async (req, res) => {
  try {
    const workDate = parseDate(req.body.workDate);
    const hours = parseHours(req.body.hours);
    if (!req.body.employeeId) return res.status(400).json({ error: 'Worker is required' });
    if (!workDate || workDate.invalid) return res.status(400).json({ error: 'Work date is required' });
    if (hours.invalid) return res.status(400).json({ error: 'Hours must be between 0 and 24' });
    const sheet = await prisma.hbmsTimesheet.create({
      data: {
        employeeId: req.body.employeeId,
        projectId: req.body.projectId || null,
        workDate,
        hours,
        note: req.body.note ? String(req.body.note).trim() : null,
      },
      include: { project: { select: { id: true, name: true, code: true } } },
    });
    res.status(201).json({ data: sheet });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to add timesheet');
  }
});

router.post('/timesheets/:id/decision', async (req, res) => {
  try {
    if (!['APPROVED', 'REJECTED'].includes(req.body.decision)) {
      return res.status(400).json({ error: 'Decision must be approved or rejected' });
    }
    const current = await prisma.hbmsTimesheet.findUnique({
      where: { id: req.params.id },
      include: { employee: { select: { id: true, departmentId: true } } },
    });
    if (!current) return res.status(404).json({ error: 'Timesheet not found' });
    if (!canApprove(req.access, current.employee)) return res.status(403).json({ error: 'You do not have permission to decide this timesheet' });
    const sheet = await prisma.hbmsTimesheet.update({
      where: { id: req.params.id },
      data: { status: req.body.decision },
    });
    await writeAudit(req.userId, 'timesheet.decision', 'HbmsTimesheet', sheet.id, { decision: req.body.decision });
    res.json({ data: sheet });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to review timesheet');
  }
});

router.get('/', async (req, res) => {
  try {
    const where = {};
    if (req.access.staffIds) {
      if (req.query.employeeId && !allowsStaff(req.access, req.query.employeeId)) return res.json({ data: [] });
      where.employeeId = req.query.employeeId || { in: req.access.staffIds };
    } else if (req.query.employeeId) where.employeeId = req.query.employeeId;
    if (req.query.from || req.query.to) {
      where.workDate = {};
      const from = parseDate(req.query.from);
      const to = parseDate(req.query.to);
      if (from?.invalid || to?.invalid) return res.status(400).json({ error: 'Invalid date' });
      if (from) where.workDate.gte = from;
      if (to) where.workDate.lte = to;
    }
    const rows = await prisma.hbmsAttendance.findMany({
      where,
      include: attendanceInclude,
      orderBy: { workDate: 'desc' },
      take: 200,
    });
    res.json({ data: rows });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to load attendance');
  }
});

router.post('/check-in', async (req, res) => {
  try {
    const day = dateOnly(new Date());
    const context = await dayContext(req.body.employeeId, day);
    if (!context) return res.status(404).json({ error: 'Worker not found' });
    const { employee } = context;
    if (!canRecordFor(req.access, employee)) return res.status(403).json({ error: 'You do not have permission to record attendance for this worker' });
    if (!POLICIES.includes(employee.attendancePolicy)) return res.status(400).json({ error: 'Invalid attendance policy' });
    if (employee.attendancePolicy === 'EVENT') {
      return res.status(400).json({ error: 'This worker records approved event hours instead of checking in at the office.' });
    }
    if (context.leave || employee.status === 'ON_LEAVE') {
      return res.status(400).json({ error: 'This worker is on approved leave.' });
    }
    if (context.holiday) return res.status(400).json({ error: 'Today is a public holiday for this worker.' });
    const existing = await prisma.hbmsAttendance.findUnique({
      where: { employeeId_workDate: { employeeId: employee.id, workDate: day } },
    });
    if (existing?.checkedInAt && !existing.checkedOutAt) return res.status(400).json({ error: 'Already checked in' });
    if (existing?.checkedOutAt) return res.status(400).json({ error: 'Already checked out today' });
    if (existing) return res.status(400).json({ error: 'Attendance is already recorded for today' });

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const late = ['OFFICE', 'REMOTE'].includes(employee.attendancePolicy)
      && isWorkday(day, employee.workDays)
      && minutes > scheduledMinutes(employee.shiftStart) + GRACE_MINUTES;
    const row = await prisma.hbmsAttendance.create({
      data: {
        employeeId: employee.id,
        workDate: day,
        status: late ? 'LATE' : 'PRESENT',
        source: 'CHECKIN',
        checkedInAt: now,
        note: employee.attendancePolicy === 'REMOTE' ? 'Remote check-in' : null,
      },
      include: attendanceInclude,
    });
    res.status(201).json({ data: row });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to check in');
  }
});

router.post('/check-out', async (req, res) => {
  try {
    const day = dateOnly(new Date());
    const existing = await prisma.hbmsAttendance.findUnique({
      where: { employeeId_workDate: { employeeId: req.body.employeeId, workDate: day } },
    });
    const subject = await prisma.employee.findUnique({ where: { id: req.body.employeeId }, select: { id: true, departmentId: true } });
    if (!canRecordFor(req.access, subject)) return res.status(403).json({ error: 'You do not have permission to record attendance for this worker' });
    if (!existing?.checkedInAt) return res.status(400).json({ error: 'Check in before checking out' });
    if (existing.checkedOutAt) return res.status(400).json({ error: 'Already checked out today' });
    const checkedOutAt = new Date();
    const hours = Math.round(((checkedOutAt - existing.checkedInAt) / 36e5) * 100) / 100;
    const row = await prisma.hbmsAttendance.update({
      where: { id: existing.id },
      data: { checkedOutAt, hours },
      include: attendanceInclude,
    });
    res.json({ data: row });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to check out');
  }
});

router.post('/event-hours', async (req, res) => {
  try {
    const workDate = parseDate(req.body.workDate);
    const hours = parseHours(req.body.hours);
    const note = String(req.body.note || '').trim();
    if (!req.body.employeeId) return res.status(400).json({ error: 'Worker is required' });
    if (!workDate || workDate.invalid) return res.status(400).json({ error: 'Work date is required' });
    if (hours.invalid) return res.status(400).json({ error: 'Hours must be between 0 and 24' });
    if (!note) return res.status(400).json({ error: 'Describe the event work' });
    const employee = await prisma.employee.findUnique({
      where: { id: req.body.employeeId },
      select: { id: true, attendancePolicy: true, departmentId: true },
    });
    if (!employee) return res.status(404).json({ error: 'Worker not found' });
    if (!canRecordFor(req.access, employee)) return res.status(403).json({ error: 'You do not have permission to record attendance for this worker' });
    if (employee.attendancePolicy !== 'EVENT') {
      return res.status(400).json({ error: 'Event hours are only for a worker whose attendance policy is event work.' });
    }
    const context = await dayContext(employee.id, workDate);
    if (context.leave) return res.status(400).json({ error: 'That date is already covered by approved leave' });
    if (context.holiday) return res.status(400).json({ error: 'That date is a public holiday' });
    const existing = await prisma.hbmsAttendance.findUnique({
      where: { employeeId_workDate: { employeeId: employee.id, workDate } },
    });
    if (existing) return res.status(400).json({ error: 'Attendance is already recorded for that date' });
    const row = await prisma.hbmsAttendance.create({
      data: {
        employeeId: employee.id,
        workDate,
        status: 'PRESENT',
        hours,
        note,
        source: 'EVENT',
        approvalStatus: 'PENDING',
        projectId: req.body.projectId || null,
      },
      include: attendanceInclude,
    });
    res.status(201).json({ data: row });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to record event hours');
  }
});

router.post('/absence', async (req, res) => {
  try {
    const workDate = parseDate(req.body.workDate);
    if (!req.body.employeeId) return res.status(400).json({ error: 'Worker is required' });
    if (!workDate || workDate.invalid) return res.status(400).json({ error: 'Absence date is required' });
    const context = await dayContext(req.body.employeeId, workDate);
    if (!context) return res.status(404).json({ error: 'Worker not found' });
    if (!canRecordFor(req.access, context.employee)) return res.status(403).json({ error: 'You do not have permission to record attendance for this worker' });
    if (context.holiday) return res.status(400).json({ error: 'That date is a public holiday' });
    if (context.leave) return res.status(400).json({ error: 'That date is already covered by approved leave' });
    const row = await prisma.hbmsAttendance.create({
      data: {
        employeeId: req.body.employeeId,
        workDate,
        status: 'ABSENT',
        source: 'ABSENCE',
        note: req.body.note ? String(req.body.note).trim() : null,
      },
      include: attendanceInclude,
    });
    res.status(201).json({ data: row });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to record absence');
  }
});

router.post('/:id/decision', async (req, res) => {
  try {
    if (!['APPROVED', 'REJECTED'].includes(req.body.decision)) {
      return res.status(400).json({ error: 'Decision must be approved or rejected' });
    }
    const existing = await prisma.hbmsAttendance.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Attendance record not found' });
    const subject = await prisma.employee.findUnique({ where: { id: existing.employeeId }, select: { id: true, departmentId: true } });
    if (!canApprove(req.access, subject)) return res.status(403).json({ error: 'You do not have permission to decide these hours' });
    if (existing.source !== 'EVENT' || existing.approvalStatus !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending event hours can be approved' });
    }
    const row = await prisma.hbmsAttendance.update({
      where: { id: existing.id },
      data: { approvalStatus: req.body.decision },
      include: attendanceInclude,
    });
    await writeAudit(req.userId, 'attendance.event', 'HbmsAttendance', row.id, { decision: req.body.decision });
    res.json({ data: row });
  } catch (error) {
    handlePrismaError(res, error, 'Failed to review event hours');
  }
});

module.exports = router;
