import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import hbmsApi, { apiError } from './api';
import { Field, FormModal, Notice, PrimaryButton, inputClass } from './ui';

const statTones = {
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  sky: 'border-sky-100 bg-sky-50 text-sky-700',
  violet: 'border-violet-100 bg-violet-50 text-violet-700',
  amber: 'border-amber-100 bg-amber-50 text-amber-700',
};

const labColors = ['#15803d', '#22c55e', '#0f766e', '#65a30d', '#047857', '#4ade80'];
const studioColors = ['#7c3aed', '#a78bfa', '#6d28d9', '#8b5cf6', '#5b21b6', '#c4b5fd'];

function departmentIcon(name) {
  const key = String(name || '').toLowerCase();
  const known = [
    ['software', 'carbon:code'],
    ['admin', 'carbon:building'],
    ['network', 'carbon:network-3'],
    ['support', 'carbon:network-3'],
    ['sales', 'carbon:shopping-cart'],
    ['training', 'carbon:education'],
    ['intern', 'carbon:education'],
    ['content', 'carbon:edit'],
    ['marketing', 'carbon:growth'],
    ['stream', 'carbon:video'],
    ['photo', 'carbon:camera'],
    ['podcast', 'carbon:microphone'],
    ['video', 'carbon:video'],
  ];
  return known.find(([word]) => key.includes(word))?.[1] || 'carbon:enterprise';
}

function initials(person) {
  if (!person) return '';
  return `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`.toUpperCase();
}

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

const HbmsOrganization = () => {
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [departmentForm, setDepartmentForm] = useState({ name: '', businessUnitId: '', managerId: '' });
  const [editing, setEditing] = useState(null);
  const [deptOpen, setDeptOpen] = useState(false);
  const [posOpen, setPosOpen] = useState(false);
  const [positionTitle, setPositionTitle] = useState('');
  const [positionResponsibilities, setPositionResponsibilities] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [unitRes, positionRes, employeeRes] = await Promise.all([
        hbmsApi.get('/business-units'),
        hbmsApi.get('/positions'),
        hbmsApi.get('/employees?limit=100'),
      ]);
      setUnits(unitRes.data.data);
      setPositions(positionRes.data.data);
      setEmployees(employeeRes.data.data);
      setDepartmentForm((current) => ({
        ...current,
        businessUnitId: current.businessUnitId || unitRes.data.data[0]?.id || '',
      }));
    } catch (err) {
      setError(apiError(err, 'Could not load organization'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addDepartment = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post('/departments', {
        name: departmentForm.name,
        businessUnitId: departmentForm.businessUnitId,
        managerId: departmentForm.managerId || null,
      });
      toast.success('Department added');
      setDeptOpen(false);
      setDepartmentForm((current) => ({ ...current, name: '', managerId: '' }));
      load();
    } catch (err) {
      toast.error(apiError(err, 'Could not add department'));
    }
  };

  const saveDepartment = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.patch(`/departments/${editing.id}`, {
        name: editing.name,
        managerId: editing.managerId || null,
      });
      toast.success('Department updated');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(apiError(err, 'Could not update department'));
    }
  };

  const removeDepartment = async (department) => {
    const people = department._count.employees;
    const warning = people
      ? `${people} ${people === 1 ? 'person stays' : 'people stay'} on staff and lose this as their primary department.`
      : 'This department has no primary staff.';
    if (!window.confirm(`Remove ${department.name}? ${warning}`)) return;
    try {
      await hbmsApi.delete(`/departments/${department.id}`);
      toast.success('Department removed');
      if (editing?.id === department.id) setEditing(null);
      load();
    } catch (err) {
      toast.error(apiError(err, 'Could not remove department'));
    }
  };

  const addPosition = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post('/positions', {
        title: positionTitle,
        responsibilities: positionResponsibilities,
      });
      toast.success('Position added');
      setPosOpen(false);
      setPositionTitle('');
      setPositionResponsibilities('');
      load();
    } catch (err) {
      toast.error(apiError(err, 'Could not add position'));
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading organization…</p>;
  if (error) return <Notice>{error}</Notice>;

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const departments = units.flatMap((unit) => unit.departments.map((department) => ({ ...department, unit })));
  const staffTotal = employees.length;
  const placed = employees.filter((person) => person.departmentId || person.department?.id).length;
  const managed = departments.filter((department) => department.manager).length;
  const largest = Math.max(1, ...departments.map((department) => department._count.employees));
  const unitCards = units.map((unit) => {
    const studio = unit.name === 'HBStudio';
    const colors = studio ? studioColors : labColors;
    const parts = unit.departments.map((department, index) => ({
      label: department.name,
      value: department._count.employees,
      color: colors[index % colors.length],
    }));
    return { unit, studio, colors, parts, staff: unit._count?.employees || 0 };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Departments</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">Each business unit keeps its own departments. A person still has one primary department.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-right shadow-sm">
            <p className="text-sm font-medium text-gray-800">{todayLabel}</p>
          </div>
          <button type="button" className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-800" onClick={() => setPosOpen(true)}>Add position</button>
          <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setDeptOpen(true)}>Add department</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatTile tone="emerald" icon="carbon:enterprise" value={departments.length} label="Departments" detail={unitCards.map((card) => `${card.unit.departments.length} ${card.unit.name}`).join(' · ') || 'None yet'} />
        <StatTile tone="sky" icon="carbon:group" value={staffTotal} label="People" detail={`${placed} placed in a department`} />
        <StatTile tone="violet" icon="carbon:user-role" value={positions.length} label="Positions" detail="Shared by both business units" />
        <StatTile tone="amber" icon="carbon:user-follow" value={managed} label="With a manager" detail={managed === departments.length ? 'Every department has one' : `${departments.length - managed} without a manager`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {unitCards.map(({ unit, studio, parts, staff }) => {
          const peak = Math.max(1, ...unit.departments.map((department) => department._count.employees));
          return (
            <section key={unit.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${studio ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'}`}>{unit.name}</span>
                  <h3 className="mt-2 font-semibold text-gray-900">{unit.departments.length} departments</h3>
                  <p className="mt-1 text-xs text-gray-500">{unit.description || `${staff} people · ${unit._count?.projects || 0} projects`}</p>
                </div>
                <SplitRing parts={parts.length ? parts : [{ label: unit.name, value: 1, color: studio ? '#7c3aed' : '#15803d' }]} total={staff} caption="people" />
              </div>
              {unit.departments.length === 0 ? (
                <Notice tone="empty">No departments yet.</Notice>
              ) : (
                <ul className="mt-2 space-y-2">
                  {unit.departments.map((department, index) => {
                    const share = Math.round((department._count.employees / peak) * 100);
                    const color = parts[index]?.color || '#15803d';
                    return (
                      <li key={department.id} className="rounded-2xl bg-gray-50 px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-gray-700 shadow-sm">
                            <Icon icon={departmentIcon(department.name)} className="h-5 w-5" style={{ color }} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900">{department.name}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                              {department.manager ? (
                                <>
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-gray-700">{initials(department.manager)}</span>
                                  {department.manager.firstName} {department.manager.lastName}
                                </>
                              ) : 'No manager assigned'}
                            </p>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                              <div className="h-full rounded-full" style={{ width: `${Math.max(share, department._count.employees ? 8 : 0)}%`, backgroundColor: color }} />
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-gray-900">{department._count.employees}</p>
                            <span className="mt-1 flex justify-end gap-2 text-xs font-medium">
                              <button type="button" className="text-emerald-700" onClick={() => setEditing({ id: department.id, name: department.name, managerId: department.managerId || '' })}>Edit</button>
                              <button type="button" className="text-red-600" onClick={() => removeDepartment(department)}>Remove</button>
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">People by department</h3>
          <p className="mt-1 text-xs text-gray-500">Primary department only. Green is HBLab, violet is HBStudio.</p>
          {departments.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Departments appear here after you add one.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {[...departments].sort((a, b) => b._count.employees - a._count.employees).map((department) => {
                const studio = department.unit.name === 'HBStudio';
                const width = Math.round((department._count.employees / largest) * 100);
                return (
                  <li key={department.id} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 truncate text-xs font-medium text-gray-700 sm:w-44">{department.name}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <span className={`block h-full rounded-full ${studio ? 'bg-violet-500' : 'bg-emerald-600'}`} style={{ width: `${Math.max(width, department._count.employees ? 6 : 0)}%` }} />
                    </span>
                    <span className="w-6 text-right text-xs font-semibold text-gray-700">{department._count.employees}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Positions</h3>
            <button type="button" className="text-xs font-medium text-emerald-700" onClick={() => setPosOpen(true)}>Add</button>
          </div>
          {positions.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No positions yet.</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {positions.map((position) => (
                <article key={position.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Icon icon="carbon:id-management" className="h-5 w-5 text-emerald-700" />
                    <span className="text-lg font-semibold text-gray-900">{position._count.employees}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">{position.title}</p>
                  {position.responsibilities ? <p className="mt-1 line-clamp-2 text-xs text-gray-500">{position.responsibilities}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <FormModal open={deptOpen} title="Add department" subtitle="A department belongs to one business unit." onClose={() => setDeptOpen(false)}>
        <form className="space-y-3" onSubmit={addDepartment}>
          <Field label="Name">
            <input className={inputClass} value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} required />
          </Field>
          <Field label="Business unit">
            <select className={inputClass} value={departmentForm.businessUnitId} onChange={(e) => setDepartmentForm({ ...departmentForm, businessUnitId: e.target.value, managerId: '' })}>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
          </Field>
          <Field label="Manager">
            <select className={inputClass} value={departmentForm.managerId} onChange={(e) => setDepartmentForm({ ...departmentForm, managerId: e.target.value })}>
              <option value="">None yet</option>
              {employees.filter((person) => person.businessUnitId === departmentForm.businessUnitId).map((person) => (
                <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end">
            <PrimaryButton type="submit">Save department</PrimaryButton>
          </div>
        </form>
      </FormModal>

      <FormModal open={Boolean(editing)} title="Edit department" onClose={() => setEditing(null)}>
        {editing && (
          <form className="space-y-3" onSubmit={saveDepartment}>
            <Field label="Name">
              <input className={inputClass} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            </Field>
            <Field label="Manager">
              <select className={inputClass} value={editing.managerId} onChange={(e) => setEditing({ ...editing, managerId: e.target.value })}>
                <option value="">No manager</option>
                {employees.map((person) => (
                  <option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end">
              <PrimaryButton type="submit">Save</PrimaryButton>
            </div>
          </form>
        )}
      </FormModal>

      <FormModal open={posOpen} title="Add position" subtitle="Positions are shared by both business units." onClose={() => setPosOpen(false)}>
        <form className="space-y-3" onSubmit={addPosition}>
          <Field label="Title">
            <input className={inputClass} placeholder="Position title" value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} required />
          </Field>
          <Field label="Responsibilities">
            <textarea className={inputClass} rows={3} value={positionResponsibilities} onChange={(e) => setPositionResponsibilities(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <PrimaryButton type="submit">Add position</PrimaryButton>
          </div>
        </form>
      </FormModal>
    </div>
  );
};

export default HbmsOrganization;
