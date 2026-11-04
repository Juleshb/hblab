import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import hbmsApi, {
  apiError,
  formatDate,
  formatWhen,
  optionLabel,
  taskPriorityOptions,
  taskStatusOptions,
  toDateInput,
} from './api';
import { Field, FormModal, Notice, Panel, PrimaryButton, Segmented, StatusBadge, WorkerAvatar, inputClass } from './ui';

const columns = [
  { key: 'TODO', title: 'To do', statuses: ['TODO'], dot: 'bg-slate-400' },
  { key: 'IN_PROGRESS', title: 'In progress', statuses: ['IN_PROGRESS', 'BLOCKED'], dot: 'bg-sky-500' },
  { key: 'IN_REVIEW', title: 'In review', statuses: ['IN_REVIEW'], dot: 'bg-violet-500' },
  { key: 'DONE', title: 'Done', statuses: ['DONE'], dot: 'bg-emerald-600' },
];

const priorityEdge = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#0ea5e9',
  LOW: '#cbd5e1',
};

const views = [
  ['board', 'Kanban'],
  ['list', 'List'],
  ['calendar', 'Calendar'],
];

const emptyTask = {
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  priority: 'MEDIUM',
  startDate: '',
  dueDate: '',
};

function workerName(worker) {
  return `${worker.firstName} ${worker.lastName}`;
}

const statusParts = [
  { key: 'TODO', label: 'To do', color: '#64748b' },
  { key: 'IN_PROGRESS', label: 'In progress', color: '#0284c7' },
  { key: 'BLOCKED', label: 'Blocked', color: '#dc2626' },
  { key: 'IN_REVIEW', label: 'In review', color: '#7c3aed' },
  { key: 'DONE', label: 'Done', color: '#15803d' },
];

function MiniRing({ percent, color }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const drawn = (value / 100) * circumference;
  return (
    <svg viewBox="0 0 84 84" className="h-20 w-20">
      <circle cx="42" cy="42" r={radius} fill="none" stroke="#eef2f0" strokeWidth="8" />
      <circle cx="42" cy="42" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${drawn} ${circumference}`} transform="rotate(-90 42 42)" />
      <text x="42" y="47" textAnchor="middle" fill="#111827" fontSize="16" fontWeight="700">{value}%</text>
    </svg>
  );
}

function Stat({ icon, value, label, detail, tone }) {
  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${tone}`}>
      <Icon icon={icon} className="h-5 w-5" />
      <p className="mt-3 text-2xl font-semibold leading-none text-gray-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{label}</p>
      <p className="text-xs text-gray-500">{detail}</p>
    </article>
  );
}

function TaskCard({ task, selected, onOpen, onDragStart, onDragEnd }) {
  const studio = task.project?.businessUnit?.name === 'HBStudio';
  const overdue = isOverdue(task);
  const people = task.assignees || [];
  const checklist = task.checklist || [];
  const doneItems = checklist.filter((item) => item.done).length;
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ borderLeftColor: priorityEdge[task.priority] || '#cbd5e1' }}
      className={`cursor-grab rounded-2xl border border-l-4 border-gray-100 bg-white p-3 text-left shadow-sm ${selected ? 'ring-2 ring-emerald-200' : ''}`}
    >
      <button type="button" className="w-full text-left" onClick={onOpen}>
        <span className="flex items-start justify-between gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${studio ? 'bg-violet-100 text-violet-800' : 'bg-emerald-50 text-emerald-800'}`}>
            {task.project?.code || 'Task'}
          </span>
          <StatusBadge value={task.priority} label={optionLabel(taskPriorityOptions, task.priority)} />
        </span>
        <span className="mt-2 block text-sm font-semibold leading-5 text-gray-900">{task.title}</span>
        <span className="mt-1 block truncate text-[11px] text-gray-500">{task.project?.name || 'No project'}</span>
        <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${overdue ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
          {overdue ? 'Overdue' : 'Due'} · {formatDate(task.dueDate)}
        </span>
        <span className="mt-3 flex items-center justify-between gap-2">
          <span className="flex -space-x-1.5">
            {people.length === 0 ? (
              <span className="text-[11px] text-gray-400">Unassigned</span>
            ) : people.slice(0, 3).map((item) => (
              <WorkerAvatar key={item.employee.id} worker={item.employee} className="h-6 w-6 rounded-full border-2 border-white bg-emerald-100 text-[10px] font-semibold text-emerald-800" />
            ))}
            {people.length > 3 ? <span className="pl-2 text-[11px] font-medium text-gray-500">+{people.length - 3}</span> : null}
          </span>
          <span className="text-[11px] font-semibold text-gray-500">{task.progress || 0}%</span>
        </span>
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-gray-100">
          <span className={`block h-full rounded-full ${overdue ? 'bg-red-500' : 'bg-emerald-600'}`} style={{ width: `${Math.min(task.progress || 0, 100)}%` }} />
        </span>
        <span className="mt-2 flex items-center justify-between gap-2 text-[11px]">
          {task.status === 'BLOCKED' ? <span className="font-medium text-red-700">Blocked</span> : <span />}
          {checklist.length > 0 ? <span className="text-gray-500">{doneItems}/{checklist.length} done</span> : null}
        </span>
      </button>
    </article>
  );
}

function isOverdue(task) {
  if (!task?.dueDate || task.status === 'DONE' || task.status === 'CANCELLED') return false;
  return String(task.dueDate).slice(0, 10) < new Date().toISOString().slice(0, 10);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthDays(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function eventDay(event) {
  if (event.kind === 'meeting') return dateKey(new Date(event.date));
  return String(event.date).slice(0, 10);
}

const eventTone = {
  task: 'bg-blue-100 text-blue-800',
  meeting: 'bg-violet-100 text-violet-800',
  program: 'bg-green-100 text-green-800',
  session: 'bg-teal-100 text-teal-800',
  milestone: 'bg-amber-100 text-amber-800',
};

const HbmsTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [linked, setLinked] = useState(null);
  const [workspaceId, setWorkspaceId] = useState('');
  const [filters, setFilters] = useState({ q: '', projectId: '', status: '', priority: '' });
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [view, setView] = useState('board');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [draft, setDraft] = useState(null);
  const [comment, setComment] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [checkItem, setCheckItem] = useState('');
  const [pastedSteps, setPastedSteps] = useState('');
  const [newTask, setNewTask] = useState(emptyTask);
  const [showForm, setShowForm] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [calendarNonce, setCalendarNonce] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const [meeting, setMeeting] = useState({ title: '', startsAt: '', projectId: '', attendeeIds: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const dragged = useRef(false);

  const loadTasks = async (current = filters, personId = workspaceId) => {
    const params = new URLSearchParams({ limit: '100' });
    if (current.status) params.set('status', current.status);
    if (current.projectId) params.set('projectId', current.projectId);
    if (current.priority) params.set('priority', current.priority);
    if (current.q.trim()) params.set('q', current.q.trim());
    if (personId) params.set('assigneeId', personId);
    const response = await hbmsApi.get(`/tasks?${params.toString()}`);
    setTasks(response.data.data);
    return response.data.data;
  };

  const loadDetail = async (taskId) => {
    if (!taskId) {
      setDetail(null);
      setDraft(null);
      return;
    }
    const response = await hbmsApi.get(`/tasks/${taskId}`);
    const task = response.data.data;
    setDetail(task);
    setDraft({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      startDate: toDateInput(task.startDate),
      dueDate: toDateInput(task.dueDate),
      progress: task.progress || 0,
    });
  };

  const refresh = async (taskId = selectedId) => {
    await loadTasks();
    if (taskId) await loadDetail(taskId);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [workspaceRes, projectRes, workerRes] = await Promise.all([
          hbmsApi.get('/tasks/workspace'),
          hbmsApi.get('/projects?limit=100'),
          hbmsApi.get('/employees?limit=100'),
        ]);
        if (!active) return;
        setProjects(projectRes.data.data);
        setWorkers(workerRes.data.data);
        const employee = workspaceRes.data.data.employee;
        setLinked(employee);
        const personId = employee?.id || '';
        setWorkspaceId(personId);
        setNewTask((current) => ({ ...current, assigneeId: personId, projectId: projectRes.data.data[0]?.id || '' }));
        await loadTasks(filters, personId);
      } catch (err) {
        if (active) setError(apiError(err, 'Could not load tasks'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (view !== 'calendar') return undefined;
    let active = true;
    const days = monthDays(cursor);
    const from = dateKey(days[0]);
    const to = `${dateKey(days[days.length - 1])}T23:59:59`;
    const params = new URLSearchParams({ from, to });
    if (workspaceId) params.set('employeeId', workspaceId);
    if (filters.projectId) params.set('projectId', filters.projectId);
    hbmsApi.get(`/calendar?${params.toString()}`)
      .then((response) => {
        if (active) setEvents(response.data.data);
      })
      .catch((err) => toast.error(apiError(err, 'Could not load calendar')));
    return () => {
      active = false;
    };
  }, [view, cursor, workspaceId, filters.projectId, calendarNonce]);

  const applyFilters = async (event) => {
    event.preventDefault();
    try {
      await loadTasks(filters, workspaceId);
    } catch (err) {
      toast.error(apiError(err, 'Could not filter tasks'));
    }
  };

  const changeWorkspace = async (personId) => {
    setWorkspaceId(personId);
    setNewTask((current) => ({ ...current, assigneeId: personId || current.assigneeId }));
    setMeeting((current) => ({
      ...current,
      attendeeIds: personId ? [personId] : current.attendeeIds,
    }));
    try {
      await loadTasks(filters, personId);
    } catch (err) {
      toast.error(apiError(err, 'Could not open workspace'));
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post('/tasks', {
        title: newTask.title,
        description: newTask.description,
        projectId: newTask.projectId,
        priority: newTask.priority,
        startDate: newTask.startDate,
        dueDate: newTask.dueDate,
        assigneeIds: newTask.assigneeId ? [newTask.assigneeId] : [],
      });
      toast.success('Task assigned');
      setShowForm(false);
      setNewTask({ ...emptyTask, projectId: newTask.projectId, assigneeId: workspaceId || newTask.assigneeId, priority: newTask.priority });
      await refresh();
    } catch (err) {
      toast.error(apiError(err, 'Could not create task'));
    }
  };

  const moveTask = async (task, status) => {
    try {
      if (status === 'IN_REVIEW') {
        await hbmsApi.post(`/tasks/${task.id}/submit-review`);
        toast.success('Sent for review');
      } else if (status === 'DONE' && task.project?.requiresApproval !== false) {
        if (task.status !== 'IN_REVIEW') {
          toast.error('This project requires manager approval. Move the task to In Review first.');
          return;
        }
        await hbmsApi.post(`/tasks/${task.id}/review`, { decision: 'APPROVED' });
        toast.success('Work approved');
      } else {
        await hbmsApi.patch(`/tasks/${task.id}`, { status });
        toast.success(status === 'DONE' ? 'Task completed' : 'Task updated');
      }
      await refresh(detail?.id === task.id ? task.id : null);
    } catch (err) {
      toast.error(apiError(err, 'Could not update task'));
    }
  };

  const openTask = async (task) => {
    if (dragged.current) return;
    setSelectedId(task.id);
    try {
      await loadDetail(task.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not open task'));
    }
  };

  const saveDetails = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.patch(`/tasks/${detail.id}`, {
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        startDate: draft.startDate,
        dueDate: draft.dueDate,
        progress: Number(draft.progress),
      });
      toast.success('Task saved');
      await refresh(detail.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not save task'));
    }
  };

  const assign = async (employeeId) => {
    const current = new Set(detail.assignees.map((item) => item.employeeId));
    if (current.has(employeeId)) current.delete(employeeId);
    else current.add(employeeId);
    try {
      await hbmsApi.patch(`/tasks/${detail.id}`, { assigneeIds: [...current] });
      await refresh(detail.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not update assignees'));
    }
  };

  const addChecklist = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/tasks/${detail.id}/checklist`, { label: checkItem });
      setCheckItem('');
      await refresh(detail.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not add checklist item'));
    }
  };

  const pasteChecklist = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/tasks/${detail.id}/checklist`, { text: pastedSteps });
      setPastedSteps('');
      await refresh(detail.id);
      toast.success('Checklist added');
    } catch (err) {
      toast.error(apiError(err, 'Could not add the checklist'));
    }
  };

  const toggleCheck = async (item) => {
    try {
      await hbmsApi.patch(`/tasks/${detail.id}/checklist/${item.id}`, { done: !item.done });
      await refresh(detail.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not update checklist'));
    }
  };

  const addComment = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/tasks/${detail.id}/comments`, { body: comment });
      setComment('');
      await refresh(detail.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not add comment'));
    }
  };

  const uploadFile = async (event) => {
    event.preventDefault();
    const file = event.target.elements.file.files?.[0];
    if (!file) {
      toast.error('Choose a file');
      return;
    }
    const body = new FormData();
    body.append('title', file.name);
    body.append('file', file);
    try {
      await hbmsApi.post(`/tasks/${detail.id}/files`, body);
      event.target.reset();
      await refresh(detail.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not store file'));
    }
  };

  const review = async (decision) => {
    try {
      await hbmsApi.post(`/tasks/${detail.id}/review`, { decision, note: reviewNote });
      toast.success(decision === 'APPROVED' ? 'Work approved' : 'Changes requested');
      setReviewNote('');
      await refresh(detail.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not review task'));
    }
  };

  const scheduleMeeting = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post('/calendar/meetings', {
        title: meeting.title,
        startsAt: meeting.startsAt,
        projectId: meeting.projectId || null,
        attendeeIds: meeting.attendeeIds,
      });
      toast.success('Meeting scheduled');
      const when = new Date(meeting.startsAt);
      setSelectedDay(dateKey(when));
      setCursor(new Date(when.getFullYear(), when.getMonth(), 1));
      setCalendarNonce((value) => value + 1);
      setMeetingOpen(false);
      setMeeting({ title: '', startsAt: '', projectId: meeting.projectId, attendeeIds: workspaceId ? [workspaceId] : [] });
    } catch (err) {
      toast.error(apiError(err, 'Could not schedule meeting'));
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading tasks…</p>;
  if (error) return <Notice>{error}</Notice>;

  const visibleTasks = overdueOnly ? tasks.filter(isOverdue) : tasks;
  const openTasks = tasks.filter((task) => !['DONE', 'CANCELLED'].includes(task.status));
  const overdueCount = tasks.filter(isOverdue).length;
  const inReviewCount = tasks.filter((task) => task.status === 'IN_REVIEW').length;
  const doneCount = tasks.filter((task) => task.status === 'DONE').length;
  const blockedCount = tasks.filter((task) => task.status === 'BLOCKED').length;
  const counted = tasks.filter((task) => task.status !== 'CANCELLED');
  const completion = counted.length ? Math.round((doneCount / counted.length) * 100) : 0;
  const averageProgress = openTasks.length
    ? Math.round(openTasks.reduce((sum, task) => sum + Number(task.progress || 0), 0) / openTasks.length)
    : 0;
  const soonLimit = new Date();
  soonLimit.setDate(soonLimit.getDate() + 7);
  const soonKey = dateKey(soonLimit);
  const dueSoon = openTasks.filter((task) => task.dueDate && !isOverdue(task) && String(task.dueDate).slice(0, 10) <= soonKey).length;
  const pressing = openTasks.filter((task) => task.priority === 'URGENT' || task.priority === 'HIGH').length;
  const statusCounts = statusParts.map((part) => ({
    ...part,
    value: tasks.filter((task) => task.status === part.key).length,
  }));
  const statusTotal = statusCounts.reduce((sum, part) => sum + part.value, 0);
  const unitStats = ['HBLab', 'HBStudio'].map((name) => {
    const rows = openTasks.filter((task) => task.project?.businessUnit?.name === name);
    return { name, count: rows.length, color: name === 'HBStudio' ? '#7c3aed' : '#15803d' };
  });
  const workspaceWorker = workers.find((worker) => worker.id === workspaceId);
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const days = monthDays(cursor);
  const visibleIds = new Set(visibleTasks.map((task) => task.id));
  const calendarEvents = events.filter((event) => event.kind !== 'task' || visibleIds.has(event.taskId));
  const dayEvents = calendarEvents.filter((event) => eventDay(event) === selectedDay);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {workspaceWorker ? `${workerName(workspaceWorker)}'s tasks` : 'Tasks'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {linked
              ? `Signed in as ${linked.firstName} ${linked.lastName}.`
              : 'This login is not linked to a worker. Choose a person to see only their assignments.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-500 shadow-sm ring-1 ring-gray-100">{todayLabel}</span>
          <label className="text-xs font-medium text-gray-600">
            Workspace
            <select className={`${inputClass} mt-1 min-w-52`} value={workspaceId} onChange={(e) => changeWorkspace(e.target.value)}>
              <option value="">All work</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{workerName(worker)} · {worker.staffCode}</option>
              ))}
            </select>
          </label>
          <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setShowForm(true)}>
            New task
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[auto_1fr_220px] lg:items-center">
          <div className="flex items-center gap-3">
            <MiniRing percent={completion} color="#15803d" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Completed</p>
              <p className="text-xs text-gray-500">{doneCount} of {counted.length} finished</p>
              <p className="mt-1 text-xs text-gray-500">Open work is {averageProgress}% along</p>
            </div>
          </div>
          <div>
            <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
              {statusTotal === 0 ? <span className="h-full w-full bg-gray-100" /> : statusCounts.map((part) => (
                <span key={part.key} className="h-full" style={{ width: `${(part.value / statusTotal) * 100}%`, background: part.color }} />
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-5">
              {statusCounts.map((part) => (
                <li key={part.key} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="h-2 w-2 rounded-full" style={{ background: part.color }} />
                  <span>{part.label}</span>
                  <span className="font-semibold text-gray-900">{part.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            {unitStats.map((unit) => (
              <div key={unit.name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-800">{unit.name}</span>
                  <span className="text-gray-500">{unit.count} open</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <span className="block h-full rounded-full" style={{ width: `${openTasks.length ? (unit.count / openTasks.length) * 100 : 0}%`, background: unit.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon="carbon:task" value={openTasks.length} label="Open" detail={`${pressing} high or urgent`} tone="border-sky-100 bg-sky-50 text-sky-700" />
        <Stat icon="carbon:time" value={dueSoon} label="Due this week" detail="Open tasks inside 7 days" tone="border-amber-100 bg-amber-50 text-amber-700" />
        <Stat icon="carbon:warning-alt" value={overdueCount} label="Overdue" detail={blockedCount ? `${blockedCount} blocked` : 'Nothing blocked'} tone="border-red-100 bg-red-50 text-red-700" />
        <Stat icon="carbon:checkmark-outline" value={inReviewCount} label="In review" detail={`${doneCount} already done`} tone="border-violet-100 bg-violet-50 text-violet-700" />
      </div>

      <FormModal open={showForm} wide title="New task" subtitle="Assign the work to a person on the project." onClose={() => setShowForm(false)}>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={createTask}>
          <Field label="Title">
            <input className={inputClass} placeholder="Task title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required />
          </Field>
          <Field label="Project">
            <select className={inputClass} value={newTask.projectId} onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })} required>
              <option value="">Project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}
            </select>
          </Field>
          <Field label="Assignee">
            <select className={inputClass} value={newTask.assigneeId} onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {workers.map((worker) => <option key={worker.id} value={worker.id}>{workerName(worker)}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputClass} value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
              {taskPriorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Start">
            <input type="date" className={inputClass} value={newTask.startDate} onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })} />
          </Field>
          <Field label="Deadline">
            <input type="date" className={inputClass} value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <textarea className={inputClass} rows={3} value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end md:col-span-2">
            <PrimaryButton type="submit">Assign task</PrimaryButton>
          </div>
        </form>
      </FormModal>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <Segmented value={view} onChange={setView} options={views} />
        <form className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-6" onSubmit={applyFilters}>
          <input className={inputClass} placeholder="Search tasks" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          <select className={inputClass} value={filters.projectId} onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}>
            <option value="">All projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <select className={inputClass} value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All priorities</option>
            {taskPriorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select className={inputClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            {taskStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
            Overdue
          </label>
          <PrimaryButton type="submit">Filter</PrimaryButton>
        </form>
      </div>

      <div>
        <div>
          {view === 'board' && (
            visibleTasks.filter((task) => task.status !== 'CANCELLED').length === 0
              ? <Notice tone="empty">No tasks on the board. Assign work, or clear the overdue filter.</Notice>
              : (
                <div className="grid gap-3 md:grid-cols-4">
                  {columns.map((column) => {
                    const cards = visibleTasks.filter((task) => column.statuses.includes(task.status));
                    return (
                      <section
                        key={column.key}
                        className="rounded-3xl bg-[#f7faf8] p-2 ring-1 ring-gray-100"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          const taskId = event.dataTransfer.getData('text/plain');
                          const task = tasks.find((item) => item.id === taskId);
                          if (!task || task.status === column.key || (column.key === 'IN_PROGRESS' && task.status === 'BLOCKED')) return;
                          const next = column.key === 'IN_PROGRESS' ? 'IN_PROGRESS' : column.key;
                          moveTask(task, next);
                        }}
                      >
                        <h3 className="mb-2 flex items-center justify-between px-2 py-1.5">
                          <span className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                            <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                            {column.title}
                          </span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">{cards.length}</span>
                        </h3>
                        <div className="space-y-2">
                          {cards.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              selected={selectedId === task.id}
                              onOpen={() => openTask(task)}
                              onDragStart={(event) => {
                                dragged.current = true;
                                event.dataTransfer.setData('text/plain', task.id);
                              }}
                              onDragEnd={() => {
                                const swallowClick = (event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  window.removeEventListener('click', swallowClick, true);
                                };
                                window.addEventListener('click', swallowClick, true);
                                window.setTimeout(() => {
                                  window.removeEventListener('click', swallowClick, true);
                                  dragged.current = false;
                                }, 300);
                              }}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )
          )}

          {view === 'list' && (
            visibleTasks.length === 0 ? <Notice tone="empty">No tasks match these filters.</Notice> : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      {['Task', 'Project', 'Assignee', 'Priority', 'Status', 'Start', 'Deadline', 'Progress'].map((heading) => (
                        <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTasks.map((task) => (
                      <tr key={task.id} className={selectedId === task.id ? 'bg-green-50' : ''}>
                        <td className="px-3 py-2">
                          <button type="button" className="text-left font-medium text-gray-900" onClick={() => openTask(task)}>{task.title}</button>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{task.project?.code}</td>
                        <td className="px-3 py-2 text-gray-600">{task.assignees.map((item) => `${item.employee.firstName} ${item.employee.lastName}`).join(', ') || '—'}</td>
                        <td className="px-3 py-2"><StatusBadge value={task.priority} label={optionLabel(taskPriorityOptions, task.priority)} /></td>
                        <td className="px-3 py-2"><StatusBadge value={task.status} label={optionLabel(taskStatusOptions, task.status)} /></td>
                        <td className="px-3 py-2 text-gray-600">{formatDate(task.startDate)}</td>
                        <td className={`px-3 py-2 ${isOverdue(task) ? 'font-medium text-red-600' : 'text-gray-600'}`}>{formatDate(task.dueDate)}{isOverdue(task) ? ' · overdue' : ''}</td>
                        <td className="px-3 py-2 text-gray-600">{task.progress || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {view === 'calendar' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button type="button" className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>Previous</button>
                <h3 className="text-sm font-semibold text-gray-900">{cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
                <button type="button" className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>Next</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-gray-400">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const key = dateKey(day);
                  const items = calendarEvents.filter((event) => eventDay(event) === key);
                  const inMonth = day.getMonth() === cursor.getMonth();
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(key)}
                      className={`min-h-20 rounded-lg border p-1 text-left ${selectedDay === key ? 'border-green-500' : 'border-gray-200'} ${inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}`}
                    >
                      <span className="text-xs font-medium">{day.getDate()}</span>
                      <span className="mt-1 block space-y-0.5">
                        {items.slice(0, 3).map((event) => (
                          <span key={event.id} className={`block truncate rounded px-1 text-[10px] ${eventTone[event.kind]} ${event.kind === 'task' && isOverdue({ dueDate: event.date, status: event.status }) ? 'bg-red-100 text-red-700' : ''}`}>
                            {event.mark === 'start' ? 'Starts · ' : ''}{event.title}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
                <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-800">Task deadline</span>
                <span className="rounded bg-violet-100 px-2 py-0.5 text-violet-800">Meeting</span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">Milestone</span>
                <span className="rounded bg-green-100 px-2 py-0.5 text-green-800">Program</span>
                <span className="rounded bg-teal-100 px-2 py-0.5 text-teal-800">Training session</span>
              </div>
              <Panel title={formatDate(selectedDay)}>
                {dayEvents.length === 0 ? <Notice tone="empty">Nothing scheduled.</Notice> : (
                  <ul className="space-y-2 text-sm">
                    {dayEvents.map((event) => (
                      <li key={event.id}>
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => {
                            if (event.taskId) openTask({ id: event.taskId });
                          }}
                        >
                          <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] ${eventTone[event.kind]}`}>{event.kind}</span>
                          <span className="font-medium text-gray-900">{event.title}</span>
                          {event.project && <span className="ml-2 text-xs text-gray-500">{event.project.code}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" className="mt-4 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setMeetingOpen(true)}>Schedule meeting</button>
                <FormModal open={meetingOpen} title="Schedule a meeting" subtitle={formatDate(selectedDay)} onClose={() => setMeetingOpen(false)}>
                  <form className="grid gap-3" onSubmit={scheduleMeeting}>
                    <Field label="Title">
                      <input className={inputClass} placeholder="Meeting title" value={meeting.title} onChange={(e) => setMeeting({ ...meeting, title: e.target.value })} required />
                    </Field>
                    <Field label="Starts">
                      <input type="datetime-local" className={inputClass} value={meeting.startsAt} onChange={(e) => setMeeting({ ...meeting, startsAt: e.target.value })} required />
                    </Field>
                    <Field label="Project">
                      <select className={inputClass} value={meeting.projectId} onChange={(e) => setMeeting({ ...meeting, projectId: e.target.value })}>
                        <option value="">No project</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Attendee">
                      <select
                        className={inputClass}
                        value={meeting.attendeeIds[0] || ''}
                        onChange={(e) => setMeeting({ ...meeting, attendeeIds: e.target.value ? [e.target.value] : [] })}
                      >
                        <option value="">Attendee</option>
                        {workers.map((worker) => <option key={worker.id} value={worker.id}>{workerName(worker)}</option>)}
                      </select>
                    </Field>
                    <div className="flex justify-end">
                      <PrimaryButton type="submit">Schedule</PrimaryButton>
                    </div>
                  </form>
                </FormModal>
              </Panel>
            </div>
          )}
        </div>

        {detail && draft ? (
        <FormModal
          open
          wide
          title={detail.title || 'Task'}
          subtitle={detail.project ? `${detail.project.code} · ${detail.project.name}` : ''}
          onClose={() => { setDetail(null); setDraft(null); setSelectedId(null); }}
        >
            <div className="space-y-4 text-sm">
              <p className="text-gray-500">{detail.project?.code} · {detail.project?.name}</p>
              {isOverdue(detail) && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">This task is overdue.</p>}
              {detail.reviewNote && <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">Review note: {detail.reviewNote}</p>}
              <p className="text-xs text-gray-500">
                {detail.project?.requiresApproval === false
                  ? 'This project lets the assignee mark the task completed.'
                  : 'This project needs manager approval. The assignee can send it for review, and a manager completes it by approving the work.'}
              </p>

              <form className="space-y-2" onSubmit={saveDetails}>
                <Field label="Title">
                  <input className={inputClass} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
                </Field>
                <Field label="Description">
                  <textarea className={inputClass} rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Start">
                    <input type="date" className={inputClass} value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
                  </Field>
                  <Field label="Deadline">
                    <input type="date" className={inputClass} value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
                  </Field>
                </div>
                <Field label="Priority">
                  <select className={inputClass} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
                    {taskPriorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
                <Field label={`Progress ${draft.progress}%`}>
                  <input type="range" min="0" max="100" value={draft.progress} onChange={(e) => setDraft({ ...draft, progress: e.target.value })} />
                </Field>
                <PrimaryButton type="submit">Save</PrimaryButton>
              </form>

              <Field label="Status">
                <select
                  className={inputClass}
                  value={['TODO', 'IN_PROGRESS', 'BLOCKED', 'CANCELLED', ...(detail.project?.requiresApproval === false ? ['DONE'] : [])].includes(detail.status) ? detail.status : ''}
                  onChange={(e) => moveTask(detail, e.target.value)}
                >
                  {!['TODO', 'IN_PROGRESS', 'BLOCKED', 'CANCELLED'].includes(detail.status) && detail.status !== 'DONE' && <option value="">In review</option>}
                  {detail.status === 'DONE' && detail.project?.requiresApproval !== false && <option value="">Completed</option>}
                  {['TODO', 'IN_PROGRESS', 'BLOCKED', 'CANCELLED'].map((status) => (
                    <option key={status} value={status}>{optionLabel(taskStatusOptions, status)}</option>
                  ))}
                  {detail.project?.requiresApproval === false && <option value="DONE">Completed</option>}
                </select>
              </Field>

              <div className="flex flex-wrap gap-2">
                {detail.project?.requiresApproval !== false && ['TODO', 'IN_PROGRESS', 'BLOCKED'].includes(detail.status) && (
                  <button type="button" className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700" onClick={() => moveTask(detail, 'IN_REVIEW')}>Ready for review</button>
                )}
                {detail.project?.requiresApproval === false && !['DONE', 'CANCELLED'].includes(detail.status) && (
                  <button type="button" className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700" onClick={() => moveTask(detail, 'DONE')}>Mark completed</button>
                )}
                {detail.status === 'IN_REVIEW' && (
                  <>
                    <button type="button" className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700" onClick={() => review('APPROVED')}>Approve</button>
                    <button type="button" className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700" onClick={() => review('CHANGES_REQUESTED')}>Request changes</button>
                  </>
                )}
              </div>
              {detail.status === 'IN_REVIEW' && (
                <Field label="Review note">
                  <input className={inputClass} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
                </Field>
              )}

              <div>
                <p className="mb-1 text-xs font-medium text-gray-600">Assignees</p>
                <div className="flex flex-wrap gap-1">
                  {workers.map((worker) => {
                    const active = detail.assignees.some((item) => item.employeeId === worker.id);
                    return (
                      <button key={worker.id} type="button" onClick={() => assign(worker.id)} className={`rounded-full px-2 py-1 text-xs ${active ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        {workerName(worker)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-gray-600">Checklist</p>
                {(detail.checklist || []).length === 0 ? <p className="text-xs text-gray-500">No steps yet.</p> : (
                  <ul className="space-y-1">
                    {detail.checklist.map((item) => (
                      <li key={item.id}>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={item.done} onChange={() => toggleCheck(item)} />
                          <span className={item.done ? 'text-gray-400 line-through' : 'text-gray-800'}>{item.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                <form className="mt-2 flex gap-2" onSubmit={addChecklist}>
                  <input className={inputClass} value={checkItem} onChange={(e) => setCheckItem(e.target.value)} placeholder="Add a step" required />
                  <PrimaryButton type="submit">Add</PrimaryButton>
                </form>
                <form className="mt-2 space-y-2" onSubmit={pasteChecklist}>
                  <textarea className={inputClass} rows={5} value={pastedSteps} onChange={(e) => setPastedSteps(e.target.value)} placeholder={'Paste one step per line. Bullets are removed.\n• School application.\n• School profile.'} required />
                  <PrimaryButton type="submit">Add each line</PrimaryButton>
                </form>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-gray-600">Files</p>
                {(detail.files || []).length === 0 ? <p className="text-xs text-gray-500">No files yet.</p> : (
                  <ul className="space-y-1">
                    {detail.files.map((file) => (
                      <li key={file.id}>
                        <a className="text-green-800 hover:underline" href={`http://localhost:3000${file.fileUrl}`} target="_blank" rel="noreferrer">{file.title}</a>
                      </li>
                    ))}
                  </ul>
                )}
                <form className="mt-2 space-y-2" onSubmit={uploadFile}>
                  <input name="file" type="file" className="text-sm" />
                  <PrimaryButton type="submit">Upload</PrimaryButton>
                </form>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-gray-600">Comments</p>
                {(detail.comments || []).length === 0 ? <p className="text-xs text-gray-500">No comments yet.</p> : (
                  <ul className="space-y-2">
                    {detail.comments.map((item) => (
                      <li key={item.id} className="rounded-lg bg-gray-50 px-3 py-2">
                        <p>{item.body}</p>
                        <p className="text-[11px] text-gray-500">{item.author ? `${item.author.firstName} ${item.author.lastName}` : 'Admin'} · {formatDate(item.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <form className="mt-2 flex gap-2" onSubmit={addComment}>
                  <input className={inputClass} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment" required />
                  <PrimaryButton type="submit">Send</PrimaryButton>
                </form>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-gray-600">History</p>
                {(detail.events || []).length === 0 ? <p className="text-xs text-gray-500">No changes yet.</p> : (
                  <ul className="space-y-2">
                    {detail.events.map((item) => (
                      <li key={item.id}>
                        <p>{item.message}</p>
                        <p className="text-[11px] text-gray-500">{formatWhen(item.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
        </FormModal>
        ) : null}
      </div>
    </div>
  );
};

export default HbmsTasks;
