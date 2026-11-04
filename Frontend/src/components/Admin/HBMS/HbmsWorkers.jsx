import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import hbmsApi, { accessRoleLabel, apiError, employmentLabel, employmentTypeOptions } from './api';
import { Field, FormModal, Notice, PageHeader, Panel, PrimaryButton, StatusBadge, WorkerAvatar, inputClass } from './ui';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  employmentType: 'FULL_TIME',
  status: 'ACTIVE',
  businessUnitId: '',
  departmentId: '',
  positionId: '',
  reportsToId: '',
  skills: '',
};

const HbmsWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);
  const [leave, setLeave] = useState([]);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [unitFilter, setUnitFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [issued, setIssued] = useState([]);
  const [issuing, setIssuing] = useState(false);
  const [canManageSystem, setCanManageSystem] = useState(false);

  const loadOptions = async () => {
    const [unitRes, positionRes] = await Promise.all([
      hbmsApi.get('/business-units'),
      hbmsApi.get('/positions'),
    ]);
    setUnits(unitRes.data.data);
    setPositions(positionRes.data.data);
    setForm((current) => ({
      ...current,
      businessUnitId: current.businessUnitId || unitRes.data.data[0]?.id || '',
    }));
    return unitRes.data.data;
  };

  const loadWorkers = async () => {
    const params = new URLSearchParams({ limit: '100' });
    if (query.trim()) params.set('q', query.trim());
    if (unitFilter) params.set('businessUnitId', unitFilter);
    const [workerRes, leaveRes] = await Promise.all([
      hbmsApi.get(`/employees?${params.toString()}`),
      hbmsApi.get('/employees/leave?status=PENDING'),
    ]);
    setWorkers(workerRes.data.data);
    setLeave(leaveRes.data.data);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [accessRes] = await Promise.all([
          hbmsApi.get('/access/me'),
          loadOptions(),
        ]);
        if (!active) return;
        setCanManageSystem(Boolean(accessRes.data.data?.canManageSystem));
        await loadWorkers();
      } catch (err) {
        if (active) setError(apiError(err, 'Could not load workers'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const search = async (event) => {
    event.preventDefault();
    try {
      await loadWorkers();
    } catch (err) {
      toast.error(apiError(err, 'Search failed'));
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      departmentId: form.departmentId || null,
      positionId: form.positionId || null,
      reportsToId: form.reportsToId || null,
    };
    try {
      let savedId = editingId;
      if (editingId) {
        await hbmsApi.patch(`/employees/${editingId}`, payload);
      } else {
        const response = await hbmsApi.post('/employees', payload);
        savedId = response.data.data.id;
      }
      if (photoFile && savedId) {
        const body = new FormData();
        body.append('file', photoFile);
        await hbmsApi.post(`/employees/${savedId}/photo`, body);
      }
      toast.success(editingId ? 'Profile updated' : 'Worker registered');
      setEditingId(null);
      setPhotoFile(null);
      setShowForm(false);
      setForm({ ...emptyForm, businessUnitId: form.businessUnitId });
      await loadOptions();
      await loadWorkers();
    } catch (err) {
      toast.error(apiError(err, 'Could not save worker'));
    }
  };

  const startEdit = (worker) => {
    setEditingId(worker.id);
    setForm({
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: worker.email,
      phone: worker.phone || '',
      employmentType: worker.employmentType,
      status: worker.status,
      businessUnitId: worker.businessUnitId,
      departmentId: worker.departmentId || '',
      positionId: worker.positionId || '',
      reportsToId: worker.reportsToId || '',
      skills: (worker.skills || []).join(', '),
    });
  };

  const createMissingLogins = async () => {
    setIssuing(true);
    try {
      const response = await hbmsApi.post('/employees/accounts');
      const created = response.data.data || [];
      setIssued(created);
      await loadWorkers();
      if (created.length === 0) toast.success('Every worker already has a login');
    } catch (err) {
      toast.error(apiError(err, 'Could not create logins'));
    } finally {
      setIssuing(false);
    }
  };

  const decideLeave = async (id, decision) => {
    try {
      await hbmsApi.post(`/employees/leave/${id}/decision`, { decision });
      toast.success(decision === 'APPROVED' ? 'Leave approved' : 'Leave rejected');
      await loadWorkers();
    } catch (err) {
      toast.error(apiError(err, 'Could not update leave request'));
    }
  };

  const selectedUnit = units.find((unit) => unit.id === form.businessUnitId);
  const departments = selectedUnit?.departments || [];
  const shownWorkers = workers.filter((worker) => {
    const unitId = worker.businessUnit?.id || worker.businessUnitId;
    if (unitFilter && unitId !== unitFilter) return false;
    if (departmentFilter && worker.department?.id !== departmentFilter) return false;
    return true;
  });
  const supervisors = workers.filter((worker) => worker.id !== editingId);

  if (loading) return <p className="text-sm text-gray-500">Loading staff…</p>;
  if (error) return <Notice>{error}</Notice>;

  return (
    <div className="space-y-4">
      <PageHeader title="Workers" subtitle="People shared by HBLab and HBStudio.">
        <form className="flex flex-wrap items-center gap-2" onSubmit={search}>
          <input className={`${inputClass} w-44`} placeholder="Search workers" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className={`${inputClass} w-auto`} value={unitFilter} onChange={(e) => { setUnitFilter(e.target.value); setDepartmentFilter(''); }}>
            <option value="">All units</option>
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
          </select>
          <select className={`${inputClass} w-auto`} value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">All departments</option>
            {units.filter((unit) => !unitFilter || unit.id === unitFilter).flatMap((unit) => unit.departments || []).map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
          <PrimaryButton type="submit">Search</PrimaryButton>
          {canManageSystem ? (
            <>
              <button type="button" className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-800 disabled:opacity-60" disabled={issuing} onClick={createMissingLogins}>
                {issuing ? 'Creating logins…' : 'Create missing logins'}
              </button>
              <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => { setEditingId(null); setPhotoFile(null); setForm({ ...emptyForm, businessUnitId: units[0]?.id || '' }); setShowForm(true); }}>
                Add worker
              </button>
            </>
          ) : null}
        </form>
      </PageHeader>
      <Panel title="Staff directory">
        {shownWorkers.length === 0 ? <Notice tone="empty">No workers match this view.</Notice> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Department</th>
                  <th className="py-2 pr-3">Unit</th>
                  <th className="py-2 pr-3">Position</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Login</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {shownWorkers.map((worker) => (
                  <tr key={worker.id} className="border-t border-gray-100">
                    <td className="py-3 pr-3">
                      <Link to={`/admin/hbms/workers/${worker.id}`} className="flex items-center gap-3">
                        <WorkerAvatar worker={worker} className="h-9 w-9 shrink-0 rounded-full bg-emerald-100 text-xs text-emerald-800" />
                        <span>
                          <span className="block font-medium text-gray-900">{worker.firstName} {worker.lastName}</span>
                          <span className="text-xs text-gray-500">{worker.staffCode} · {employmentLabel(worker.employmentType)}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pr-3">{worker.department?.name || '—'}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${worker.businessUnit?.name === 'HBStudio' ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {worker.businessUnit?.name}
                      </span>
                    </td>
                    <td className="py-3 pr-3">{worker.position?.title || '—'}</td>
                    <td className="py-3 pr-3"><StatusBadge value={worker.status} /></td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${worker.user?.email ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                        {worker.user?.email || 'No login'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link to={`/admin/hbms/workers/${worker.id}`} className="text-xs font-medium text-emerald-700">View</Link>
                      {worker.userId ? <Link to={`/admin/hbms/messages?worker=${worker.id}`} className="ml-3 text-xs font-medium text-emerald-700">Message</Link> : null}
                      {canManageSystem ? <button type="button" className="ml-3 text-xs font-medium text-gray-500" onClick={() => { startEdit(worker); setPhotoFile(null); setShowForm(true); }}>Edit</button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <FormModal
        open={showForm}
        wide
        title={editingId ? 'Edit worker' : 'Add worker'}
        subtitle="The worker keeps one primary department and can still join projects in either unit."
        onClose={() => setShowForm(false)}
      >
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="First name">
                <input className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </Field>
              <Field label="Last name">
                <input className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </Field>
            </div>
            <Field label="Email">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Business unit">
              <select className={inputClass} value={form.businessUnitId} onChange={(e) => setForm({ ...form, businessUnitId: e.target.value, departmentId: '' })}>
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
              </select>
            </Field>
            <Field label="Primary department">
              <select className={inputClass} value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                <option value="">None</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
            </Field>
            <Field label="Position">
              <select className={inputClass} value={form.positionId} onChange={(e) => setForm({ ...form, positionId: e.target.value })}>
                <option value="">None</option>
                {positions.map((position) => <option key={position.id} value={position.id}>{position.title}</option>)}
              </select>
            </Field>
            <Field label="Employment type">
              <select className={inputClass} value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                {employmentTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Supervisor">
              <select className={inputClass} value={form.reportsToId} onChange={(e) => setForm({ ...form, reportsToId: e.target.value })}>
                <option value="">None</option>
                {supervisors.map((worker) => (
                  <option key={worker.id} value={worker.id}>{worker.firstName} {worker.lastName}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['ACTIVE', 'ON_LEAVE', 'INACTIVE'].map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Profile picture">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="block w-full text-sm text-gray-700"
                onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
              />
              <p className="mt-1 text-xs text-gray-500">JPEG, PNG, or WebP. Up to 5 MB.</p>
            </Field>
            <Field label="Skills">
              <input className={inputClass} placeholder="React, Node.js, PostgreSQL" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
            </Field>
            <div className="flex justify-end border-t border-gray-100 pt-3">
              <PrimaryButton type="submit">{editingId ? 'Update profile' : 'Register worker'}</PrimaryButton>
            </div>
          </form>
      </FormModal>

      <FormModal
        open={issued.length > 0}
        wide
        title="Staff logins"
        subtitle="A copy is emailed to the account. It is also shown here only this once."
        onClose={() => setIssued([])}
      >
        <ul className="space-y-3">
          {issued.map((account) => (
            <li key={account.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
              <p className="font-medium text-gray-900">{account.name}</p>
              <p className="text-gray-600">{account.email}</p>
              <p className="mt-1 font-mono text-base text-gray-900">{account.temporaryPassword || 'This email already had an account. The password was not changed.'}</p>
              <p className="mt-1 text-xs text-gray-500">{account.roles.map(accessRoleLabel).join(' · ')}</p>
            </li>
          ))}
        </ul>
      </FormModal>

      <Panel title="Leave awaiting approval">
        {leave.length === 0 ? <Notice tone="empty">No pending leave requests.</Notice> : (
          <ul className="space-y-2">
            {leave.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{request.employee.firstName} {request.employee.lastName}</span>
                  <span className="text-gray-500"> · {request.employee.staffCode} · {request.reason || 'Leave request'}</span>
                </span>
                <span className="flex gap-2">
                  <button type="button" className="text-xs font-medium text-green-700" onClick={() => decideLeave(request.id, 'APPROVED')}>Approve</button>
                  <button type="button" className="text-xs font-medium text-red-600" onClick={() => decideLeave(request.id, 'REJECTED')}>Reject</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};

export default HbmsWorkers;
