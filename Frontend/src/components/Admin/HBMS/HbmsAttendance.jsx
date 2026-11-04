import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import hbmsApi, { apiError, attendancePolicyOptions, formatDate, optionLabel, toDateInput } from './api';
import { Field, FormModal, Notice, PrimaryButton, Segmented, StatusBadge, inputClass } from './ui';

const statTones = {
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-100 bg-amber-50 text-amber-700',
  rose: 'border-rose-100 bg-rose-50 text-rose-700',
  sky: 'border-sky-100 bg-sky-50 text-sky-700',
};

function StatTile({ tone, icon, value, label, detail }) {
  return (
    <article className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${statTones[tone]}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80">
        <Icon icon={icon} className="h-6 w-6" />
      </span>
      <span>
        <span className="block text-2xl font-semibold leading-none text-gray-900">{value}</span>
        <span className="mt-1 block text-sm font-medium text-gray-800">{label}</span>
        <span className="block text-xs text-gray-500">{detail}</span>
      </span>
    </article>
  );
}

function SplitRing({ parts, total, caption }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const sum = parts.reduce((count, part) => count + part.value, 0);
  let cursor = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#eef2f0" strokeWidth="14" />
      {sum > 0 && parts.map((part) => {
        const length = (part.value / sum) * circumference;
        const node = (
          <circle
            key={part.label}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={part.color}
            strokeWidth="14"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-cursor}
            transform="rotate(-90 60 60)"
          />
        );
        cursor += length;
        return node;
      })}
      <text x="60" y="58" textAnchor="middle" fill="#111827" fontSize="20" fontWeight="700">{total}</text>
      <text x="60" y="74" textAnchor="middle" fill="#6b7280" fontSize="9">{caption}</text>
    </svg>
  );
}

function monthGrid(fromKey) {
  const [year, month] = fromKey.split('-').map(Number);
  const first = new Date(year, month - 1, 1);
  const count = new Date(year, month, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= count; day += 1) {
    cells.push({
      day,
      key: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    });
  }
  return cells;
}

function dayTone(status) {
  if (status === 'PRESENT') return 'bg-emerald-100 text-emerald-900';
  if (status === 'LATE') return 'bg-amber-100 text-amber-900';
  if (status === 'ABSENT') return 'bg-rose-100 text-rose-800';
  return 'bg-gray-50 text-gray-500';
}

const weekdays = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [7, 'Sun']];
const policyHelp = {
  OFFICE: 'Check in and out on scheduled office days. Arriving after the shift, plus 15 minutes, is marked late.',
  REMOTE: 'Check in and out from anywhere. The office location is not required.',
  EVENT: 'Record the hours worked at an event. A supervisor approves them. An office check-in is not required.',
  FLEXIBLE: 'No daily check-in is required. Add a timesheet only when project work should be tracked.',
};

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const key = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  };
  return { from: key(from), to: key(to) };
}

function personName(person) {
  return person ? `${person.firstName} ${person.lastName}` : 'Unassigned';
}

function hoursLabel(value) {
  if (value == null || value === '') return '—';
  return `${Number(value)} h`;
}

const HbmsAttendance = () => {
  const range = monthRange();
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [workerId, setWorkerId] = useState('');
  const [rows, setRows] = useState([]);
  const [leave, setLeave] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [report, setReport] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [eventHours, setEventHours] = useState({ workDate: '', hours: '', note: '', projectId: '' });
  const [absence, setAbsence] = useState({ workDate: '', note: '' });
  const [holiday, setHoliday] = useState({ name: '', holidayDate: '', businessUnitId: '' });
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '', leaveType: 'ANNUAL' });
  const [sheet, setSheet] = useState({ workDate: '', hours: '', note: '', projectId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pane, setPane] = useState(() => (window.location.hash === '#leave' ? 'leave' : 'attendance'));
  const [modal, setModal] = useState('');
  const [canManageSystem, setCanManageSystem] = useState(false);
  const [ownAttendance, setOwnAttendance] = useState(true);

  const loadWorker = async (id, people = workers) => {
    if (!id) return;
    const person = people.find((worker) => worker.id === id);
    if (person) {
      setPolicy({
        attendancePolicy: person.attendancePolicy || 'OFFICE',
        workDays: (person.workDays || '1,2,3,4,5').split(','),
        shiftStart: person.shiftStart || '08:00',
        shiftEnd: person.shiftEnd || '17:00',
      });
    }
    const [attendanceRes, leaveRes, sheetRes] = await Promise.all([
      hbmsApi.get(`/attendance?employeeId=${id}&from=${range.from}&to=${range.to}`),
      hbmsApi.get(`/employees/leave?employeeId=${id}`),
      hbmsApi.get(`/attendance/timesheets?employeeId=${id}`),
    ]);
    setRows(attendanceRes.data.data);
    setLeave(leaveRes.data.data);
    setSheets(sheetRes.data.data);
  };

  const loadShared = async () => {
    const [workerRes, projectRes, unitRes, holidayRes, reportRes] = await Promise.all([
      hbmsApi.get('/employees?limit=100'),
      hbmsApi.get('/projects?limit=100'),
      hbmsApi.get('/business-units'),
      hbmsApi.get('/attendance/holidays'),
      hbmsApi.get(`/attendance/report?from=${range.from}&to=${range.to}`),
    ]);
    setWorkers(workerRes.data.data);
    setProjects(projectRes.data.data);
    setUnits(unitRes.data.data);
    setHolidays(holidayRes.data.data);
    setReport(reportRes.data.data);
    return workerRes.data.data;
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [people, accessRes] = await Promise.all([
          loadShared(),
          hbmsApi.get('/access/me'),
        ]);
        if (!active) return;
        const rights = accessRes.data.data || {};
        setCanManageSystem(Boolean(rights.canManageSystem));
        setOwnAttendance(rights.ownAttendance !== false);
        const selfId = rights.employee?.id || '';
        const first = rights.ownAttendance === false ? (people[0]?.id || selfId) : (selfId || people[0]?.id || '');
        setWorkerId(first);
        await loadWorker(first, people);
      } catch (err) {
        if (active) setError(apiError(err, 'Could not load attendance'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading || window.location.hash !== '#leave') return;
    setPane('leave');
    document.getElementById('leave')?.scrollIntoView({ block: 'start' });
  }, [loading]);

  const refresh = async () => {
    const people = await loadShared();
    await loadWorker(workerId, people);
  };

  const chooseWorker = async (id) => {
    setWorkerId(id);
    try {
      await loadWorker(id);
    } catch (err) {
      toast.error(apiError(err, 'Could not open this worker'));
    }
  };

  const savePolicy = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.patch(`/employees/${workerId}`, {
        attendancePolicy: policy.attendancePolicy,
        workDays: policy.workDays.join(','),
        shiftStart: policy.shiftStart,
        shiftEnd: policy.shiftEnd,
      });
      toast.success('Attendance policy saved');
      setModal('');
      await refresh();
    } catch (err) {
      toast.error(apiError(err, 'Could not save the policy'));
    }
  };

  const check = async (path) => {
    try {
      await hbmsApi.post(`/attendance/${path}`, { employeeId: workerId });
      toast.success(path === 'check-in' ? 'Checked in' : 'Checked out');
      await refresh();
    } catch (err) {
      toast.error(apiError(err, 'Could not update attendance'));
    }
  };

  const submitEvent = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post('/attendance/event-hours', { ...eventHours, employeeId: workerId, projectId: eventHours.projectId || null });
      toast.success('Event hours submitted for approval');
      setModal('');
      setEventHours({ workDate: '', hours: '', note: '', projectId: eventHours.projectId });
      await refresh();
    } catch (err) {
      toast.error(apiError(err, 'Could not record event hours'));
    }
  };

  const submitAbsence = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post('/attendance/absence', { ...absence, employeeId: workerId });
      toast.success('Absence recorded');
      setModal('');
      setAbsence({ workDate: '', note: '' });
      await refresh();
    } catch (err) {
      toast.error(apiError(err, 'Could not record absence'));
    }
  };

  const decide = async (path, id, decision) => {
    try {
      await hbmsApi.post(path.replace(':id', id), { decision });
      toast.success(decision === 'APPROVED' ? 'Approved' : 'Rejected');
      await refresh();
    } catch (err) {
      toast.error(apiError(err, 'Could not save the decision'));
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading attendance…</p>;
  if (error) return <Notice>{error}</Notice>;

  const worker = workers.find((item) => item.id === workerId);
  const todayKey = toDateInput(new Date().toISOString());
  const localToday = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const todayRow = rows.find((row) => toDateInput(row.workDate) === todayKey);
  const openCheckIn = todayRow?.checkedInAt && !todayRow.checkedOutAt;
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const monthLabel = new Date(`${range.from}T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const totals = report.reduce((sum, item) => ({
    present: sum.present + item.present,
    late: sum.late + item.late,
    absent: sum.absent + item.absent,
    leaveDays: sum.leaveDays + item.leaveDays,
    missing: sum.missing + item.missing,
    hours: sum.hours + Number(item.hours || 0),
  }), { present: 0, late: 0, absent: 0, leaveDays: 0, missing: 0, hours: 0 });
  const ringParts = [
    { label: 'Present', value: totals.present, color: '#15803d' },
    { label: 'Late', value: totals.late, color: '#f59e0b' },
    { label: 'Absent', value: totals.absent, color: '#f43f5e' },
    { label: 'Leave', value: totals.leaveDays, color: '#38bdf8' },
  ];
  const marked = ringParts.reduce((sum, part) => sum + part.value, 0);
  const mine = report.find((item) => item.id === workerId);
  const byDate = new Map(rows.map((row) => [toDateInput(row.workDate), row]));
  const calendar = monthGrid(range.from);
  const barMax = Math.max(1, ...report.map((item) => item.present + item.late + item.absent + item.leaveDays + item.missing));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Attendance and leave</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">Each worker follows their own policy. Office staff check in. Event workers record approved hours.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-right shadow-sm">
            <p className="text-sm font-medium text-gray-800">{todayLabel}</p>
            <p className="text-[11px] text-gray-400">{monthLabel}</p>
          </div>
          {ownAttendance ? (
            <p className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm">{worker ? personName(worker) : 'My attendance'}</p>
          ) : (
            <label className="text-xs font-medium text-gray-600">
              Worker
              <select className={`${inputClass} mt-1 min-w-56`} value={workerId} onChange={(e) => chooseWorker(e.target.value)}>
                {workers.map((item) => <option key={item.id} value={item.id}>{personName(item)} · {item.staffCode}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatTile tone="emerald" icon="carbon:checkmark-outline" value={totals.present} label="Present" detail={`${Math.round(totals.hours)} hours recorded`} />
        <StatTile tone="amber" icon="carbon:time" value={totals.late} label="Late" detail="Arrived after the shift" />
        <StatTile tone="rose" icon="carbon:close-outline" value={totals.absent} label="Absent" detail={`${totals.missing} missing check-in${totals.missing === 1 ? '' : 's'}`} />
        <StatTile tone="sky" icon="carbon:calendar" value={totals.leaveDays} label="Leave days" detail="Approved leave this month" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_280px]">
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">{ownAttendance ? 'This month' : 'Team this month'}</h3>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Present</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-400" /> Late</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-rose-400" /> Absent</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-400" /> Leave</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-gray-300" /> Missing</span>
          </div>
          {report.length === 0 ? <p className="mt-4 text-sm text-gray-500">No workers in this view.</p> : (
            <ul className="mt-4 space-y-3">
              {report.map((item) => {
                const width = (count) => `${Math.round((count / barMax) * 100)}%`;
                return (
                  <li key={item.id}>
                    <button type="button" className="mb-1 text-xs font-medium text-gray-800 hover:text-emerald-800" onClick={() => chooseWorker(item.id)}>
                      {personName(item)}
                    </button>
                    <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
                      <span className="bg-emerald-500" style={{ width: width(item.present) }} />
                      <span className="bg-amber-400" style={{ width: width(item.late) }} />
                      <span className="bg-rose-400" style={{ width: width(item.absent) }} />
                      <span className="bg-sky-400" style={{ width: width(item.leaveDays) }} />
                      <span className="bg-gray-300" style={{ width: width(item.missing) }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Month mix</h3>
          <div className="mt-3 flex items-center gap-4">
            <SplitRing parts={ringParts} total={marked} caption="marked" />
            <ul className="space-y-2 text-sm">
              {ringParts.map((part) => (
                <li key={part.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: part.color }} />
                  <span className="font-medium text-gray-800">{part.label}</span>
                  <span className="text-gray-500">{part.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      <Segmented
        value={pane}
        onChange={(next) => {
          setPane(next);
          window.history.replaceState(null, '', next === 'leave' ? '#leave' : window.location.pathname);
        }}
        options={[['attendance', 'Attendance'], ['leave', 'Leave requests']]}
      />

      {pane === 'attendance' && worker && policy && (
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{worker.staffCode}</p>
              <h3 className="text-lg font-semibold text-gray-900">{personName(worker)}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {optionLabel(attendancePolicyOptions, policy.attendancePolicy)}
                {policy.attendancePolicy !== 'EVENT' && policy.attendancePolicy !== 'FLEXIBLE' ? ` · ${policy.shiftStart}–${policy.shiftEnd}` : ''}
                {mine ? ` · ${mine.present} present · ${mine.late} late · ${mine.absent} absent` : ''}
              </p>
            </div>
            {canManageSystem ? <button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('policy')}>Edit policy</button> : null}
          </div>
          <FormModal open={modal === 'policy'} title="Attendance policy" subtitle={`${personName(worker)} · ${worker.staffCode}`} onClose={() => setModal('')}>
          <form className="space-y-3" onSubmit={savePolicy}>
            <Field label="Attendance policy">
              <select className={inputClass} value={policy.attendancePolicy} onChange={(e) => setPolicy({ ...policy, attendancePolicy: e.target.value })}>
                {attendancePolicyOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <p className="text-xs text-gray-500">{policyHelp[policy.attendancePolicy]}</p>
            <div>
              <p className="text-xs font-medium text-gray-600">Working days</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {weekdays.map(([value, label]) => (
                  <label key={value} className="flex items-center gap-1 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={policy.workDays.includes(String(value))}
                      onChange={() => {
                        const key = String(value);
                        const next = policy.workDays.includes(key)
                          ? policy.workDays.filter((day) => day !== key)
                          : [...policy.workDays, key];
                        setPolicy({ ...policy, workDays: next });
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Shift start">
                <input className={inputClass} value={policy.shiftStart} onChange={(e) => setPolicy({ ...policy, shiftStart: e.target.value })} />
              </Field>
              <Field label="Shift end">
                <input className={inputClass} value={policy.shiftEnd} onChange={(e) => setPolicy({ ...policy, shiftEnd: e.target.value })} />
              </Field>
            </div>
            <p className="text-xs text-gray-500">
              Supervisor: {worker.reportsTo ? personName(worker.reportsTo) : 'none on file'}
            </p>
            <div className="flex justify-end">
              <PrimaryButton type="submit">Save policy</PrimaryButton>
            </div>
          </form>
          </FormModal>

          <div>
            {policy.attendancePolicy === 'EVENT' ? (
              <>
              <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setModal('hours')}>Record event hours</button>
              <FormModal open={modal === 'hours'} title="Event hours" subtitle={personName(worker)} onClose={() => setModal('')}>
              <form className="grid gap-3" onSubmit={submitEvent}>
                <input type="date" aria-label="Event date" className={inputClass} value={eventHours.workDate} onChange={(e) => setEventHours({ ...eventHours, workDate: e.target.value })} required />
                <input className={inputClass} inputMode="decimal" placeholder="Hours" value={eventHours.hours} onChange={(e) => setEventHours({ ...eventHours, hours: e.target.value })} required />
                <select className={inputClass} value={eventHours.projectId} onChange={(e) => setEventHours({ ...eventHours, projectId: e.target.value })}>
                  <option value="">No project</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}
                </select>
                <Field label="Work">
                  <input className={inputClass} placeholder="Event work" value={eventHours.note} onChange={(e) => setEventHours({ ...eventHours, note: e.target.value })} required />
                </Field>
                <div className="flex justify-end">
                  <PrimaryButton type="submit">Submit hours</PrimaryButton>
                </div>
              </form>
              </FormModal>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="rounded-lg bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800" onClick={() => check('check-in')}>Check in</button>
                <button type="button" className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800" onClick={() => check('check-out')} disabled={!openCheckIn}>Check out</button>
                <span className="text-xs text-gray-500">
                  {todayRow?.checkedInAt
                    ? `In at ${new Date(todayRow.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${todayRow.checkedOutAt ? ` · out at ${new Date(todayRow.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${hoursLabel(todayRow.hours)}` : ''}`
                    : 'Not checked in today'}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-gray-400">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => <span key={label}>{label}</span>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendar.map((cell, index) => cell ? (
                <div key={cell.key} className={`flex aspect-square items-center justify-center rounded-xl text-xs font-medium ${dayTone(byDate.get(cell.key)?.status)} ${cell.key === localToday ? 'ring-2 ring-emerald-600' : ''}`}>
                  {cell.day}
                </div>
              ) : <div key={`blank-${index}`} />)}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Present</span>
              <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-400" /> Late</span>
              <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-rose-400" /> Absent</span>
              <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-gray-200" /> No record</span>
            </div>
          </div>
        </section>
      )}

      {pane === 'attendance' && (
      <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900">Recent records</h3>
          <button type="button" className="rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-800" onClick={() => setModal('absence')}>Record absence</button>
        </div>
          {rows.length === 0 ? <Notice tone="empty">No attendance recorded this month.</Notice> : (
            <ul className="space-y-2 text-sm">
              {rows.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <span>
                    <span className="font-medium text-gray-900">{formatDate(row.workDate)}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {row.source === 'EVENT' ? 'Event' : row.source === 'ABSENCE' ? 'Absence' : 'Check-in'}
                      {row.note ? ` · ${row.note}` : ''}
                      {row.project ? ` · ${row.project.code}` : ''}
                      {row.hours != null ? ` · ${hoursLabel(row.hours)}` : ''}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge value={row.status} />
                    {row.approvalStatus && <StatusBadge value={row.approvalStatus} />}
                    {row.approvalStatus === 'PENDING' && (
                      <>
                        <button type="button" className="text-xs font-medium text-green-700" onClick={() => decide('/attendance/:id/decision', row.id, 'APPROVED')}>Approve</button>
                        <button type="button" className="text-xs font-medium text-red-600" onClick={() => decide('/attendance/:id/decision', row.id, 'REJECTED')}>Reject</button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <FormModal open={modal === 'absence'} title="Record absence" onClose={() => setModal('')}>
          <form className="grid gap-3" onSubmit={submitAbsence}>
            <Field label="Date">
              <input type="date" className={inputClass} value={absence.workDate} onChange={(e) => setAbsence({ ...absence, workDate: e.target.value })} required />
            </Field>
            <Field label="Note">
              <input className={inputClass} placeholder="Absence note" value={absence.note} onChange={(e) => setAbsence({ ...absence, note: e.target.value })} />
            </Field>
            <div className="flex justify-end">
              <PrimaryButton type="submit">Record absence</PrimaryButton>
            </div>
          </form>
          </FormModal>
      </section>
      )}

      {pane === 'leave' && (
        <section id="leave" className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">Leave requests</h3>
            <button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('leave')}>Request leave</button>
          </div>
          <FormModal open={modal === 'leave'} title="Request leave" subtitle={worker ? personName(worker) : ''} onClose={() => setModal('')}>
          <form className="grid gap-3" onSubmit={async (event) => {
            event.preventDefault();
            try {
              await hbmsApi.post('/employees/leave', { ...leaveForm, employeeId: workerId });
              toast.success('Leave submitted');
              setModal('');
              setLeaveForm({ startDate: '', endDate: '', reason: '', leaveType: leaveForm.leaveType });
              await refresh();
            } catch (err) {
              toast.error(apiError(err, 'Could not submit leave'));
            }
          }}
          >
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start">
                <input type="date" className={inputClass} value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required />
              </Field>
              <Field label="End">
                <input type="date" className={inputClass} value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required />
              </Field>
            </div>
            <Field label="Type">
              <select className={inputClass} value={leaveForm.leaveType} onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}>
                <option value="ANNUAL">Annual</option>
                <option value="SICK">Sick</option>
                <option value="UNPAID">Unpaid</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Reason">
              <input className={inputClass} placeholder="Reason" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
            </Field>
            <div className="flex justify-end">
              <PrimaryButton type="submit">Request leave</PrimaryButton>
            </div>
          </form>
          </FormModal>
          {leave.length === 0 ? <p className="mt-4 text-sm text-gray-500">No leave requests.</p> : (
            <ul className="mt-4 space-y-3">
              {leave.map((request) => {
                const start = new Date(request.startDate);
                return (
                  <li key={request.id} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-2">
                    <span className="w-12 shrink-0 rounded-xl bg-emerald-50 py-1 text-center">
                      <span className="block text-[10px] font-semibold uppercase text-emerald-700">{start.toLocaleDateString(undefined, { month: 'short' })}</span>
                      <span className="block text-base font-semibold leading-none text-gray-900">{start.getDate()}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-900">{request.leaveType} · {formatDate(request.startDate)} – {formatDate(request.endDate)}</span>
                      <span className="block text-xs text-gray-500">{request.reason || 'No reason'} · Supervisor: {request.employee?.reportsTo ? personName(request.employee.reportsTo) : 'an administrator'}</span>
                      {request.status === 'PENDING' && (
                        <span className="mt-1 flex gap-2">
                          <button type="button" className="text-xs font-medium text-green-700" onClick={() => decide('/employees/leave/:id/decision', request.id, 'APPROVED')}>Approve</button>
                          <button type="button" className="text-xs font-medium text-red-600" onClick={() => decide('/employees/leave/:id/decision', request.id, 'REJECTED')}>Reject</button>
                        </span>
                      )}
                    </span>
                    <StatusBadge value={request.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">Public holidays</h3>
            {canManageSystem ? <button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('holiday')}>Add holiday</button> : null}
          </div>
          <FormModal open={modal === 'holiday'} title="Add holiday" subtitle="A public holiday is not counted as an absence." onClose={() => setModal('')}>
          <form className="grid gap-3" onSubmit={async (event) => {
            event.preventDefault();
            try {
              await hbmsApi.post('/attendance/holidays', { ...holiday, businessUnitId: holiday.businessUnitId || null });
              toast.success('Holiday added');
              setModal('');
              setHoliday({ name: '', holidayDate: '', businessUnitId: '' });
              await refresh();
            } catch (err) {
              toast.error(apiError(err, 'Could not add holiday'));
            }
          }}
          >
            <Field label="Name">
              <input className={inputClass} placeholder="Holiday" value={holiday.name} onChange={(e) => setHoliday({ ...holiday, name: e.target.value })} required />
            </Field>
            <Field label="Date">
              <input type="date" className={inputClass} value={holiday.holidayDate} onChange={(e) => setHoliday({ ...holiday, holidayDate: e.target.value })} required />
            </Field>
            <Field label="Business unit">
              <select className={inputClass} value={holiday.businessUnitId} onChange={(e) => setHoliday({ ...holiday, businessUnitId: e.target.value })}>
                <option value="">All units</option>
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
              </select>
            </Field>
            <div className="flex justify-end">
              <PrimaryButton type="submit">Add holiday</PrimaryButton>
            </div>
          </form>
          </FormModal>
          {holidays.length === 0 ? <p className="mt-4 text-sm text-gray-500">No public holidays yet. A holiday is not counted as an absence.</p> : (
            <ul className="mt-4 space-y-3">
              {holidays.map((item) => {
                const when = new Date(item.holidayDate);
                return (
                <li key={item.id} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 rounded-xl bg-violet-50 py-1 text-center">
                    <span className="block text-[10px] font-semibold uppercase text-violet-700">{when.toLocaleDateString(undefined, { month: 'short' })}</span>
                    <span className="block text-base font-semibold leading-none text-gray-900">{when.getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900">{item.name}</span>
                    <span className="block text-xs text-gray-500">{item.businessUnit?.name || 'All units'}</span>
                  </span>
                  <button type="button" className="text-xs text-red-600" onClick={async () => {
                    try {
                      await hbmsApi.delete(`/attendance/holidays/${item.id}`);
                      await refresh();
                    } catch (err) {
                      toast.error(apiError(err, 'Could not remove holiday'));
                    }
                  }}
                  >Remove</button>
                </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">Timesheets</h3>
            <button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('sheet')}>Add timesheet</button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Optional. Use a timesheet when project hours should be tracked separately from the daily check-in.</p>
          <FormModal open={modal === 'sheet'} title="Add timesheet" subtitle={worker ? personName(worker) : ''} onClose={() => setModal('')}>
          <form className="grid gap-3" onSubmit={async (event) => {
            event.preventDefault();
            try {
              await hbmsApi.post('/attendance/timesheets', { ...sheet, employeeId: workerId, projectId: sheet.projectId || null });
              toast.success('Timesheet added');
              setModal('');
              setSheet({ workDate: '', hours: '', note: '', projectId: sheet.projectId });
              await refresh();
            } catch (err) {
              toast.error(apiError(err, 'Could not add timesheet'));
            }
          }}
          >
            <div className="grid grid-cols-2 gap-2">
              <Field label="Date">
                <input type="date" className={inputClass} value={sheet.workDate} onChange={(e) => setSheet({ ...sheet, workDate: e.target.value })} required />
              </Field>
              <Field label="Hours">
                <input className={inputClass} inputMode="decimal" placeholder="Hours" value={sheet.hours} onChange={(e) => setSheet({ ...sheet, hours: e.target.value })} required />
              </Field>
            </div>
            <Field label="Project">
              <select className={inputClass} value={sheet.projectId} onChange={(e) => setSheet({ ...sheet, projectId: e.target.value })}>
                <option value="">No project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}
              </select>
            </Field>
            <Field label="What was done">
              <input className={inputClass} placeholder="What was done" value={sheet.note} onChange={(e) => setSheet({ ...sheet, note: e.target.value })} />
            </Field>
            <div className="flex justify-end">
              <PrimaryButton type="submit">Add timesheet</PrimaryButton>
            </div>
          </form>
          </FormModal>
          {sheets.length === 0 ? <p className="mt-4 text-sm text-gray-500">No timesheets.</p> : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {sheets.map((item) => (
                <li key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-semibold text-gray-900">{hoursLabel(item.hours)}</span>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(item.workDate)}</p>
                  <p className="text-xs text-gray-500">{item.project?.code || 'No project'}{item.note ? ` · ${item.note}` : ''}</p>
                  {item.status === 'PENDING' && (
                    <button type="button" className="mt-2 text-xs font-medium text-green-700" onClick={() => decide('/attendance/timesheets/:id/decision', item.id, 'APPROVED')}>Approve</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900">Report · {formatDate(range.from)} – {formatDate(range.to)}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {['Worker', 'Policy', 'Present', 'Late', 'Absent', 'Leave', 'Missing', 'Hours', 'Timesheet'].map((heading) => (
                  <th key={heading} className="px-2 py-2 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.map((item) => (
                <tr key={item.id} className={item.id === workerId ? 'bg-green-50' : ''}>
                  <td className="px-2 py-2">
                    <Link to={`/admin/hbms/workers/${item.id}`} className="font-medium text-gray-900 hover:text-green-800">{personName(item)}</Link>
                  </td>
                  <td className="px-2 py-2 text-gray-600">{optionLabel(attendancePolicyOptions, item.attendancePolicy)}</td>
                  <td className="px-2 py-2">{item.present}</td>
                  <td className="px-2 py-2">{item.late}</td>
                  <td className="px-2 py-2">{item.absent}</td>
                  <td className="px-2 py-2">{item.leaveDays}</td>
                  <td className="px-2 py-2">{item.missing}</td>
                  <td className="px-2 py-2">{hoursLabel(item.hours)}{item.pendingHours ? ` · ${item.pendingHours} pending` : ''}</td>
                  <td className="px-2 py-2">{hoursLabel(item.timesheetHours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">Missing means a past office or remote working day with no check-in, excluding holidays and approved leave. Event and flexible policies are not marked missing.</p>
      </section>
    </div>
  );
};

export default HbmsAttendance;
