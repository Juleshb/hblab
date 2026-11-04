import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import hbmsApi, { apiError } from './api';
import { Field, FormModal, Notice, PrimaryButton, WorkerAvatar, inputClass } from './ui';

const roleIcon = {
  SUPER_ADMIN: 'carbon:security',
  CEO: 'carbon:building',
  DEPARTMENT_MANAGER: 'carbon:enterprise',
  PROJECT_MANAGER: 'carbon:folder',
  HR: 'carbon:id-management',
  PROGRAM_COORDINATOR: 'carbon:education',
  TRAINER: 'carbon:presentation-file',
  WORKER: 'carbon:user',
  INTERN: 'carbon:education',
  CLIENT: 'carbon:partnership',
};

const tabLabel = {
  overview: 'Dashboard',
  organization: 'Departments',
  workers: 'Workers',
  projects: 'Projects',
  programs: 'Programs',
  tasks: 'Tasks',
  attendance: 'Attendance',
  messages: 'Meetings',
  documents: 'Documents',
  reports: 'Reports',
  roles: 'Roles',
};

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase() || '•';
}

function Metric({ icon, value, label, detail, tone }) {
  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${tone}`}>
      <Icon icon={icon} className="h-5 w-5" />
      <p className="mt-3 text-2xl font-semibold leading-none text-gray-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{label}</p>
      <p className="text-xs text-gray-500">{detail}</p>
    </article>
  );
}

const HbmsRoles = () => {
  const [directory, setDirectory] = useState(null);
  const [userId, setUserId] = useState('');
  const [roles, setRoles] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [clientProjectIds, setClientProjectIds] = useState([]);
  const [departmentIds, setDepartmentIds] = useState([]);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const response = await hbmsApi.get('/access/directory');
    setDirectory(response.data.data);
    return response.data.data;
  };

  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (!active) return;
        const first = data.users[0];
        if (first) selectUser(first, data);
      })
      .catch((err) => {
        if (active) setError(apiError(err, 'Could not load roles'));
      });
    return () => {
      active = false;
    };
  }, []);

  const selectUser = (user, data = directory) => {
    setUserId(String(user.id));
    setRoles(user.roles.filter((role) => role !== 'SUPER_ADMIN' || user.lockedSuperAdmin));
    setEmployeeId(user.employee?.id || '');
    setClientProjectIds(user.clientProjectIds || []);
    const managed = (data?.departments || []).filter((department) => department.managerId && user.employee && department.managerId === user.employee.id).map((department) => department.id);
    setDepartmentIds(managed);
    setPreview(null);
  };

  const current = directory?.users.find((user) => String(user.id) === String(userId));

  const toggle = (list, setList, id) => {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await hbmsApi.put(`/access/users/${userId}`, {
        roles,
        employeeId: employeeId || null,
        clientProjectIds,
        departmentIds,
      });
      const data = await load();
      const next = data.users.find((user) => String(user.id) === String(userId));
      if (next) selectUser(next, data);
      toast.success('Roles saved');
      setOpen(false);
    } catch (err) {
      setError(apiError(err, 'Could not save roles'));
    } finally {
      setSaving(false);
    }
  };

  const showPreview = async (id) => {
    try {
      const response = await hbmsApi.get(`/access/preview/${id}`);
      setPreview(response.data.data);
    } catch (err) {
      toast.error(apiError(err, 'Could not preview access'));
    }
  };

  const editUser = (user) => {
    selectUser(user);
    setOpen(true);
  };

  if (!directory && !error) return <p className="text-sm text-gray-500">Loading roles…</p>;

  const today = new Date();
  const holders = directory?.users.filter((user) => user.roles.length) || [];
  const roleCounts = Object.fromEntries((directory?.roles || []).map((role) => [
    role.role,
    holders.filter((user) => user.roles.includes(role.role)).length,
  ]));
  const busiest = Math.max(1, ...Object.values(roleCounts), 1);
  const linkedWorkers = directory?.employees.filter((worker) => worker.userId).length || 0;
  const managedDepartments = directory?.departments.filter((department) => department.managerId).length || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-white shadow-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{today.toLocaleDateString('en-US', { month: 'short' })}</span>
            <span className="text-lg font-semibold leading-none text-gray-900">{today.getDate()}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Roles and responsibilities</h2>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">A person can hold more than one role. A department manager does not see confidential HR records or every project in the other business unit.</p>
          </div>
        </div>
        <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setOpen(true)}>Assign roles</button>
      </div>
      {error ? <Notice>{error}</Notice> : null}
      <FormModal open={open} wide title="Assign roles" subtitle="A person can hold more than one role." onClose={() => setOpen(false)}>
        {directory ? (
          <form className="space-y-4" onSubmit={save}>
            <Field label="User">
              <select
                className={inputClass}
                value={userId}
                onChange={(event) => {
                  const user = directory.users.find((item) => String(item.id) === event.target.value);
                  if (user) selectUser(user);
                }}
              >
                {directory.users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name || user.email} · {user.email}</option>
                ))}
              </select>
            </Field>
            {current?.lockedSuperAdmin ? (
              <p className="text-xs text-gray-500">This account is the application administrator, so super administrator access stays on.</p>
            ) : null}
            <fieldset>
              <legend className="text-xs font-medium text-gray-600">Roles</legend>
              <div className="mt-2 space-y-2">
                {directory.roles.map((role) => {
                  const locked = role.role === 'SUPER_ADMIN' && current?.lockedSuperAdmin;
                  const checked = roles.includes(role.role) || locked;
                  return (
                    <label key={role.role} className="flex items-start gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        disabled={locked || (role.role === 'SUPER_ADMIN' && !current?.lockedSuperAdmin)}
                        onChange={() => toggle(roles, setRoles, role.role)}
                      />
                      <span>
                        <span className="font-medium">{role.label}</span>
                        <span className="block text-xs text-gray-500">{role.detail}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <Field label="Linked worker">
              <select className={inputClass} value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
                <option value="">No worker profile</option>
                {directory.employees.map((worker) => (
                  <option key={worker.id} value={worker.id}>{worker.staffCode} · {worker.firstName} {worker.lastName}</option>
                ))}
              </select>
            </Field>
            {roles.includes('DEPARTMENT_MANAGER') ? (
              <fieldset>
                <legend className="text-xs font-medium text-gray-600">Departments this manager runs</legend>
                <div className="mt-2 space-y-1">
                  {directory.departments.map((department) => (
                    <label key={department.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={departmentIds.includes(department.id)} onChange={() => toggle(departmentIds, setDepartmentIds, department.id)} />
                      {department.businessUnit.name} · {department.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {roles.includes('CLIENT') ? (
              <fieldset>
                <legend className="text-xs font-medium text-gray-600">Projects this client can view</legend>
                <div className="mt-2 space-y-1">
                  {directory.projects.map((project) => (
                    <label key={project.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={clientProjectIds.includes(project.id)} onChange={() => toggle(clientProjectIds, setClientProjectIds, project.id)} />
                      {project.code} · {project.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <div className="flex justify-end">
              <PrimaryButton type="submit" disabled={saving || !userId}>{saving ? 'Saving…' : 'Save roles'}</PrimaryButton>
            </div>
          </form>
        ) : null}
      </FormModal>

      {directory ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric tone="border-emerald-100 bg-emerald-50 text-emerald-700" icon="carbon:user-role" value={holders.length} label="People with access" detail={directory.users.length - holders.length === 1 ? '1 account has no HBMS role' : `${directory.users.length - holders.length} accounts have no HBMS role`} />
            <Metric tone="border-sky-100 bg-sky-50 text-sky-700" icon="carbon:catalog" value={Object.values(roleCounts).filter(Boolean).length} label="Roles in use" detail={`${directory.roles.length} defined`} />
            <Metric tone="border-violet-100 bg-violet-50 text-violet-700" icon="carbon:group" value={linkedWorkers} label="Workers linked" detail={directory.employees.length - linkedWorkers === 1 ? '1 still without a login' : `${directory.employees.length - linkedWorkers} still without a login`} />
            <Metric tone="border-amber-100 bg-amber-50 text-amber-700" icon="carbon:enterprise" value={managedDepartments} label="Departments with a manager" detail={directory.departments.length - managedDepartments === 1 ? '1 without a manager' : `${directory.departments.length - managedDepartments} without a manager`} />
          </div>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">What each role is responsible for</h3>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {directory.roles.map((role) => {
                const count = roleCounts[role.role] || 0;
                return (
                  <article key={role.role} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <Icon icon={roleIcon[role.role] || 'carbon:user'} className="h-5 w-5" />
                        </span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{role.label}</h4>
                          <p className="text-xs text-gray-500">{count === 1 ? '1 person' : `${count} people`}</p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-700">{role.detail}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.round((count / busiest) * 100)}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {preview ? (
            <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-emerald-700">{preview.worker.staffCode}</p>
                  <h3 className="text-lg font-semibold text-gray-900">{preview.worker.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{preview.worker.linked ? 'This login is linked to the worker profile.' : 'No login yet. This is the scope that applies once an account is linked.'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${preview.confidentialHr ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                  {preview.confidentialHr ? 'Confidential HR' : 'No confidential HR'}
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">Projects</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {preview.seesEveryProject
                      ? 'Both business units'
                      : (preview.projects.length
                        ? preview.projects.map((project) => `${project.code} · ${project.businessUnit.name}`).join(', ')
                        : 'None in scope')}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">Screens</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(preview.access?.tabs || []).map((tab) => (
                      <span key={tab} className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-700">{tabLabel[tab] || tab}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h3 className="font-semibold text-gray-900">Who holds them</h3>
            {holders.map((user) => {
              const worker = user.employee;
              const departments = worker
                ? directory.departments.filter((department) => department.managerId === worker.id)
                : [];
              const clientProjects = directory.projects.filter((project) => (user.clientProjectIds || []).includes(project.id));
              const selected = preview && worker && preview.worker.id === worker.id;
              return (
                <article key={user.id} className={`rounded-3xl border bg-white p-4 shadow-sm ${selected ? 'border-emerald-300' : 'border-gray-100'}`}>
                  <div className="flex flex-wrap items-start gap-3">
                    {worker ? (
                      <WorkerAvatar worker={worker} className="h-11 w-11 shrink-0 rounded-2xl bg-emerald-100 text-sm font-semibold text-emerald-800" />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-semibold text-emerald-800">{initials(user.name || user.email)}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-semibold text-gray-900">{user.name || user.email}</h4>
                        <div className="flex gap-2">
                          {worker ? (
                            <button type="button" className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700" onClick={() => showPreview(worker.id)}>View scope</button>
                          ) : null}
                          <button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => editUser(user)}>Edit</button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{user.email}{worker ? ` · ${worker.staffCode}` : ' · No worker profile'}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {user.roles.map((role) => {
                          const info = directory.roles.find((item) => item.role === role);
                          return <span key={role} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">{info?.label || role}</span>;
                        })}
                      </div>
                      {departments.length ? (
                        <p className="mt-2 text-xs text-gray-600">Runs {departments.map((department) => `${department.businessUnit.name} · ${department.name}`).join(', ')}</p>
                      ) : null}
                      {clientProjects.length ? (
                        <p className="mt-1 text-xs text-gray-600">Client of {clientProjects.map((project) => project.code).join(', ')}</p>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      ) : null}
    </div>
  );
};

export default HbmsRoles;
