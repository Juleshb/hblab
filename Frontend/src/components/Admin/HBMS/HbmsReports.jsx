import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import hbmsApi, {
  apiError,
  employmentLabel,
  formatDate,
  formatMoney,
  moneyPartyFields,
  moneyPartyOptions,
  optionLabel,
  programKindOptions,
  projectCategoryOptions,
} from './api';
import { Field, FormModal, Notice, PrimaryButton, Segmented, StatusBadge, inputClass } from './ui';

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  };
  return { from: iso(from), to: iso(to) };
}

function Ring({ percent, color, label, caption }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  const drawn = (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center text-center">
      <svg viewBox="0 0 140 140" className="h-36 w-36">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef2f0" strokeWidth="12" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${drawn} ${circumference}`} transform="rotate(-90 70 70)" />
        <text x="70" y="76" textAnchor="middle" fill="#111827" fontSize="22" fontWeight="700">{value}%</text>
      </svg>
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{caption}</p>
    </div>
  );
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

function Indicator({ item }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{item.label}</p>
      <p className="text-sm text-gray-900">{item.value}</p>
      {item.detail ? <p className="text-xs text-gray-500">{item.detail}</p> : null}
    </div>
  );
}

const HbmsReports = () => {
  const initial = monthRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState({ projectId: '', amount: '', description: '', spentOn: '', spentBy: '' });
  const [expenseParties, setExpenseParties] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const load = async (start = from, end = to) => {
    setLoading(true);
    setError('');
    try {
      const response = await hbmsApi.get(`/reports?from=${start}&to=${end}`);
      setReport(response.data.data);
    } catch (err) {
      setError(apiError(err, 'Could not build the reports'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(initial.from, initial.to);
  }, []);

  useEffect(() => {
    if (!expenseOpen || !expense.projectId) {
      setExpenseParties([]);
      return undefined;
    }
    let active = true;
    hbmsApi.get(`/projects/${expense.projectId}`)
      .then((response) => {
        if (active) setExpenseParties(moneyPartyOptions(response.data.data));
      })
      .catch(() => {
        if (active) setExpenseParties([]);
      });
    return () => {
      active = false;
    };
  }, [expenseOpen, expense.projectId]);

  const recordExpense = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const spentBy = moneyPartyFields(expense.spentBy);
      await hbmsApi.post('/reports/expenses', {
        projectId: expense.projectId,
        amount: Number(expense.amount),
        description: expense.description,
        spentOn: expense.spentOn,
        spentByKind: spentBy.kind,
        spentById: spentBy.id,
      });
      setExpense({ projectId: '', amount: '', description: '', spentOn: '', spentBy: '' });
      setExpenseOpen(false);
      await load();
      toast.success('Expense recorded');
    } catch (err) {
      toast.error(apiError(err, 'Could not record the expense'));
    } finally {
      setSaving(false);
    }
  };

  const trackedProjects = (report?.projects || []).filter((project) => project.financial.enabled);
  const [section, setSection] = useState('overview');
  const budgeted = trackedProjects.reduce((sum, project) => sum + project.financial.budget, 0);
  const spent = trackedProjects.reduce((sum, project) => sum + project.financial.actual, 0);
  const remaining = trackedProjects.reduce((sum, project) => sum + project.financial.remaining, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">Delivery, deadlines, attendance, and training in one briefing. Completed tasks are counted, and they are not the rating.</p>
        </div>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
        >
          <Field label="From">
            <input className={inputClass} type="date" value={from} onChange={(event) => setFrom(event.target.value)} required />
          </Field>
          <Field label="To">
            <input className={inputClass} type="date" value={to} onChange={(event) => setTo(event.target.value)} required />
          </Field>
          <PrimaryButton type="submit">Update</PrimaryButton>
          {trackedProjects.length > 0 && (
            <button type="button" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800" onClick={() => setExpenseOpen(true)}>Record expense</button>
          )}
        </form>
      </div>
      {error ? <Notice>{error}</Notice> : null}

      {loading ? <p className="text-sm text-gray-500">Building reports…</p> : null}

      {report ? (
        <>
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">Delivery briefing</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-600">{report.organization.summary}</p>
              </div>
              <p className="text-xs text-gray-400">{formatDate(report.period.from)} – {formatDate(report.period.to)}</p>
            </div>
            <div className="mt-4 grid items-center gap-4 md:grid-cols-3">
              {report.units.map((unit) => (
                <Ring
                  key={unit.id}
                  percent={unit.averageProgress}
                  color={unit.name === 'HBStudio' ? '#7c3aed' : '#15803d'}
                  label={unit.name}
                  caption={`${unit.activeProjects} active · ${unit.overdueTasks} overdue`}
                />
              ))}
              <Ring percent={report.organization.averageProgress} color="#0f766e" label="Active delivery" caption={`${report.organization.activeProjects} active projects`} />
            </div>
            {trackedProjects.length > 0 && (
              <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3">
                <div className="flex flex-wrap items-end justify-between gap-2 text-sm">
                  <span className="font-medium text-gray-900">Budget used</span>
                  <span className="text-gray-600">{formatMoney(spent)} of {formatMoney(budgeted)} · {formatMoney(remaining)} left</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
                  <div className={`h-full rounded-full ${spent > budgeted ? 'bg-rose-500' : 'bg-emerald-600'}`} style={{ width: `${budgeted ? Math.min(100, Math.round((spent / budgeted) * 100)) : 0}%` }} />
                </div>
              </div>
            )}
          </section>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric tone="border-emerald-100 bg-emerald-50 text-emerald-700" icon="carbon:folder" value={report.organization.activeProjects} label="Active projects" detail={`${report.projects.length} in the report`} />
            <Metric tone="border-sky-100 bg-sky-50 text-sky-700" icon="carbon:task" value={report.organization.openTasks} label="Open tasks" detail={`${report.organization.overdueTasks} overdue`} />
            <Metric tone="border-violet-100 bg-violet-50 text-violet-700" icon="carbon:group" value={report.workers.length} label="People" detail={`${report.workers.filter((worker) => worker.workload.open).length} with open work`} />
            <Metric tone="border-amber-100 bg-amber-50 text-amber-700" icon="carbon:education" value={report.organization.enrolledParticipants} label="Enrolled" detail={report.programs.filter((program) => program.status === 'ACTIVE').length === 1 ? '1 active program' : `${report.programs.filter((program) => program.status === 'ACTIVE').length} active programs`} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {report.units.map((unit) => (
              <article key={unit.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${unit.name === 'HBStudio' ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'}`}>{unit.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{unit.averageProgress}%</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{unit.summary}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    ['People', unit.workers],
                    ['Open tasks', unit.openTasks],
                    ['Overdue', unit.overdueTasks],
                    ['Hours', unit.attendanceHours],
                    ['Programs', unit.activePrograms],
                    ['Projects', unit.activeProjects],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-gray-50 px-2 py-2">
                      <dt className="text-[11px] text-gray-500">{label}</dt>
                      <dd className="text-lg font-semibold text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>

          <Segmented
            value={section}
            onChange={setSection}
            options={[['overview', 'Attention'], ['projects', 'Projects'], ['staff', 'Staff'], ['finance', 'Finance']]}
          />

          {section === 'staff' && (
          <section className="space-y-3">
            {[...report.workers].sort((a, b) => b.tasksOverdue - a.tasksOverdue || b.workload.open - a.workload.open).map((worker) => {
              const onTime = worker.tasksCompleted ? Math.round((worker.tasksOnTime / worker.tasksCompleted) * 100) : 0;
              const parts = worker.name.split(' ');
              const mark = `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
              return (
                <article key={worker.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${worker.businessUnit.name === 'HBStudio' ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'}`}>{mark}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{worker.name}</h3>
                        <StatusBadge value={worker.lens} label={worker.roleLabel} />
                      </div>
                      <p className="text-xs text-gray-500">{[worker.staffCode, worker.position, employmentLabel(worker.employmentType), worker.department, worker.businessUnit.name].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700">{worker.reading}</p>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-gray-500">
                      <span>On time</span>
                      <span>{worker.tasksCompleted ? `${onTime}% of ${worker.tasksCompleted}` : 'No completed tasks'}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${onTime}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                    {[
                      ['Completed', worker.tasksCompleted],
                      ['Overdue', worker.tasksOverdue],
                      ['Open', worker.workload.open],
                      ['Leave', worker.attendance.leaveDays],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-gray-50 px-2 py-2">
                        <p className="text-[11px] text-gray-500">{label}</p>
                        <p className="text-lg font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                  {worker.overdueTitles.length ? <p className="mt-3 text-xs text-amber-800">Overdue: {worker.overdueTitles.join(' · ')}</p> : null}
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {worker.indicators.map((item) => <Indicator key={item.label} item={item} />)}
                  </div>
                </article>
              );
            })}
          </section>
          )}

          {section === 'projects' && (
          <section className="space-y-3">
            {[...report.projects].sort((a, b) => b.outstanding.overdue - a.outstanding.overdue || a.progress - b.progress).map((project) => {
              const studio = project.businessUnit.name === 'HBStudio';
              const spentShare = project.financial.enabled && project.financial.budget
                ? Math.min(100, Math.round((project.financial.actual / project.financial.budget) * 100))
                : 0;
              return (
                <article key={project.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-gray-400">{project.code}</p>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-xs text-gray-500">
                        {project.businessUnit.name} · {optionLabel(projectCategoryOptions, project.category)}
                        {project.manager ? ` · ${project.manager}` : ''}
                      </p>
                    </div>
                    <StatusBadge value={project.status} />
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-gray-500"><span>Progress</span><span>{project.progress}%</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full ${studio ? 'bg-violet-500' : 'bg-emerald-600'}`} style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-gray-50 px-2 py-2"><p className="text-[11px] text-gray-500">Milestones</p><p className="text-lg font-semibold text-gray-900">{project.milestones.completed}/{project.milestones.total}</p></div>
                    <div className="rounded-2xl bg-gray-50 px-2 py-2"><p className="text-[11px] text-gray-500">Open</p><p className="text-lg font-semibold text-gray-900">{project.outstanding.count}</p></div>
                    <div className="rounded-2xl bg-amber-50 px-2 py-2"><p className="text-[11px] text-amber-700">Overdue</p><p className="text-lg font-semibold text-gray-900">{project.outstanding.overdue}</p></div>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    {project.deadline.rate == null
                      ? 'No completed tasks to measure against the deadline.'
                      : `${project.deadline.onTime} of ${project.deadline.completed} completed tasks met the deadline (${project.deadline.rate}%).`}
                    {project.outstanding.titles.length ? ` Overdue: ${project.outstanding.titles.join(' · ')}.` : ''}
                  </p>
                  {project.financial.enabled && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-gray-500">
                        <span>Spent {formatMoney(project.financial.actual, project.financial.currency)}</span>
                        <span>of {formatMoney(project.financial.budget, project.financial.currency)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${project.financial.actual > project.financial.budget ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: `${spentShare}%` }} />
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
          )}

          {section === 'finance' && (
          <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            {trackedProjects.length === 0 ? <p className="text-sm text-gray-500">No project has a budget yet.</p> : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-emerald-50 px-3 py-3"><p className="text-xs text-emerald-800">Budget</p><p className="text-xl font-semibold text-gray-900">{formatMoney(budgeted)}</p></div>
                  <div className="rounded-2xl bg-sky-50 px-3 py-3"><p className="text-xs text-sky-800">Spent</p><p className="text-xl font-semibold text-gray-900">{formatMoney(spent)}</p></div>
                  <div className="rounded-2xl bg-amber-50 px-3 py-3"><p className="text-xs text-amber-800">Remaining</p><p className="text-xl font-semibold text-gray-900">{formatMoney(remaining)}</p></div>
                </div>
                <ul className="mt-4 space-y-4">
                  {trackedProjects.map((project) => {
                    const share = project.financial.budget ? Math.min(100, Math.round((project.financial.actual / project.financial.budget) * 100)) : 0;
                    return (
                      <li key={project.id}>
                        <div className="mb-1 flex justify-between gap-3 text-sm">
                          <span className="font-medium text-gray-900">{project.code} · {project.name}</span>
                          <span className="text-gray-500">{formatMoney(project.financial.remaining, project.financial.currency)} left</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <div className={`h-full rounded-full ${project.financial.actual > project.financial.budget ? 'bg-rose-500' : 'bg-emerald-600'}`} style={{ width: `${share}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{formatMoney(project.financial.actual, project.financial.currency)} spent of {formatMoney(project.financial.budget, project.financial.currency)}{project.financial.pending ? ` · ${formatMoney(project.financial.pending, project.financial.currency)} pending` : ''}</p>
                        <p className="mt-1 text-xs text-gray-500">Paid {formatMoney(project.financial.paid, project.financial.currency)} · profit {formatMoney(project.financial.profit, project.financial.currency)} · still owed {formatMoney(project.financial.repayment, project.financial.currency)}</p>
                      </li>
                    );
                  })}
                </ul>
                <button type="button" className="mt-4 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setExpenseOpen(true)}>Record expense</button>
              </>
            )}
          </section>
          )}

          {section === 'overview' && (
          <section className="space-y-3">
            <h3 className="font-semibold text-gray-900">Programs and what needs attention</h3>
            {report.projects.every((project) => !project.outstanding.overdue) ? <p className="text-sm text-gray-500">Nothing is overdue in this period.</p> : null}
            {report.projects.filter((project) => project.outstanding.overdue).map((project) => (
              <article key={project.id} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-gray-900">{project.code} · {project.name}</span>
                  <span className="text-xs text-amber-800">{project.outstanding.overdue} overdue of {project.outstanding.count} open tasks</span>
                </span>
                <span className="text-sm font-semibold text-gray-900">{project.progress}%</span>
              </article>
            ))}
            {report.programs.map((program) => {
              const enrolledShare = program.capacity ? Math.round((program.enrolled / program.capacity) * 100) : null;
              return (
                <article key={program.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{program.name}</h3>
                      <p className="text-xs text-gray-500">{program.businessUnit.name} · {optionLabel(programKindOptions, program.kind)}{program.coordinator ? ` · ${program.coordinator}` : ''}</p>
                    </div>
                    <StatusBadge value={program.status} />
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{program.enrolled} enrolled{program.capacity ? ` of ${program.capacity}` : ''}</p>
                  {enrolledShare !== null && (
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, enrolledShare)}%` }} />
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      ['Attendance', program.attendanceRate],
                      ['Assignments', program.assignmentCompletion],
                      ['Completion', program.completionRate],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-gray-50 px-2 py-2">
                        <p className="text-[11px] text-gray-500">{label}</p>
                        <p className="text-lg font-semibold text-gray-900">{value == null ? '—' : `${value}%`}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-gray-500">{program.outcomes || 'No training outcomes recorded yet.'}{program.averageScore != null ? ` Average graded score ${program.averageScore}.` : ''}</p>
                </article>
              );
            })}
          </section>
          )}
          <FormModal open={expenseOpen} title="Record expense" subtitle="Only projects with a budget can take an expense. Amounts are in RWF." onClose={() => setExpenseOpen(false)}>
            <form className="space-y-3" onSubmit={recordExpense}>
              <Field label="Project">
                <select className={inputClass} value={expense.projectId} onChange={(event) => setExpense((current) => ({ ...current, projectId: event.target.value, spentBy: '' }))} required>
                  <option value="">Choose a budgeted project</option>
                  {trackedProjects.map((project) => (
                    <option key={project.id} value={project.id}>{project.code} · {project.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Amount (RWF)">
                <input className={inputClass} inputMode="numeric" value={expense.amount} onChange={(event) => setExpense((current) => ({ ...current, amount: event.target.value }))} required />
              </Field>
              <Field label="Description">
                <input className={inputClass} value={expense.description} onChange={(event) => setExpense((current) => ({ ...current, description: event.target.value }))} required />
              </Field>
              <Field label="Date">
                <input type="date" className={inputClass} value={expense.spentOn} onChange={(event) => setExpense((current) => ({ ...current, spentOn: event.target.value }))} />
              </Field>
              <Field label="Who used it">
                <select className={inputClass} value={expense.spentBy} onChange={(event) => setExpense((current) => ({ ...current, spentBy: event.target.value }))} required disabled={!expense.projectId}>
                  <option value="">{expense.projectId ? 'Choose the client or a team member' : 'Choose a project first'}</option>
                  {expenseParties.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <div className="flex justify-end">
                <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record expense'}</PrimaryButton>
              </div>
            </form>
          </FormModal>
        </>
      ) : null}
    </div>
  );
};

export default HbmsReports;
