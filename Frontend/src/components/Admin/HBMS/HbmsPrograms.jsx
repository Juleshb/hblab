import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import programPhoto from '../../../assets/camera-operator-shooting-on-professional-camera-1024x682.webp';
import toast from 'react-hot-toast';
import hbmsApi, {
  apiError,
  formatDate,
  optionLabel,
  programKindOptions,
  programStatusOptions,
} from './api';
import { Field, FormModal, Notice, PageHeader, PrimaryButton, StatusBadge, inputClass } from './ui';

const emptyForm = {
  name: '',
  kind: 'INTERNSHIP',
  status: 'PLANNED',
  businessUnitId: '',
  coordinatorId: '',
  startDate: '',
  endDate: '',
  capacity: '',
  description: '',
  objectives: '',
};

const HbmsPrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [units, setUnits] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [canManagePrograms, setCanManagePrograms] = useState(false);

  const load = async () => {
    const [programRes, unitRes, workerRes, accessRes] = await Promise.all([
      hbmsApi.get('/programs?limit=100'),
      hbmsApi.get('/business-units'),
      hbmsApi.get('/employees?limit=100'),
      hbmsApi.get('/access/me'),
    ]);
    setCanManagePrograms(Boolean(accessRes.data.data?.canManagePrograms));
    setPrograms(programRes.data.data);
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
        if (active) setError(apiError(err, 'Could not load programs'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const createProgram = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post('/programs', {
        ...form,
        coordinatorId: form.coordinatorId || null,
        capacity: form.capacity || null,
      });
      toast.success('Program created');
      setShowForm(false);
      setForm({ ...emptyForm, businessUnitId: form.businessUnitId, kind: form.kind });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not create program'));
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading programs…</p>;
  if (error) return <Notice>{error}</Notice>;

  return (
    <div className="space-y-4">
      <PageHeader title="Programs and training" subtitle="Training stays separate from client projects. Participants can be workers or external students.">
        {canManagePrograms ? (
          <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setShowForm(true)}>
            New program
          </button>
        ) : null}
      </PageHeader>
      <div className="grid gap-3 md:grid-cols-2">
        {programs.length === 0 ? (
          <Notice tone="empty">No training programs yet.</Notice>
        ) : programs.map((program) => (
          <Link key={program.id} to={`/admin/hbms/programs/${program.id}`} className="flex gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm hover:border-emerald-200">
            <img src={programPhoto} alt="" className="hidden h-24 w-32 shrink-0 rounded-2xl object-cover sm:block" />
            <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{program.name}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {program.businessUnit?.name}
                  {' · '}
                  {optionLabel(programKindOptions, program.kind)}
                  {program.startDate ? ` · ${formatDate(program.startDate)}` : ''}
                  {program.endDate ? ` – ${formatDate(program.endDate)}` : ''}
                </p>
              </div>
              <StatusBadge value={program.status} label={optionLabel(programStatusOptions, program.status)} />
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>{program.participantCount} enrolled{program.capacity != null ? ` of ${program.capacity}` : ''}</span>
                <span className="font-semibold text-gray-800">{program.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${program.progress}%` }} />
              </div>
            </div>
            </div>
          </Link>
        ))}
      </div>
      <FormModal open={showForm} wide title="New program" subtitle="Training stays separate from client projects. Learners can be workers or external students." onClose={() => setShowForm(false)}>
        <form className="space-y-3" onSubmit={createProgram}>
          <Field label="Name">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {programKindOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Business unit">
            <select className={inputClass} value={form.businessUnitId} onChange={(e) => setForm({ ...form, businessUnitId: e.target.value })}>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
          </Field>
          <Field label="Coordinator">
            <select className={inputClass} value={form.coordinatorId} onChange={(e) => setForm({ ...form, coordinatorId: e.target.value })}>
              <option value="">Unassigned</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{worker.firstName} {worker.lastName} · {worker.staffCode}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {programStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
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
          <Field label="Number of participants">
            <input className={inputClass} inputMode="numeric" placeholder="15" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </Field>
          <Field label="Description">
            <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Objectives">
            <textarea className={inputClass} rows={2} value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
          </Field>
          <div className="flex justify-end border-t border-gray-100 pt-3">
            <PrimaryButton type="submit">Create program</PrimaryButton>
          </div>
        </form>
      </FormModal>
    </div>
  );
};

export default HbmsPrograms;
