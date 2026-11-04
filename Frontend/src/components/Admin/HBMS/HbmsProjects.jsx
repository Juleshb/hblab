import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import hbmsApi, { apiError, formatDate, optionLabel, projectCategoryOptions, projectStatusOptions } from './api';
import { Field, FormModal, Notice, PrimaryButton, StatusBadge, WorkerAvatar, inputClass } from './ui';

const statusParts = [
  { key: 'PLANNING', label: 'Planning', color: '#64748b' },
  { key: 'ACTIVE', label: 'Active', color: '#15803d' },
  { key: 'ON_HOLD', label: 'On hold', color: '#d97706' },
  { key: 'COMPLETED', label: 'Completed', color: '#0284c7' },
  { key: 'CANCELLED', label: 'Cancelled', color: '#94a3b8' },
];

function localKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function unitColor(name) {
  return name === 'HBStudio' ? '#7c3aed' : '#15803d';
}

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

const emptyForm = {
  name: '',
  businessUnitId: '',
  managerId: '',
  status: 'PLANNING',
  category: 'SOFTWARE',
  startDate: '',
  endDate: '',
  clientName: '',
  clientContactName: '',
  clientEmail: '',
  clientPhone: '',
  description: '',
  budgetAmount: '',
  departmentIds: [],
  requiresApproval: true,
};

const HbmsProjects = () => {
  const [projects, setProjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [canCreateProject, setCanCreateProject] = useState(false);

  const load = async () => {
    const [projectRes, unitRes, workerRes, accessRes] = await Promise.all([
      hbmsApi.get('/projects?limit=100'),
      hbmsApi.get('/business-units'),
      hbmsApi.get('/employees?limit=100&status=ACTIVE'),
      hbmsApi.get('/access/me'),
    ]);
    setCanCreateProject(Boolean(accessRes.data.data?.canCreateProject));
    setProjects(projectRes.data.data);
    setUnits(unitRes.data.data);
    setWorkers(workerRes.data.data);
    setForm((current) => ({
      ...current,
      businessUnitId: current.businessUnitId || unitRes.data.data[0]?.id || '',
    }));
  };

  useEffect(() => {
    let active = true;
    load()
      .catch((err) => {
        if (active) setError(apiError(err, 'Could not load projects'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const createProject = async (event) => {
    event.preventDefault();
    try {
      const response = await hbmsApi.post('/projects', {
        ...form,
        managerId: form.managerId || null,
        budgetAmount: form.budgetAmount || null,
      });
      toast.success(`Project ${response.data.data.code} created`);
      setShowForm(false);
      setForm({ ...emptyForm, businessUnitId: form.businessUnitId, category: form.category, departmentIds: [] });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not create project'));
    }
  };

  const toggleDepartment = (departmentId) => {
    setForm((current) => ({
      ...current,
      departmentIds: current.departmentIds.includes(departmentId)
        ? current.departmentIds.filter((id) => id !== departmentId)
        : [...current.departmentIds, departmentId],
    }));
  };

  const visibleProjects = projects.filter((project) => {
    const text = query.trim().toLowerCase();
    if (statusFilter && project.status !== statusFilter) return false;
    if (text && !`${project.name} ${project.code} ${project.clientName || ''}`.toLowerCase().includes(text)) return false;
    return true;
  });
  const counted = projects.filter((project) => project.status !== 'CANCELLED');
  const activeProjects = projects.filter((project) => project.status === 'ACTIVE');
  const planningCount = projects.filter((project) => project.status === 'PLANNING').length;
  const holdCount = projects.filter((project) => project.status === 'ON_HOLD').length;
  const average = counted.length
    ? Math.round(counted.reduce((sum, project) => sum + Number(project.progress || 0), 0) / counted.length)
    : 0;
  const today = localKey();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 30);
  const horizonKey = localKey(horizon);
  const upcoming = counted.filter((project) => {
    if (!project.endDate || ['COMPLETED', 'CANCELLED'].includes(project.status)) return false;
    const due = localKey(project.endDate);
    return due >= today && due <= horizonKey;
  });
  const budgeted = counted.filter((project) => project.budgetAmount != null);
  const budgetTotal = budgeted.reduce((sum, project) => sum + Number(project.budgetAmount || 0), 0);
  const statusCounts = statusParts.map((part) => ({
    ...part,
    value: projects.filter((project) => project.status === part.key).length,
  }));
  const statusTotal = statusCounts.reduce((sum, part) => sum + part.value, 0);
  const live = projects.filter((project) => !['COMPLETED', 'CANCELLED'].includes(project.status));
  const unitStats = ['HBLab', 'HBStudio'].map((name) => ({
    name,
    count: live.filter((project) => project.businessUnit?.name === name).length,
    color: unitColor(name),
  }));
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  if (loading) return <p className="text-sm text-gray-500">Loading projects…</p>;
  if (error) return <Notice>{error}</Notice>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
          <p className="mt-1 text-sm text-gray-500">Client work stays with its business unit.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs text-gray-500 shadow-sm ring-1 ring-gray-100">{todayLabel}</span>
          <input className={`${inputClass} !w-44`} placeholder="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className={`${inputClass} !w-40`} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {projectStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {canCreateProject ? (
            <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setShowForm(true)}>
              New project
            </button>
          ) : null}
        </div>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[auto_1fr_220px] lg:items-center">
          <div className="flex items-center gap-3">
            <MiniRing percent={average} color="#15803d" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Average progress</p>
              <p className="text-xs text-gray-500">{counted.length} project{counted.length === 1 ? '' : 's'} in view</p>
              <p className="mt-1 text-xs text-gray-500">{activeProjects.length} currently active</p>
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
                  <span className="block h-full rounded-full" style={{ width: `${live.length ? (unit.count / live.length) * 100 : 0}%`, background: unit.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon="carbon:folder" value={activeProjects.length} label="Active" detail={`${holdCount} on hold`} tone="border-emerald-100 bg-emerald-50 text-emerald-700" />
        <Stat icon="carbon:plan" value={planningCount} label="Planning" detail="Not started yet" tone="border-slate-200 bg-slate-50 text-slate-700" />
        <Stat icon="carbon:calendar" value={upcoming.length} label="Due in 30 days" detail={upcoming[0] ? upcoming[0].name : 'No dated deadline'} tone="border-amber-100 bg-amber-50 text-amber-700" />
        <Stat icon="carbon:currency" value={budgeted.length ? budgetTotal.toLocaleString() : '—'} label="Budget, RWF" detail={`${budgeted.length} project${budgeted.length === 1 ? '' : 's'} with a budget`} tone="border-violet-100 bg-violet-50 text-violet-700" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleProjects.length === 0 ? (
          <Notice tone="empty">No HBMS projects yet. Create one for HBLab or HBStudio.</Notice>
        ) : visibleProjects.map((project) => {
          const studio = project.businessUnit?.name === 'HBStudio';
          const due = project.endDate ? localKey(project.endDate) : '';
          const late = due && due < today && !['COMPLETED', 'CANCELLED'].includes(project.status);
          return (
            <Link key={project.id} to={`/admin/hbms/projects/${project.id}`} className="flex flex-col rounded-3xl border border-gray-100 bg-white p-4 shadow-sm hover:border-emerald-200">
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${studio ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {project.code}
                </span>
                <StatusBadge value={project.status} label={optionLabel(projectStatusOptions, project.status)} />
              </div>
              <p className="mt-3 font-semibold text-gray-900">{project.name}</p>
              <p className="mt-1 text-xs text-gray-500">
                {optionLabel(projectCategoryOptions, project.category)} · {project.businessUnit?.name}
              </p>
              <p className="mt-2 text-sm text-gray-700">{project.clientName || 'Internal project'}</p>
              {project.clientContactName || project.clientEmail ? (
                <p className="mt-1 text-xs text-gray-500">
                  {[project.clientContactName, project.clientEmail, project.clientPhone].filter(Boolean).join(' · ')}
                </p>
              ) : null}
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>{project._count.tasks} tasks · {project._count.members} members</span>
                  <span className="font-semibold text-gray-800">{project.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: unitColor(project.businessUnit?.name) }} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${late ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                  {project.endDate ? `${late ? 'Overdue' : 'Due'} · ${formatDate(project.endDate)}` : 'No deadline'}
                </span>
                {project.manager ? (
                  <span className="flex items-center gap-1.5 text-xs text-gray-600">
                    <WorkerAvatar worker={project.manager} className="h-6 w-6 rounded-full bg-emerald-100 text-[10px] text-emerald-800" />
                    {project.manager.firstName}
                  </span>
                ) : <span className="text-xs text-gray-400">No manager</span>}
              </div>
            </Link>
          );
        })}
      </div>
      <FormModal open={showForm} wide title="New project" subtitle="The project stays with one business unit. Departments from either unit can collaborate." onClose={() => setShowForm(false)}>
        <form className="space-y-3" onSubmit={createProject}>
          <Field label="Name">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Business unit">
            <select className={inputClass} value={form.businessUnitId} onChange={(e) => setForm({ ...form, businessUnitId: e.target.value, managerId: '' })}>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
          </Field>
          <Field label="Manager">
            <select className={inputClass} value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
              <option value="">Unassigned</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{worker.firstName} {worker.lastName} · {worker.businessUnit?.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {projectStatusOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {projectCategoryOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Start">
              <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="End">
              <input type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Client">
            <input className={inputClass} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
          </Field>
          <Field label="Client contact">
            <input className={inputClass} placeholder="Contact name" value={form.clientContactName} onChange={(e) => setForm({ ...form, clientContactName: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Contact email">
              <input type="email" className={inputClass} value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
            </Field>
            <Field label="Contact phone">
              <input className={inputClass} value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} />
            </Field>
          </div>
          <Field label="Budget (RWF)">
            <input className={inputClass} inputMode="numeric" placeholder="2500000" value={form.budgetAmount} onChange={(e) => setForm({ ...form, budgetAmount: e.target.value })} />
          </Field>
          <Field label="Departments involved">
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {units.map((unit) => (
                <div key={unit.id}>
                  <p className="text-xs font-medium text-gray-500">{unit.name}</p>
                  {unit.departments.map((department) => (
                    <label key={department.id} className="flex items-center gap-2 py-0.5 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={form.departmentIds.includes(department.id)}
                        onChange={() => toggleDepartment(department.id)}
                      />
                      {department.name}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </Field>
          <label className="flex items-start gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.requiresApproval}
              onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
            />
            <span>Manager must approve work before a task can be completed</span>
          </label>
          <Field label="Scope">
            <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="flex justify-end border-t border-gray-100 pt-3">
            <PrimaryButton type="submit">Create project</PrimaryButton>
          </div>
        </form>
      </FormModal>
    </div>
  );
};

export default HbmsProjects;
