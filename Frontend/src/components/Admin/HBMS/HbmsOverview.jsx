import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../../../assets/context/AuthContext.jsx';
import programPhoto from '../../../assets/camera-operator-shooting-on-professional-camera-1024x682.webp';
import hbmsApi, { apiError, formatDate } from './api';

const programLabels = {
  SOFTWARE_TRAINING: 'Software training',
  MEDIA_TRAINING: 'Media training',
  HOLIDAY: 'Holiday program',
  INTERNSHIP: 'Internship',
  WORKSHOP: 'Workshop',
  HACKATHON: 'Hackathon',
  COURSE: 'Course',
};

const taskColumns = [
  { key: 'TODO', label: 'To do', tone: 'bg-slate-50', chip: 'text-slate-600' },
  { key: 'IN_PROGRESS', label: 'In progress', tone: 'bg-sky-50', chip: 'text-sky-700' },
  { key: 'IN_REVIEW', label: 'In review', tone: 'bg-violet-50', chip: 'text-violet-700' },
  { key: 'DONE', label: 'Completed', tone: 'bg-emerald-50', chip: 'text-emerald-700' },
];

const priorityTone = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-amber-100 text-amber-800',
  LOW: 'bg-emerald-100 text-emerald-700',
};

function readableActivity(text) {
  const known = {
    'expense create': 'recorded an expense',
    'document create': 'added a document',
    'document delete': 'removed a document',
    'meeting create': 'scheduled a meeting',
    'announcement create': 'posted an announcement',
  };
  return known[text] || text;
}

function relativeTime(value) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function initials(name) {
  return String(name || '?').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function Ring({ percent, color, label, caption }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const drawn = (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center text-center">
      <svg viewBox="0 0 140 140" className="h-36 w-36">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef2f0" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${drawn} ${circumference}`}
          transform="rotate(-90 70 70)"
        />
        <circle cx="70" cy={70 - radius} r="5" fill={color} />
        <text x="70" y="76" textAnchor="middle" fill="#111827" fontSize="22" fontWeight="700">{value}%</text>
      </svg>
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{caption}</p>
    </div>
  );
}

function SplitRing({ parts }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  let cursor = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#eef2f0" strokeWidth="14" />
      {total > 0 && parts.map((part) => {
        const length = (part.value / total) * circumference;
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
      <text x="60" y="56" textAnchor="middle" fill="#111827" fontSize="18" fontWeight="700">
        {total ? Math.round((parts[0].value / total) * 100) : 0}%
      </text>
      <text x="60" y="72" textAnchor="middle" fill="#6b7280" fontSize="9">{parts[0]?.label || ''}</text>
    </svg>
  );
}

const statTones = {
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  sky: 'border-sky-100 bg-sky-50 text-sky-700',
  violet: 'border-violet-100 bg-violet-50 text-violet-700',
  amber: 'border-amber-100 bg-amber-50 text-amber-700',
};

function StatCard({ tone, icon, value, label, detail, to }) {
  return (
    <Link to={to} className={`flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statTones[tone]}`}>
      <span className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80">
          <Icon icon={icon} className="h-6 w-6" />
        </span>
        <span>
          <span className="block text-2xl font-semibold leading-none text-gray-900">{value}</span>
          <span className="mt-1 block text-sm font-medium text-gray-800">{label}</span>
          <span className="block text-xs text-gray-500">{detail}</span>
        </span>
      </span>
      <Icon icon="carbon:chevron-right" className="h-4 w-4 shrink-0 opacity-60" />
    </Link>
  );
}

const HbmsOverview = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [access, setAccess] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState('ALL');

  useEffect(() => {
    let active = true;
    Promise.all([
      hbmsApi.get('/dashboard'),
      hbmsApi.get('/meetings').catch(() => ({ data: { data: [] } })),
      hbmsApi.get('/access/me').catch(() => ({ data: { data: null } })),
    ])
      .then(([dashboard, meetingResponse, accessResponse]) => {
        if (!active) return;
        setData(dashboard.data.data);
        setMeetings(meetingResponse.data.data || []);
        setAccess(accessResponse.data.data);
      })
      .catch((err) => {
        if (active) setError(apiError(err, 'Could not load the dashboard'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading dashboard…</p>;
  if (error) return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;

  const firstName = (user?.name || 'there').split(' ')[0];
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = new Intl.DateTimeFormat(undefined, { timeZoneName: 'shortOffset' })
    .formatToParts(new Date())
    .find((part) => part.type === 'timeZoneName')?.value || '';
  const zoneLabel = `${zone === 'Africa/Kigali' ? 'Kigali Time' : zone.replaceAll('_', ' ')} (${offset})`;
  const projects = data.projects.progress || [];
  const activeProjects = projects.filter((project) => project.status === 'ACTIVE');
  const unitStats = ['HBLab', 'HBStudio'].map((name, index) => {
    const rows = activeProjects.filter((project) => project.unit === name);
    const average = rows.length
      ? Math.round(rows.reduce((sum, project) => sum + Number(project.progress || 0), 0) / rows.length)
      : 0;
    return {
      name,
      label: `${name} projects`,
      count: rows.length,
      average,
      color: index === 0 ? '#2e6b57' : '#7c3aed',
      value: rows.length,
    };
  });
  const workerBits = [
    ['FULL_TIME', 'employee', 'employees'],
    ['INTERN', 'intern', 'interns'],
    ['FREELANCE', 'freelancer', 'freelancers'],
  ]
    .map(([key, one, many]) => {
      const count = data.workers.byType?.[key] || 0;
      return count ? `${count} ${count === 1 ? one : many}` : '';
    })
    .filter(Boolean)
    .join(' · ') || 'Employees, interns, and freelancers';
  const overdueDeadlines = data.deadlines.filter((item) => item.overdue).length;
  const tasks = data.myTasks.items || [];
  const myOverdue = tasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE').length;
  const columnCount = (key) => tasks.filter((task) => (
    key === 'IN_PROGRESS' ? task.status === 'IN_PROGRESS' || task.status === 'BLOCKED' : task.status === key
  )).length;
  const programs = data.programs.items || [];
  const featured = programs[0];
  const enrolledShare = featured?.capacity
    ? Math.round(((featured.enrolled || 0) / featured.capacity) * 100)
    : null;
  const week = data.attendance.week || [];
  const weekMax = Math.max(1, ...week.flatMap((day) => [day.present, day.absent, day.leave]));
  const now = new Date();
  const upcomingMeetings = meetings
    .filter((meeting) => new Date(meeting.startsAt) >= now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .slice(0, 4);
  const unitTotal = unitStats.reduce((sum, unit) => sum + unit.count, 0) || 1;
  const actions = [
    ['carbon:folder-add', 'Create project', '/admin/hbms/projects', access?.canCreateProject],
    ['carbon:user-follow', 'Add worker', '/admin/hbms/workers', access?.canManageSystem],
    ['carbon:education', 'Create program', '/admin/hbms/programs', access?.canManageSystem],
    ['carbon:task-add', 'New task', '/admin/hbms/tasks', access?.canAssignWork],
    ['carbon:calendar', 'Schedule meeting', '/admin/hbms/messages', access?.canAssignWork],
    ['carbon:document-add', 'Upload file', '/admin/hbms/documents', true],
  ].filter((item) => item[3]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Welcome back, {firstName}.</h2>
        <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-right shadow-sm">
          <p className="text-sm font-medium text-gray-800">{todayLabel}</p>
          <p className="text-[11px] text-gray-400">{zoneLabel}</p>
        </div>
      </div>
      <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-gray-800">{data.summary}</p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="emerald" icon="carbon:group" value={data.workers.total} label="Total workers" detail={workerBits} to="/admin/hbms/workers" />
        <StatCard tone="sky" icon="carbon:folder" value={data.projects.active} label="Active projects" detail={unitStats.map((unit) => `${unit.count} ${unit.name}`).join(' · ')} to="/admin/hbms/projects" />
        <StatCard tone="violet" icon="carbon:checkmark-outline" value={data.myTasks.linked ? data.myTasks.total : '—'} label="My tasks" detail={data.myTasks.linked ? `${myOverdue} overdue` : 'Login is not linked to a worker'} to="/admin/hbms/tasks" />
        <StatCard tone="amber" icon="carbon:calendar" value={data.deadlines.length} label="Upcoming deadlines" detail={`${overdueDeadlines} overdue`} to="/admin/hbms/tasks" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Project progress</h3>
            <Link to="/admin/hbms/projects" className="text-xs font-medium text-emerald-700">View all</Link>
          </div>
          <div className="mt-2 grid grid-cols-2">
            {unitStats.map((unit) => (
              <Ring key={unit.name} percent={unit.average} color={unit.color} label={unit.label} caption={`${unit.count} active`} />
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 pt-4">
            <h3 className="font-semibold text-gray-900">Active programs</h3>
            <Link to="/admin/hbms/programs" className="text-xs font-medium text-emerald-700">View all</Link>
          </div>
          {featured ? (
            <Link to={`/admin/hbms/programs/${featured.id}`} className="mt-3 grid gap-3 px-4 pb-4 sm:grid-cols-[140px_1fr]">
              <img src={programPhoto} alt="" className="h-28 w-full rounded-2xl object-cover sm:h-full" />
              <span>
                <span className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-gray-900">{featured.name}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">Active</span>
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  {programLabels[featured.kind] || featured.kind}
                  {featured.endDate ? ` · through ${formatDate(featured.endDate)}` : ''}
                </span>
                <span className="mt-2 block text-xs text-gray-600">
                  {featured.enrolled || 0} enrolled{featured.capacity ? ` of ${featured.capacity}` : ''} · {featured.businessUnit?.name}
                </span>
                {enrolledShare !== null && (
                  <span className="mt-3 block">
                    <span className="mb-1 flex justify-between text-[11px] text-gray-500"><span>Enrollment</span><span>{enrolledShare}%</span></span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-emerald-100">
                      <span className="block h-full rounded-full bg-emerald-600" style={{ width: `${enrolledShare}%` }} />
                    </span>
                  </span>
                )}
              </span>
            </Link>
          ) : (
            <p className="px-4 py-6 text-sm text-gray-500">No active programs yet.</p>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Attendance this week</h3>
            <Link to="/admin/hbms/attendance" className="text-xs font-medium text-emerald-700">Open</Link>
          </div>
          <div className="mt-2 flex gap-3 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Present</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-rose-400" /> Absent</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-400" /> Leave</span>
          </div>
          <div className="mt-4 flex h-36 items-end justify-between gap-1">
            {week.map((day) => (
              <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-28 w-full items-end justify-center gap-0.5">
                  {[
                    [day.present, 'bg-emerald-500'],
                    [day.absent, 'bg-rose-400'],
                    [day.leave, 'bg-sky-400'],
                  ].map(([count, color]) => (
                    <div key={color} className="flex h-full w-1.5 items-end">
                      <div className={`w-full rounded-full ${color}`} style={{ height: count ? `${Math.max(8, (count / weekMax) * 100)}%` : '0%' }} title={`${count}`} />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-gray-400">{day.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">My tasks</h3>
              {[['ALL', 'All', tasks.length], ...taskColumns.map((column) => [column.key, column.label, columnCount(column.key)])].map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTaskFilter(key)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${taskFilter === key ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
            <Link to="/admin/hbms/tasks" className="text-xs font-medium text-emerald-700">View all</Link>
          </div>
          {!data.myTasks.linked ? (
            <p className="mt-4 rounded-2xl bg-gray-50 px-3 py-6 text-sm text-gray-500">Link this account to a worker to see personal assignments here.</p>
          ) : (
            <div className={`mt-4 grid gap-3 ${taskFilter === 'ALL' ? 'sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {taskColumns.filter((column) => taskFilter === 'ALL' || taskFilter === column.key).map((column) => {
                const items = tasks.filter((task) => (
                  column.key === 'IN_PROGRESS'
                    ? task.status === 'IN_PROGRESS' || task.status === 'BLOCKED'
                    : task.status === column.key
                ));
                return (
                  <div key={column.key} className={`rounded-2xl p-2 ${column.tone}`}>
                    <p className={`px-1 text-xs font-semibold ${column.chip}`}>{column.label} · {items.length}</p>
                    <ul className="mt-2 space-y-2">
                      {items.length === 0 && <li className="px-1 py-3 text-xs text-gray-400">None</li>}
                      {items.map((task) => (
                        <li key={task.id} className="rounded-xl bg-white p-2 shadow-sm">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <p className="mt-1 text-[11px] text-gray-500">{task.project?.name || 'Task'} · {formatDate(task.dueDate)}</p>
                          {task.priority && (
                            <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityTone[task.priority] || 'bg-gray-100 text-gray-600'}`}>
                              {String(task.priority).toLowerCase()}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Upcoming events</h3>
            <Link to="/admin/hbms/messages" className="text-xs font-medium text-emerald-700">View all</Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No meetings are scheduled.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {upcomingMeetings.map((meeting) => {
                const when = new Date(meeting.startsAt);
                return (
                  <li key={meeting.id}>
                    <Link to="/admin/hbms/messages" className="flex items-center gap-3 rounded-2xl p-1 hover:bg-gray-50">
                      <span className="w-12 shrink-0 rounded-xl bg-emerald-50 py-1 text-center">
                        <span className="block text-[10px] font-semibold uppercase text-emerald-700">{when.toLocaleDateString(undefined, { month: 'short' })}</span>
                        <span className="block text-base font-semibold leading-none text-gray-900">{when.getDate()}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900">{meeting.title}</span>
                        <span className="block text-xs text-gray-500">
                          {meeting.project?.name || meeting.location || 'Meeting'}
                          {' · '}
                          {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Recent activity</h3>
          {data.activity.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Team updates appear here after workers, projects, and reviews change.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.activity.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-800">{initials(item.actor)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-gray-800"><span className="font-medium">{item.actor}</span> {readableActivity(item.text)}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-400">{relativeTime(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Business units</h3>
          <div className="mt-3 flex items-center gap-4">
            <SplitRing parts={unitStats} />
            <ul className="space-y-2 text-sm">
              {unitStats.map((unit) => (
                <li key={unit.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: unit.color }} />
                  <span className="font-medium text-gray-800">{unit.name}</span>
                  <span className="text-gray-500">{Math.round((unit.count / unitTotal) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-xs text-gray-500">Share of active projects.</p>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Quick actions</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {actions.map(([icon, label, to]) => (
              <Link key={label} to={to} className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-2 py-3 text-center text-xs font-medium text-gray-800 hover:border-emerald-200 hover:bg-emerald-50">
                <Icon icon={icon} className="h-5 w-5 text-emerald-700" />
                {label}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {data.approvals.total
              ? `${data.approvals.tasks} task reviews · ${data.approvals.leave} leave · ${data.approvals.expenses} expenses waiting`
              : 'Nothing is waiting for approval.'}
          </p>
        </section>
      </div>
    </div>
  );
};

export default HbmsOverview;
