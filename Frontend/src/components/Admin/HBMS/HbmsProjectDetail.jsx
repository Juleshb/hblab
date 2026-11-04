import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import hbmsApi, { apiError, formatDate, formatMoney, moneyPartyFields, moneyPartyLabel, moneyPartyOptions, optionLabel, projectCategoryOptions, projectStatusOptions, taskStatusOptions } from './api';
import { Field, FormModal, Notice, Panel, PrimaryButton, Segmented, StatusBadge, WorkerAvatar, inputClass } from './ui';

const taskParts = [
  { key: 'TODO', label: 'To do', color: '#64748b' },
  { key: 'IN_PROGRESS', label: 'In progress', color: '#0284c7' },
  { key: 'BLOCKED', label: 'Blocked', color: '#dc2626' },
  { key: 'IN_REVIEW', label: 'In review', color: '#7c3aed' },
  { key: 'DONE', label: 'Done', color: '#15803d' },
];

const priorityEdge = { URGENT: '#ef4444', HIGH: '#f97316', MEDIUM: '#0ea5e9', LOW: '#cbd5e1' };

function localKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
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

const HbmsProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [units, setUnits] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState({ employeeId: '', role: 'MEMBER' });
  const [milestone, setMilestone] = useState({ title: '', dueDate: '' });
  const [task, setTask] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', startDate: '', dueDate: '', assigneeIds: [] });
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [comment, setComment] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState('');
  const [details, setDetails] = useState(null);
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '', reset: false });
  const [issuedLogin, setIssuedLogin] = useState(null);
  const [payment, setPayment] = useState({ amount: '', paidOn: '', note: '', payer: '', receiver: '' });
  const [expense, setExpense] = useState({ amount: '', description: '', spentOn: '', spentBy: '' });
  const [partyEdit, setPartyEdit] = useState(null);

  const load = async () => {
    const [projectRes, workerRes, unitRes] = await Promise.all([
      hbmsApi.get(`/projects/${id}`),
      hbmsApi.get('/employees?limit=100'),
      hbmsApi.get('/business-units'),
    ]);
    setProject(projectRes.data.data);
    setWorkers(workerRes.data.data);
    setUnits(unitRes.data.data);
  };

  useEffect(() => {
    let active = true;
    load()
      .catch((err) => {
        if (active) setError(apiError(err, 'Could not load project'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const saveDepartments = async (departmentIds) => {
    try {
      await hbmsApi.patch(`/projects/${id}`, { departmentIds });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not update departments'));
    }
  };

  const updateStatus = async (status) => {
    try {
      await hbmsApi.patch(`/projects/${id}`, { status });
      toast.success('Project updated');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not update project'));
    }
  };

  const updateWorkflow = async (requiresApproval) => {
    try {
      await hbmsApi.patch(`/projects/${id}`, { requiresApproval });
      toast.success(requiresApproval ? 'Manager approval is required' : 'Workers can complete tasks directly');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not update workflow'));
    }
  };

  const openDetails = () => {
    setDetails({
      name: project?.name || '',
      businessUnitId: project?.businessUnitId || '',
      managerId: project?.managerId || '',
      status: project?.status || 'PLANNING',
      category: project?.category || 'SOFTWARE',
      startDate: project?.startDate ? localKey(project.startDate) : '',
      endDate: project?.endDate ? localKey(project.endDate) : '',
      clientName: project?.clientName || '',
      clientContactName: project?.clientContactName || '',
      clientEmail: project?.clientEmail || '',
      clientPhone: project?.clientPhone || '',
      description: project?.description || '',
      budgetAmount: project?.budgetAmount ?? '',
      requiresApproval: project?.requiresApproval !== false,
    });
    setModal('details');
  };

  const openClientLogin = () => {
    setIssuedLogin(null);
    setClientForm({
      name: project?.clientContactName || '',
      email: project?.clientEmail || '',
      phone: project?.clientPhone || '',
      reset: false,
    });
    setModal('client');
  };

  const saveClientLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await hbmsApi.post(`/projects/${id}/client-login`, clientForm);
      setIssuedLogin(response.data.data);
      toast.success(response.data.data.created ? 'Client login created' : 'Client can follow this project');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not give the client a login'));
    }
  };

  const recordPayment = async (event) => {
    event.preventDefault();
    try {
      const payer = moneyPartyFields(payment.payer);
      const receiver = moneyPartyFields(payment.receiver);
      await hbmsApi.post(`/projects/${id}/payments`, {
        amount: payment.amount,
        paidOn: payment.paidOn,
        note: payment.note,
        payerKind: payer.kind,
        payerId: payer.id,
        receiverKind: receiver.kind,
        receiverId: receiver.id,
      });
      toast.success('Payment recorded');
      setModal('');
      setPayment({ amount: '', paidOn: '', note: '', payer: '', receiver: '' });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not record the payment'));
    }
  };

  const recordExpense = async (event) => {
    event.preventDefault();
    try {
      const spentBy = moneyPartyFields(expense.spentBy);
      await hbmsApi.post(`/projects/${id}/expenses`, {
        amount: expense.amount,
        description: expense.description,
        spentOn: expense.spentOn,
        spentByKind: spentBy.kind,
        spentById: spentBy.id,
      });
      toast.success('Expense recorded');
      setModal('');
      setExpense({ amount: '', description: '', spentOn: '', spentBy: '' });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not record the expense'));
    }
  };

  const partyValue = (kind, person) => {
    if (kind === 'CLIENT') return 'CLIENT';
    if (kind === 'MEMBER') return person?.id || '';
    return '';
  };

  const openPaymentPeople = (item) => {
    setPartyEdit({
      type: 'payment',
      id: item.id,
      payer: partyValue(item.payerKind, item.payer),
      receiver: partyValue(item.receiverKind, item.receiver),
    });
  };

  const openExpensePeople = (item) => {
    setPartyEdit({
      type: 'expense',
      id: item.id,
      spentBy: partyValue(item.spentByKind, item.spentBy),
      spentOn: item.spentOn ? localKey(item.spentOn) : '',
    });
  };

  const savePartyEdit = async (event) => {
    event.preventDefault();
    if (!partyEdit) return;
    try {
      if (partyEdit.type === 'payment') {
        const payer = moneyPartyFields(partyEdit.payer);
        const receiver = moneyPartyFields(partyEdit.receiver);
        await hbmsApi.patch(`/projects/${id}/payments/${partyEdit.id}`, {
          payerKind: payer.kind,
          payerId: payer.id,
          receiverKind: receiver.kind,
          receiverId: receiver.id,
        });
      } else {
        const spentBy = moneyPartyFields(partyEdit.spentBy);
        await hbmsApi.patch(`/projects/${id}/expenses/${partyEdit.id}`, {
          spentByKind: spentBy.kind,
          spentById: spentBy.id,
          spentOn: partyEdit.spentOn,
        });
      }
      toast.success('People saved');
      setPartyEdit(null);
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not save the people'));
    }
  };

  const removePayment = async (paymentId) => {
    try {
      await hbmsApi.delete(`/projects/${id}/payments/${paymentId}`);
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not remove the payment'));
    }
  };

  const removeExpense = async (expenseId) => {
    try {
      await hbmsApi.delete(`/projects/${id}/expenses/${expenseId}`);
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not remove the expense'));
    }
  };

  const saveDetails = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.patch(`/projects/${id}`, {
        ...details,
        managerId: details.managerId || null,
        budgetAmount: details.budgetAmount === '' ? null : details.budgetAmount,
        clientName: details.clientName,
        description: details.description,
      });
      toast.success('Project details saved');
      setModal('');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not save project details'));
    }
  };

  const addMember = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/projects/${id}/members`, member);
      toast.success('Member added');
      setModal('');
      setMember({ employeeId: '', role: 'MEMBER' });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not add member'));
    }
  };

  const removeMember = async (employeeId) => {
    try {
      await hbmsApi.delete(`/projects/${id}/members/${employeeId}`);
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not remove member'));
    }
  };

  const addMilestone = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/projects/${id}/milestones`, milestone);
      toast.success('Milestone added');
      setModal('');
      setMilestone({ title: '', dueDate: '' });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not add milestone'));
    }
  };

  const setMilestoneStatus = async (milestoneId, status) => {
    try {
      await hbmsApi.patch(`/projects/milestones/${milestoneId}`, { status });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not update milestone'));
    }
  };

  const addTask = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post('/tasks', { ...task, projectId: id });
      toast.success('Task created');
      setModal('');
      setTask({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', startDate: '', dueDate: '', assigneeIds: [] });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not create task'));
    }
  };

  const addComment = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/tasks/${activeTaskId}/comments`, { body: comment });
      setComment('');
      setModal('');
      await load();
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
    body.append('title', fileTitle || file.name);
    body.append('file', file);
    try {
      await hbmsApi.post(`/tasks/${activeTaskId}/files`, body);
      toast.success('File stored');
      setModal('');
      setFileTitle('');
      event.target.reset();
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not store file'));
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading project…</p>;
  if (error) return <Notice>{error}</Notice>;
  if (!project) return <Notice>Project not found.</Notice>;

  const studio = project.businessUnit?.name === 'HBStudio';
  const accent = studio ? '#7c3aed' : '#15803d';
  const tasks = project.tasks || [];
  const openTasks = tasks.filter((item) => !['DONE', 'CANCELLED'].includes(item.status));
  const doneTasks = tasks.filter((item) => item.status === 'DONE').length;
  const today = localKey();
  const overdueTasks = openTasks.filter((item) => item.dueDate && localKey(item.dueDate) < today).length;
  const taskCounts = taskParts.map((part) => ({
    ...part,
    value: tasks.filter((item) => item.status === part.key).length,
  }));
  const taskTotal = taskCounts.reduce((sum, part) => sum + part.value, 0);
  const milestoneDone = (project.milestones || []).filter((item) => item.status === 'COMPLETED').length;
  const files = tasks.flatMap((item) => item.files || []);
  const clientView = Boolean(project.viewer?.clientOnly);
  const logins = project.clientAccess || [];
  const currency = project.budgetCurrency || 'RWF';
  const payments = project.payments || [];
  const expenses = project.expenses || [];
  const paidTotal = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenseTotal = expenses.filter((item) => item.status === 'APPROVED').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const profit = paidTotal - expenseTotal;
  const repayment = project.budgetAmount == null ? null : Number(project.budgetAmount) - paidTotal;

  return (
    <div className="space-y-4">
      <Link to="/admin/hbms/projects" className="text-xs font-medium text-emerald-700">Back to projects</Link>
      <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${studio ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {project.code} · {project.businessUnit?.name}
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">{project.name}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {project.clientName || 'Internal project'}
              {project.clientContactName ? ` · ${project.clientContactName}` : ''}
              {project.manager && !clientView ? ` · ${project.manager.firstName} ${project.manager.lastName}` : ''}
              {` · ${optionLabel(projectCategoryOptions, project.category)}`}
            </p>
          </div>
          {clientView || !project.viewer?.canManage ? null : <div className="flex flex-wrap items-center gap-2">
            <select className={`${inputClass} !w-auto`} value={project.status} onChange={(e) => updateStatus(e.target.value)}>
              {projectStatusOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select className={`${inputClass} !w-auto`} value={String(project.requiresApproval !== false)} onChange={(e) => updateWorkflow(e.target.value === 'true')}>
              <option value="true">Manager approval</option>
              <option value="false">Complete directly</option>
            </select>
            <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={openDetails}>
              Edit details
            </button>
          </div>}
        </div>
        <FormModal open={modal === 'details' && details} wide title="Edit project" subtitle={project.code} onClose={() => setModal('')}>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={saveDetails}>
            <div className="md:col-span-2">
              <Field label="Name">
                <input className={inputClass} value={details?.name || ''} onChange={(e) => setDetails({ ...details, name: e.target.value })} required />
              </Field>
            </div>
            <Field label="Business unit">
              <select className={inputClass} value={details?.businessUnitId || ''} onChange={(e) => setDetails({ ...details, businessUnitId: e.target.value })}>
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select className={inputClass} value={details?.category || ''} onChange={(e) => setDetails({ ...details, category: e.target.value })}>
                {projectCategoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Manager">
              <select className={inputClass} value={details?.managerId || ''} onChange={(e) => setDetails({ ...details, managerId: e.target.value })}>
                <option value="">Unassigned</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>{worker.firstName} {worker.lastName} · {worker.businessUnit?.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputClass} value={details?.status || ''} onChange={(e) => setDetails({ ...details, status: e.target.value })}>
                {projectStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Client">
              <input className={inputClass} value={details?.clientName || ''} onChange={(e) => setDetails({ ...details, clientName: e.target.value })} />
            </Field>
            <Field label="Client contact">
              <input className={inputClass} placeholder="Contact name" value={details?.clientContactName || ''} onChange={(e) => setDetails({ ...details, clientContactName: e.target.value })} />
            </Field>
            <Field label="Contact email">
              <input type="email" className={inputClass} value={details?.clientEmail || ''} onChange={(e) => setDetails({ ...details, clientEmail: e.target.value })} />
            </Field>
            <Field label="Contact phone">
              <input className={inputClass} value={details?.clientPhone || ''} onChange={(e) => setDetails({ ...details, clientPhone: e.target.value })} />
            </Field>
            <Field label="Budget (RWF)">
              <input className={inputClass} inputMode="numeric" value={details?.budgetAmount ?? ''} onChange={(e) => setDetails({ ...details, budgetAmount: e.target.value })} />
            </Field>
            <Field label="Start">
              <input type="date" className={inputClass} value={details?.startDate || ''} onChange={(e) => setDetails({ ...details, startDate: e.target.value })} />
            </Field>
            <Field label="Deadline">
              <input type="date" className={inputClass} value={details?.endDate || ''} onChange={(e) => setDetails({ ...details, endDate: e.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <label className="flex items-start gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={details?.requiresApproval !== false}
                  onChange={(e) => setDetails({ ...details, requiresApproval: e.target.checked })}
                />
                <span>Manager must approve work before a task can be completed</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <Field label="Scope">
                <textarea className={inputClass} rows={3} value={details?.description || ''} onChange={(e) => setDetails({ ...details, description: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end md:col-span-2">
              <PrimaryButton type="submit">Save details</PrimaryButton>
            </div>
          </form>
        </FormModal>
        <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex items-center gap-3">
            <MiniRing percent={project.progress} color={accent} />
            <div>
              <p className="text-sm font-semibold text-gray-900">Progress</p>
              <p className="text-xs text-gray-500">{doneTasks} of {tasks.filter((item) => item.status !== 'CANCELLED').length} tasks done</p>
              <p className="mt-1 text-xs text-gray-500">{formatDate(project.startDate)} – {formatDate(project.endDate)}</p>
            </div>
          </div>
          <div>
            <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
              {taskTotal === 0 ? <span className="h-full w-full bg-gray-100" /> : taskCounts.map((part) => (
                <span key={part.key} className="h-full" style={{ width: `${(part.value / taskTotal) * 100}%`, background: part.color }} />
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-5">
              {taskCounts.map((part) => (
                <li key={part.key} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="h-2 w-2 rounded-full" style={{ background: part.color }} />
                  <span>{part.label}</span>
                  <span className="font-semibold text-gray-900">{part.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon="carbon:task" value={openTasks.length} label="Open tasks" detail={`${overdueTasks} overdue`} tone="border-sky-100 bg-sky-50 text-sky-700" />
        <Stat icon="carbon:user-multiple" value={project.members.length} label="Team" detail={`${(project.departments || []).length} departments`} tone="border-emerald-100 bg-emerald-50 text-emerald-700" />
        <Stat icon="carbon:flag" value={project.milestones.length} label="Milestones" detail={`${milestoneDone} completed`} tone="border-amber-100 bg-amber-50 text-amber-700" />
        {clientView ? (
          <Stat icon="carbon:calendar" value={formatDate(project.endDate)} label="Deadline" detail={project.clientContactName || project.clientName || 'Your project'} tone="border-violet-100 bg-violet-50 text-violet-700" />
        ) : (
          <Stat icon="carbon:currency" value={project.budgetAmount == null ? '—' : Number(project.budgetAmount).toLocaleString()} label={`Budget, ${project.budgetCurrency || 'RWF'}`} detail={files.length ? `${files.length} file${files.length === 1 ? '' : 's'}` : 'No files yet'} tone="border-violet-100 bg-violet-50 text-violet-700" />
        )}
      </div>
      <Segmented
        value={tab}
        onChange={setTab}
        options={clientView
          ? [['overview', 'Progress'], ['tasks', 'Tasks']]
          : [['overview', 'Overview'], ['tasks', 'Tasks'], ['team', 'Team'], ['files', 'Files']]}
      />
      {tab === 'overview' && (
      <>
      {clientView ? null : (
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Money</h3>
              <p className="mt-1 max-w-2xl text-xs text-gray-500">Profit is the amount paid minus recorded expenses. Remaining repayment is the budget still owed. Each payment names who paid and who received it. Each expense names who used it, either the client or a member of the team.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('payment')}>Record payment</button>
              <button type="button" className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800" onClick={() => setModal('expense')}>Record expense</button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Stat icon="carbon:currency" value={project.budgetAmount == null ? '—' : Number(project.budgetAmount).toLocaleString()} label="Budget" detail={currency} tone="border-gray-100 bg-gray-50 text-gray-700" />
            <Stat icon="carbon:wallet" value={paidTotal.toLocaleString()} label="Amount paid" detail={`${payments.length} payment${payments.length === 1 ? '' : 's'}`} tone="border-emerald-100 bg-emerald-50 text-emerald-700" />
            <Stat icon="carbon:receipt" value={expenseTotal.toLocaleString()} label="Expenses" detail={`${expenses.length} recorded`} tone="border-amber-100 bg-amber-50 text-amber-700" />
            <Stat icon="carbon:growth" value={profit.toLocaleString()} label="Profit earned" detail={profit < 0 ? 'Costs are ahead of payments' : 'Paid minus expenses'} tone={profit < 0 ? 'border-red-100 bg-red-50 text-red-700' : 'border-sky-100 bg-sky-50 text-sky-700'} />
            <Stat icon="carbon:hourglass" value={repayment == null ? '—' : repayment.toLocaleString()} label="Remaining repayment" detail={repayment == null ? 'Set a budget first' : repayment <= 0 ? 'Nothing left to collect' : `${currency} still owed`} tone="border-violet-100 bg-violet-50 text-violet-700" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-600">Payments</p>
              {payments.length === 0 ? <p className="mt-2 text-xs text-gray-500">No payment recorded yet.</p> : (
                <ul className="mt-2 space-y-2">
                  {payments.map((item) => {
                    const paidBy = moneyPartyLabel(item.payerKind, item.payer, project);
                    const receivedBy = moneyPartyLabel(item.receiverKind, item.receiver, project);
                    const people = [paidBy && `Paid by ${paidBy}`, receivedBy && `Received by ${receivedBy}`].filter(Boolean).join(' · ');
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7faf8] px-3 py-2 text-sm">
                        <span>
                          <span className="font-medium text-gray-900">{formatMoney(item.amount, item.currency)}</span>
                          <span className="block text-xs text-gray-500">{people || 'People not recorded'} · {item.note || 'Payment'} · {formatDate(item.paidOn || item.createdAt)}</span>
                        </span>
                        <span className="flex shrink-0 gap-3">
                          <button type="button" className="text-xs text-emerald-800" onClick={() => openPaymentPeople(item)}>{paidBy && receivedBy ? 'Edit people' : 'Name the people'}</button>
                          <button type="button" className="text-xs text-red-600" onClick={() => removePayment(item.id)}>Remove</button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Expenses</p>
              {expenses.length === 0 ? <p className="mt-2 text-xs text-gray-500">No expense recorded yet.</p> : (
                <ul className="mt-2 space-y-2">
                  {expenses.map((item) => {
                    const usedBy = moneyPartyLabel(item.spentByKind, item.spentBy, project);
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7faf8] px-3 py-2 text-sm">
                        <span>
                          <span className="font-medium text-gray-900">{formatMoney(item.amount, item.currency)}</span>
                          <span className="block text-xs text-gray-500">{usedBy ? `Used by ${usedBy} · ` : 'Who used it was not recorded · '}{item.description} · {formatDate(item.spentOn || item.createdAt)}</span>
                        </span>
                        <span className="flex shrink-0 gap-3">
                          <button type="button" className="text-xs text-emerald-800" onClick={() => openExpensePeople(item)}>{usedBy ? 'Edit people' : 'Name who used it'}</button>
                          <button type="button" className="text-xs text-red-600" onClick={() => removeExpense(item.id)}>Remove</button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          <FormModal open={Boolean(partyEdit)} title={partyEdit?.type === 'expense' ? 'Who used this expense' : 'Who paid and who received'} subtitle={project.name} onClose={() => setPartyEdit(null)}>
            <form className="space-y-3" onSubmit={savePartyEdit}>
              {partyEdit?.type === 'expense' ? (
                <>
                  <Field label="Who used it">
                    <select className={inputClass} value={partyEdit.spentBy} onChange={(e) => setPartyEdit({ ...partyEdit, spentBy: e.target.value })} required>
                      <option value="">Choose the client or a team member</option>
                      {moneyPartyOptions(project).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Date">
                    <input type="date" className={inputClass} value={partyEdit.spentOn || ''} onChange={(e) => setPartyEdit({ ...partyEdit, spentOn: e.target.value })} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Who paid">
                    <select className={inputClass} value={partyEdit?.payer || ''} onChange={(e) => setPartyEdit({ ...partyEdit, payer: e.target.value })} required>
                      <option value="">Choose the client or a team member</option>
                      {moneyPartyOptions(project).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Who received the payment">
                    <select className={inputClass} value={partyEdit?.receiver || ''} onChange={(e) => setPartyEdit({ ...partyEdit, receiver: e.target.value })} required>
                      <option value="">Choose the client or a team member</option>
                      {moneyPartyOptions(project).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                </>
              )}
              <div className="flex justify-end"><PrimaryButton type="submit">Save people</PrimaryButton></div>
            </form>
          </FormModal>
          <FormModal open={modal === 'payment'} title="Record payment" subtitle={project.name} onClose={() => setModal('')}>
            <form className="space-y-3" onSubmit={recordPayment}>
              <Field label="Amount paid (RWF)">
                <input className={inputClass} inputMode="numeric" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} required />
              </Field>
              <Field label="Who paid">
                <select className={inputClass} value={payment.payer} onChange={(e) => setPayment({ ...payment, payer: e.target.value })} required>
                  <option value="">Choose the client or a team member</option>
                  {moneyPartyOptions(project).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="Who received the payment">
                <select className={inputClass} value={payment.receiver} onChange={(e) => setPayment({ ...payment, receiver: e.target.value })} required>
                  <option value="">Choose the client or a team member</option>
                  {moneyPartyOptions(project).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="Date">
                <input type="date" className={inputClass} value={payment.paidOn} onChange={(e) => setPayment({ ...payment, paidOn: e.target.value })} />
              </Field>
              <Field label="Note">
                <input className={inputClass} placeholder="First installment" value={payment.note} onChange={(e) => setPayment({ ...payment, note: e.target.value })} />
              </Field>
              <div className="flex justify-end"><PrimaryButton type="submit">Save payment</PrimaryButton></div>
            </form>
          </FormModal>
          <FormModal open={modal === 'expense'} title="Record expense" subtitle={project.name} onClose={() => setModal('')}>
            <form className="space-y-3" onSubmit={recordExpense}>
              <Field label="Amount (RWF)">
                <input className={inputClass} inputMode="numeric" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} required />
              </Field>
              <Field label="What was it for">
                <input className={inputClass} value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} required />
              </Field>
              <Field label="Who used it">
                <select className={inputClass} value={expense.spentBy} onChange={(e) => setExpense({ ...expense, spentBy: e.target.value })} required>
                  <option value="">Choose the client or a team member</option>
                  {moneyPartyOptions(project).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="Date">
                <input type="date" className={inputClass} value={expense.spentOn} onChange={(e) => setExpense({ ...expense, spentOn: e.target.value })} />
              </Field>
              <div className="flex justify-end"><PrimaryButton type="submit">Save expense</PrimaryButton></div>
            </form>
          </FormModal>
        </section>
      )}
      <dl className="grid gap-3 rounded-3xl border border-gray-100 bg-white p-4 text-sm shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Client', project.clientName || '—'],
          ['Contact', project.clientContactName || '—'],
          ['Email', project.clientEmail || '—'],
          ['Phone', project.clientPhone || '—'],
          ...(clientView ? [] : [['Project manager', project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : '—']]),
          ['Start', formatDate(project.startDate)],
          ['Deadline', formatDate(project.endDate)],
          ...(clientView ? [] : [['Budget', formatMoney(project.budgetAmount, project.budgetCurrency)]]),
          ['Type', optionLabel(projectCategoryOptions, project.category)],
          ...(clientView ? [] : [
            ['Team', `${project.members.length} ${project.members.length === 1 ? 'member' : 'members'}`],
            ['Workflow', project.requiresApproval === false ? 'Complete directly' : 'Manager approval'],
          ]),
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
      {project.description ? <p className="rounded-3xl border border-gray-100 bg-white p-4 text-sm text-gray-700 shadow-sm">{project.description}</p> : null}

      {clientView ? (
        <Panel title="Milestones">
          {project.milestones.length === 0 ? <Notice tone="empty">No milestones yet.</Notice> : (
            <ul className="space-y-2">
              {project.milestones.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-2xl bg-[#f7faf8] px-3 py-2 text-sm">
                  <span>{item.title}<span className="ml-2 text-xs text-gray-500">{formatDate(item.dueDate)}</span></span>
                  <StatusBadge value={item.status} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-gray-500">Approved deliverables are in Documents.</p>
        </Panel>
      ) : (
      <Panel title="Client login" action={project.viewer?.canIssueLogin ? <button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={openClientLogin}>Give a login</button> : null}>
        <p className="mb-3 text-xs text-gray-500">The contact signs in and sees this project’s progress, tasks, and approved deliverables. They do not see the budget or the rest of HBMS.</p>
        <FormModal open={modal === 'client'} title="Client login" subtitle={project.name} onClose={() => { setModal(''); setIssuedLogin(null); }}>
          {issuedLogin ? (
            <div className="space-y-3 text-sm text-gray-700">
              <p>{issuedLogin.created ? `${issuedLogin.name} can now sign in and follow this project.` : `${issuedLogin.email} can now follow this project with the login they already have.`}</p>
              {issuedLogin.emailed ? <p>A temporary password was emailed to {issuedLogin.email}.</p> : null}
              {issuedLogin.temporaryPassword && !issuedLogin.emailed ? (
                <p>Email could not be sent. Temporary password, shown once: <span className="font-mono">{issuedLogin.temporaryPassword}</span></p>
              ) : null}
              <div className="flex justify-end"><PrimaryButton type="button" onClick={() => { setModal(''); setIssuedLogin(null); }}>Done</PrimaryButton></div>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={saveClientLogin}>
              <Field label="Contact name">
                <input className={inputClass} value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} required />
              </Field>
              <Field label="Email">
                <input type="email" className={inputClass} value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} required />
              </Field>
              <Field label="Phone">
                <input className={inputClass} value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} />
              </Field>
              <label className="flex items-start gap-2 text-sm text-gray-800">
                <input type="checkbox" className="mt-1" checked={clientForm.reset} onChange={(e) => setClientForm({ ...clientForm, reset: e.target.checked })} />
                <span>If this email already has a login, replace the password and email a new one</span>
              </label>
              <div className="flex justify-end"><PrimaryButton type="submit">Save and give access</PrimaryButton></div>
            </form>
          )}
        </FormModal>
        {logins.length === 0 ? <Notice tone="empty">No client login yet. Add the contact, then give them access to this project.</Notice> : (
          <ul className="space-y-2">
            {logins.map((item) => (
              <li key={item.user.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7faf8] px-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-gray-900">{item.user.name || 'Client'}</span>
                  <span className="block text-xs text-gray-500">{item.user.email}</span>
                </span>
                <StatusBadge value="CLIENT" label="Can follow progress" />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      )}

      {clientView ? null : <Panel title="Departments on this project">
        <p className="mb-2 text-xs text-gray-500">A worker keeps one primary department and can collaborate here with the others.</p>
        {(project.departments || []).length === 0 ? <Notice tone="empty">No departments linked yet. Adding a worker links their primary department.</Notice> : (
          <ul className="mb-3 flex flex-wrap gap-2">
            {project.departments.map((link) => (
              <li key={link.department.id} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                {link.department.name} · {link.department.businessUnit.name}
                <button
                  type="button"
                  className="ml-2 text-red-600"
                  onClick={() => saveDepartments(project.departments.map((item) => item.department.id).filter((departmentId) => departmentId !== link.department.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <select
          className={inputClass}
          value=""
          onChange={(event) => {
            if (!event.target.value) return;
            const current = (project.departments || []).map((link) => link.department.id);
            saveDepartments([...current, event.target.value]);
          }}
        >
          <option value="">Add a department</option>
          {units.map((unit) => (
            <optgroup key={unit.id} label={unit.name}>
              {unit.departments
                .filter((department) => !(project.departments || []).some((link) => link.department.id === department.id))
                .map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
            </optgroup>
          ))}
        </select>
      </Panel>}

      </>
      )}
      {tab === 'team' && (
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Team" action={<button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('member')}>Add member</button>}>
          <FormModal open={modal === 'member'} title="Add member" subtitle={project.name} onClose={() => setModal('')}>
            <form className="space-y-3" onSubmit={addMember}>
              <Field label="Worker">
                <select className={inputClass} value={member.employeeId} onChange={(e) => setMember({ ...member, employeeId: e.target.value })} required>
                  <option value="">Select worker</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName} · {worker.department?.name || 'No department'} · {worker.businessUnit?.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Role">
                <select className={inputClass} value={member.role} onChange={(e) => setMember({ ...member, role: e.target.value })}>
                  {['MEMBER', 'MANAGER', 'REVIEWER'].map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </Field>
              <div className="flex justify-end"><PrimaryButton type="submit">Add member</PrimaryButton></div>
            </form>
          </FormModal>
          {project.members.length === 0 ? <Notice tone="empty">No members yet.</Notice> : (
            <ul className="space-y-2">
              {project.members.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-2xl bg-[#f7faf8] px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <WorkerAvatar worker={item.employee} className="h-8 w-8 rounded-full bg-emerald-100 text-[11px] text-emerald-800" />
                    <span>
                    {item.employee.firstName} {item.employee.lastName}
                    <span className="block text-xs text-gray-500">
                      {item.employee.department?.name || 'No primary department'}
                      {(project.departments || []).some((link) => link.department.id !== item.employee.departmentId)
                        ? ` · collaborating with ${(project.departments || []).filter((link) => link.department.id !== item.employee.departmentId).map((link) => link.department.name).join(', ')}`
                        : ''}
                    </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge value={item.role} />
                    <button type="button" className="text-xs text-red-600" onClick={() => removeMember(item.employeeId)}>Remove</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Milestones" action={<button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('milestone')}>Add milestone</button>}>
          <FormModal open={modal === 'milestone'} title="Add milestone" subtitle={project.name} onClose={() => setModal('')}>
            <form className="space-y-3" onSubmit={addMilestone}>
              <Field label="Title">
                <input className={inputClass} placeholder="Title" value={milestone.title} onChange={(e) => setMilestone({ ...milestone, title: e.target.value })} required />
              </Field>
              <Field label="Due">
                <input type="date" className={inputClass} value={milestone.dueDate} onChange={(e) => setMilestone({ ...milestone, dueDate: e.target.value })} />
              </Field>
              <div className="flex justify-end"><PrimaryButton type="submit">Add milestone</PrimaryButton></div>
            </form>
          </FormModal>
          {project.milestones.length === 0 ? <Notice tone="empty">No milestones yet.</Notice> : (
            <ul className="space-y-2">
              {project.milestones.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-2xl bg-[#f7faf8] px-3 py-2 text-sm">
                  <span>
                    {item.title}
                    <span className="ml-2 text-xs text-gray-500">{formatDate(item.dueDate)}</span>
                  </span>
                  <select className="rounded-lg border border-gray-300 px-2 py-1 text-xs" value={item.status} onChange={(e) => setMilestoneStatus(item.id, e.target.value)}>
                    {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      )}

      {tab === 'tasks' && (
      <Panel title="Tasks" action={clientView ? null : <button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('task')}>New task</button>}>
        <FormModal open={modal === 'task'} wide title="New task" subtitle={project.name} onClose={() => setModal('')}>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={addTask}>
            <div className="md:col-span-2">
              <Field label="Title">
                <input className={inputClass} placeholder="Task title" value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} required />
              </Field>
            </div>
            <Field label="Assignee">
              <select className={inputClass} value={task.assigneeIds[0] || ''} onChange={(e) => setTask({ ...task, assigneeIds: e.target.value ? [e.target.value] : [] })}>
                <option value="">Unassigned</option>
                {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.firstName} {worker.lastName}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className={inputClass} value={task.priority} onChange={(e) => setTask({ ...task, priority: e.target.value })}>
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => <option key={priority} value={priority}>{priority[0] + priority.slice(1).toLowerCase()}</option>)}
              </select>
            </Field>
            <Field label="Start">
              <input type="date" className={inputClass} value={task.startDate} onChange={(e) => setTask({ ...task, startDate: e.target.value })} />
            </Field>
            <Field label="Deadline">
              <input type="date" className={inputClass} value={task.dueDate} onChange={(e) => setTask({ ...task, dueDate: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className={inputClass} value={task.status} onChange={(e) => setTask({ ...task, status: e.target.value })}>
                {taskStatusOptions.filter(([value]) => ['TODO', 'IN_PROGRESS', 'BLOCKED'].includes(value)).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <input className={inputClass} placeholder="Description" value={task.description} onChange={(e) => setTask({ ...task, description: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end md:col-span-2"><PrimaryButton type="submit">Add task</PrimaryButton></div>
          </form>
        </FormModal>
        {project.tasks.length === 0 ? <Notice tone="empty">No tasks yet. Divide the project into work and assign each task to a worker.</Notice> : (
          <ul className="divide-y divide-gray-100">
            {project.tasks.map((item, index) => (
              <li key={item.id} className="border-l-4 py-3 pl-3 text-sm" style={{ borderLeftColor: priorityEdge[item.priority] || '#cbd5e1' }}>
                <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setActiveTaskId(activeTaskId === item.id ? null : item.id)}>
                  <span>
                    <span className="font-medium text-gray-900">{index + 1}. {item.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="flex -space-x-1">
                        {item.assignees.slice(0, 3).map((assignee) => (
                          <WorkerAvatar key={assignee.employee.id} worker={assignee.employee} className="h-6 w-6 rounded-full bg-emerald-100 text-[10px] text-emerald-800 ring-2 ring-white" />
                        ))}
                      </span>
                      <span>{item.assignees.map((assignee) => `${assignee.employee.firstName} ${assignee.employee.lastName}`).join(', ') || 'Unassigned'}</span>
                      <span className={item.dueDate && localKey(item.dueDate) < today && !['DONE', 'CANCELLED'].includes(item.status) ? 'rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700' : ''}>
                        {item.dueDate ? `${item.dueDate && localKey(item.dueDate) < today && !['DONE', 'CANCELLED'].includes(item.status) ? 'Overdue' : 'Due'} · ${formatDate(item.dueDate)}` : 'No deadline'}
                      </span>
                      <span>{item.progress || 0}%</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge value={item.priority} />
                    <StatusBadge value={item.status} label={optionLabel(taskStatusOptions, item.status)} />
                  </span>
                </button>
                {activeTaskId === item.id && (
                  <div className="mt-3 grid gap-3 rounded-lg bg-gray-50 p-3 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-600">Comments</p>
                      {(item.comments || []).length === 0 ? <p className="text-xs text-gray-500">No comments yet.</p> : (
                        <ul className="space-y-2">
                          {item.comments.map((entry) => (
                            <li key={entry.id}>
                              <p>{entry.body}</p>
                              <p className="text-[11px] text-gray-500">{entry.author ? `${entry.author.firstName} ${entry.author.lastName}` : 'Admin'} · {formatDate(entry.createdAt)}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                      {clientView ? null : <button type="button" className="mt-2 text-xs font-medium text-emerald-700" onClick={() => setModal('comment')}>Add comment</button>}
                      <FormModal open={modal === 'comment'} title="Add comment" onClose={() => setModal('')}>
                        <form className="space-y-3" onSubmit={addComment}>
                          <Field label="Comment">
                            <textarea className={inputClass} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment" required />
                          </Field>
                          <div className="flex justify-end"><PrimaryButton type="submit">Send</PrimaryButton></div>
                        </form>
                      </FormModal>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-600">Supporting files</p>
                      {(item.files || []).length === 0 ? <p className="text-xs text-gray-500">No files yet.</p> : (
                        <ul className="space-y-1">
                          {item.files.map((file) => (
                            <li key={file.id}>
                              <a className="text-green-800 hover:underline" href={`http://localhost:3000${file.fileUrl}`} target="_blank" rel="noreferrer">{file.title}</a>
                            </li>
                          ))}
                        </ul>
                      )}
                      {clientView ? null : <button type="button" className="mt-2 text-xs font-medium text-emerald-700" onClick={() => setModal('file')}>Upload file</button>}
                      <FormModal open={modal === 'file'} title="Upload file" onClose={() => setModal('')}>
                        <form className="space-y-3" onSubmit={uploadFile}>
                          <Field label="Title">
                            <input className={inputClass} placeholder="File title" value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} />
                          </Field>
                          <Field label="File">
                            <input name="file" type="file" className="text-sm" />
                          </Field>
                          <div className="flex justify-end"><PrimaryButton type="submit">Upload</PrimaryButton></div>
                        </form>
                      </FormModal>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-gray-500">
          {project.requiresApproval === false
            ? 'Workers can mark a task completed when the work is done. Project progress is the share of tasks marked done, excluding cancelled tasks.'
            : 'A worker can move a task to review when it is ready, and a manager approves it before it counts as completed. Project progress is the share of tasks marked done, excluding cancelled tasks.'}
        </p>
      </Panel>
      )}
      {tab === 'files' && (
        <Panel title="Files">
          {project.tasks.flatMap((item) => item.files || []).length === 0 ? <Notice tone="empty">No supporting files yet. Open a task to upload one.</Notice> : (
            <ul className="space-y-2 text-sm">
              {project.tasks.flatMap((item) => (item.files || []).map((file) => (
                <li key={file.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7faf8] px-3 py-2">
                  <span>{file.title}<span className="ml-2 text-xs text-gray-500">{item.title}</span></span>
                  <a className="text-xs font-medium text-emerald-700" href={`http://localhost:3000${file.fileUrl}`} target="_blank" rel="noreferrer">Download</a>
                </li>
              )))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
};

export default HbmsProjectDetail;
