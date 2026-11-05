import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiOrigin } from '../../../apiOrigin';
import hbmsApi, {
  apiError,
  formatDate,
  optionLabel,
  programKindOptions,
  programStatusOptions,
} from './api';
import { Field, FormModal, Notice, Panel, PrimaryButton, StatusBadge, inputClass } from './ui';

const enrollmentOptions = [
  ['REGISTERED', 'Registered'],
  ['ACTIVE', 'Active'],
  ['COMPLETED', 'Completed'],
  ['WITHDRAWN', 'Withdrawn'],
];

const assignmentOptions = [
  ['ASSIGNMENT', 'Weekly assignment'],
  ['ASSESSMENT', 'Assessment'],
  ['PROJECT', 'Final project'],
];

function personName(person) {
  return person ? `${person.firstName} ${person.lastName}` : 'Unassigned';
}

const HbmsProgramDetail = () => {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [trainer, setTrainer] = useState({ employeeId: '', role: 'TRAINER' });
  const [session, setSession] = useState({ title: '', startsAt: '', location: '' });
  const [openSession, setOpenSession] = useState(null);
  const [learnerMode, setLearnerMode] = useState('external');
  const [learner, setLearner] = useState({ employeeId: '', firstName: '', lastName: '', email: '' });
  const [assignment, setAssignment] = useState({ title: '', kind: 'ASSIGNMENT', dueDate: '', description: '' });
  const [scores, setScores] = useState({});
  const [outcomes, setOutcomes] = useState('');
  const [report, setReport] = useState({ title: '', body: '' });
  const [modal, setModal] = useState('');

  const load = async () => {
    const [programRes, workerRes] = await Promise.all([
      hbmsApi.get(`/programs/${id}`),
      hbmsApi.get('/employees?limit=100'),
    ]);
    setProgram(programRes.data.data);
    setWorkers(workerRes.data.data);
    setOutcomes(programRes.data.data.outcomes || '');
  };

  useEffect(() => {
    let active = true;
    load()
      .catch((err) => {
        if (active) setError(apiError(err, 'Could not load program'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const save = async (body, message) => {
    try {
      await hbmsApi.patch(`/programs/${id}`, body);
      if (message) toast.success(message);
      setModal('');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not update program'));
    }
  };

  const addTrainer = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/programs/${id}/trainers`, trainer);
      toast.success('Trainer added');
      setModal('');
      setTrainer({ employeeId: '', role: trainer.role });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not add trainer'));
    }
  };

  const addSession = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/programs/${id}/sessions`, session);
      toast.success('Session added');
      setModal('');
      setSession({ title: '', startsAt: '', location: '' });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not add session'));
    }
  };

  const markAttendance = async (sessionId, participantId, status) => {
    try {
      await hbmsApi.put(`/programs/${id}/sessions/${sessionId}/attendance`, {
        records: [{ participantId, status }],
      });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not save attendance'));
    }
  };

  const register = async (event) => {
    event.preventDefault();
    const body = learnerMode === 'worker'
      ? { employeeId: learner.employeeId }
      : { firstName: learner.firstName, lastName: learner.lastName, email: learner.email };
    try {
      await hbmsApi.post(`/programs/${id}/enrollments`, body);
      toast.success(learnerMode === 'worker' ? 'Worker registered as a learner' : 'External student registered');
      setModal('');
      setLearner({ employeeId: '', firstName: '', lastName: '', email: '' });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not register participant'));
    }
  };

  const uploadMaterial = async (event) => {
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
      await hbmsApi.post(`/programs/${id}/materials`, body);
      toast.success('Material stored');
      setModal('');
      event.target.reset();
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not store material'));
    }
  };

  const addAssignment = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/programs/${id}/assignments`, assignment);
      toast.success('Assignment added');
      setModal('');
      setAssignment({ title: '', kind: assignment.kind, dueDate: '', description: '' });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not add assignment'));
    }
  };

  const grade = async (assignmentId, participantId) => {
    const score = scores[`${assignmentId}:${participantId}`];
    if (score === '' || score == null) {
      toast.error('Enter a score from 0 to 100');
      return;
    }
    try {
      await hbmsApi.put(`/programs/${id}/assignments/${assignmentId}/submissions/${participantId}`, {
        score,
        status: 'GRADED',
      });
      toast.success('Assessment recorded');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not record assessment'));
    }
  };

  const addReport = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/programs/${id}/reports`, report);
      toast.success('Report added');
      setModal('');
      setReport({ title: '', body: '' });
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not add report'));
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading program…</p>;
  if (error) return <Notice>{error}</Notice>;
  if (!program) return <Notice>Program not found.</Notice>;

  const enrolled = program.enrollments.filter((enrollment) => enrollment.status !== 'WITHDRAWN');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/admin/hbms/programs" className="text-xs font-medium text-green-700">Back to programs</Link>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{program.name}</h3>
          <p className="text-sm text-gray-500">
            {program.businessUnit?.name}
            {' · '}
            {optionLabel(programKindOptions, program.kind)}
            {program.coordinator ? ` · ${personName(program.coordinator)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{program.progress}%</span>
          <select className={inputClass} value={program.status} onChange={(e) => save({ status: e.target.value }, 'Program updated')}>
            {programStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full bg-green-600" style={{ width: `${program.progress}%` }} />
      </div>
      <dl className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Coordinator', program.coordinator ? personName(program.coordinator) : '—'],
          ['Start', formatDate(program.startDate)],
          ['End', formatDate(program.endDate)],
          ['Participants', program.capacity != null ? `${program.participantCount} of ${program.capacity}` : String(program.participantCount)],
          ['Trainers', String(program.trainers.length)],
          ['Sessions', String(program.sessions.length)],
          ['Assignments', String(program.assignments.length)],
          ['Completion', optionLabel(programStatusOptions, program.status)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
      {program.description && <p className="text-sm text-gray-700">{program.description}</p>}
      {program.objectives && <p className="text-sm text-gray-700"><span className="font-medium">Objectives. </span>{program.objectives}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Trainers and facilitators" action={<button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('trainer')}>Add trainer</button>}>
          <FormModal open={modal === 'trainer'} title="Add trainer" subtitle="A trainer is an existing worker." onClose={() => setModal('')}>
            <form className="space-y-3" onSubmit={addTrainer}>
              <Field label="Worker">
                <select className={inputClass} value={trainer.employeeId} onChange={(e) => setTrainer({ ...trainer, employeeId: e.target.value })} required>
                  <option value="">Worker</option>
                  {workers.map((worker) => <option key={worker.id} value={worker.id}>{personName(worker)} · {worker.staffCode}</option>)}
                </select>
              </Field>
              <Field label="Role">
                <select className={inputClass} value={trainer.role} onChange={(e) => setTrainer({ ...trainer, role: e.target.value })}>
                  <option value="TRAINER">Trainer</option>
                  <option value="FACILITATOR">Facilitator</option>
                </select>
              </Field>
              <div className="flex justify-end"><PrimaryButton type="submit">Add trainer</PrimaryButton></div>
            </form>
          </FormModal>
          {program.trainers.length === 0 ? <Notice tone="empty">No trainers yet. Adding a trainer does not create a new employee.</Notice> : (
            <ul className="space-y-2 text-sm">
              {program.trainers.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span>
                    <Link to={`/admin/hbms/workers/${item.employee.id}`} className="font-medium text-gray-900 hover:text-green-800">{personName(item.employee)}</Link>
                    <span className="ml-2 text-xs text-gray-500">{item.role === 'FACILITATOR' ? 'Facilitator' : 'Trainer'} · {item.employee.staffCode}</span>
                  </span>
                  <button type="button" className="text-xs text-red-600" onClick={async () => {
                    try {
                      await hbmsApi.delete(`/programs/${id}/trainers/${item.employeeId}`);
                      await load();
                    } catch (err) {
                      toast.error(apiError(err, 'Could not remove trainer'));
                    }
                  }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Training schedule" action={<button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('session')}>Add session</button>}>
          <FormModal open={modal === 'session'} title="Add session" onClose={() => setModal('')}>
            <form className="space-y-3" onSubmit={addSession}>
              <Field label="Title">
                <input className={inputClass} placeholder="Session title" value={session.title} onChange={(e) => setSession({ ...session, title: e.target.value })} required />
              </Field>
              <Field label="Date">
                <input type="date" className={inputClass} value={session.startsAt} onChange={(e) => setSession({ ...session, startsAt: e.target.value })} required />
              </Field>
              <Field label="Location">
                <input className={inputClass} placeholder="Location" value={session.location} onChange={(e) => setSession({ ...session, location: e.target.value })} />
              </Field>
              <div className="flex justify-end"><PrimaryButton type="submit">Add session</PrimaryButton></div>
            </form>
          </FormModal>
          {program.sessions.length === 0 ? <Notice tone="empty">No sessions yet.</Notice> : (
            <ul className="space-y-2 text-sm">
              {program.sessions.map((item) => (
                <li key={item.id} className="rounded-lg bg-gray-50 px-3 py-2">
                  <button type="button" className="w-full text-left" onClick={() => setOpenSession(openSession === item.id ? null : item.id)}>
                    <span className="font-medium text-gray-900">{item.title}</span>
                    <span className="ml-2 text-xs text-gray-500">{formatDate(item.startsAt)}{item.location ? ` · ${item.location}` : ''}</span>
                  </button>
                  {openSession === item.id && (
                    <div className="mt-2 space-y-1">
                      {enrolled.length === 0 ? <p className="text-xs text-gray-500">Register participants before taking attendance.</p> : enrolled.map((enrollment) => {
                        const current = item.attendance.find((row) => row.participantId === enrollment.participantId);
                        return (
                          <label key={enrollment.id} className="flex items-center justify-between gap-2 text-xs">
                            <span>{personName(enrollment.participant)}</span>
                            <select
                              className="rounded border border-gray-300 px-2 py-1"
                              value={current?.status || ''}
                              onChange={(e) => markAttendance(item.id, enrollment.participantId, e.target.value)}
                            >
                              <option value="">Attendance</option>
                              <option value="PRESENT">Present</option>
                              <option value="LATE">Late</option>
                              <option value="ABSENT">Absent</option>
                            </select>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Participants" action={<button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('learner')}>Register</button>}>
        <p className="mb-3 text-xs text-gray-500">
          A worker can also be a learner. An external student is registered here and is not added to the staff directory.
        </p>
        <FormModal open={modal === 'learner'} title="Register participant" onClose={() => setModal('')}>
        <form className="grid gap-3" onSubmit={register}>
          <select className={inputClass} value={learnerMode} onChange={(e) => setLearnerMode(e.target.value)}>
            <option value="external">External student</option>
            <option value="worker">Existing worker</option>
          </select>
          {learnerMode === 'worker' ? (
            <select className={`${inputClass} md:col-span-2`} value={learner.employeeId} onChange={(e) => setLearner({ ...learner, employeeId: e.target.value })} required>
              <option value="">Choose a worker</option>
              {workers.map((worker) => <option key={worker.id} value={worker.id}>{personName(worker)} · {worker.staffCode}</option>)}
            </select>
          ) : (
            <>
              <input className={inputClass} placeholder="First name" value={learner.firstName} onChange={(e) => setLearner({ ...learner, firstName: e.target.value })} required />
              <input className={inputClass} placeholder="Last name" value={learner.lastName} onChange={(e) => setLearner({ ...learner, lastName: e.target.value })} required />
              <input className={inputClass} type="email" placeholder="Email" value={learner.email} onChange={(e) => setLearner({ ...learner, email: e.target.value })} />
            </>
          )}
          <div className="flex justify-end"><PrimaryButton type="submit">Register</PrimaryButton></div>
        </form>
        </FormModal>
        {program.enrollments.length === 0 ? <Notice tone="empty">No one is registered yet.</Notice> : (
          <ul className="divide-y divide-gray-100 text-sm">
            {program.enrollments.map((enrollment) => {
              const worker = enrollment.participant.employee;
              return (
                <li key={enrollment.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium text-gray-900">{personName(enrollment.participant)}</span>
                    {worker ? (
                      <Link to={`/admin/hbms/workers/${worker.id}`} className="ml-2 text-xs text-green-700">Worker {worker.staffCode}</Link>
                    ) : (
                      <span className="ml-2 text-xs text-gray-500">External student</span>
                    )}
                  </span>
                  <select
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                    value={enrollment.status}
                    onChange={async (e) => {
                      try {
                        await hbmsApi.patch(`/programs/${id}/enrollments/${enrollment.id}`, { status: e.target.value });
                        await load();
                      } catch (err) {
                        toast.error(apiError(err, 'Could not update registration'));
                      }
                    }}
                  >
                    {enrollmentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Training materials">
          {(program.materials || []).length === 0 ? <p className="mb-2 text-xs text-gray-500">No materials yet.</p> : (
            <ul className="mb-3 space-y-1 text-sm">
              {program.materials.map((file) => (
                <li key={file.id}>
                  <a className="text-green-800 hover:underline" href={`${apiOrigin}${file.fileUrl}`} target="_blank" rel="noreferrer">{file.title}</a>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setModal('material')}>Upload material</button>
          <FormModal open={modal === 'material'} title="Upload material" onClose={() => setModal('')}>
            <form className="space-y-3" onSubmit={uploadMaterial}>
              <Field label="File">
                <input name="file" type="file" className="text-sm" />
              </Field>
              <div className="flex justify-end"><PrimaryButton type="submit">Upload</PrimaryButton></div>
            </form>
          </FormModal>
        </Panel>

        <Panel title="Reports and outcomes" action={(
          <span className="flex gap-2">
            <button type="button" className="rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-800" onClick={() => setModal('outcomes')}>Outcomes</button>
            <button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('report')}>Add report</button>
          </span>
        )}>
          <FormModal open={modal === 'outcomes'} title="Training outcomes" onClose={() => setModal('')}>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); save({ outcomes }, 'Outcomes saved'); }}>
              <Field label="Outcomes">
                <textarea className={inputClass} rows={4} value={outcomes} onChange={(e) => setOutcomes(e.target.value)} />
              </Field>
              <div className="flex justify-end"><PrimaryButton type="submit">Save outcomes</PrimaryButton></div>
            </form>
          </FormModal>
          <FormModal open={modal === 'report'} title="Add report" onClose={() => setModal('')}>
            <form className="space-y-3" onSubmit={addReport}>
              <Field label="Title">
                <input className={inputClass} placeholder="Report title" value={report.title} onChange={(e) => setReport({ ...report, title: e.target.value })} required />
              </Field>
              <Field label="What happened">
                <textarea className={inputClass} rows={3} placeholder="What happened" value={report.body} onChange={(e) => setReport({ ...report, body: e.target.value })} required />
              </Field>
              <div className="flex justify-end"><PrimaryButton type="submit">Add report</PrimaryButton></div>
            </form>
          </FormModal>
          {program.reports.length === 0 ? <Notice tone="empty">No reports yet.</Notice> : (
            <ul className="space-y-2 text-sm">
              {program.reports.map((item) => (
                <li key={item.id} className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-gray-700">{item.body}</p>
                  <p className="text-[11px] text-gray-500">{formatDate(item.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Assignments and assessments" action={<button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('assignment')}>Add assignment</button>}>
        <FormModal open={modal === 'assignment'} wide title="Add assignment" onClose={() => setModal('')}>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={addAssignment}>
            <div className="md:col-span-2">
              <Field label="Title">
                <input className={inputClass} placeholder="Title" value={assignment.title} onChange={(e) => setAssignment({ ...assignment, title: e.target.value })} required />
              </Field>
            </div>
            <Field label="Type">
              <select className={inputClass} value={assignment.kind} onChange={(e) => setAssignment({ ...assignment, kind: e.target.value })}>
                {assignmentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Due">
              <input type="date" className={inputClass} value={assignment.dueDate} onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Instructions">
                <input className={inputClass} placeholder="Instructions" value={assignment.description} onChange={(e) => setAssignment({ ...assignment, description: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end md:col-span-2"><PrimaryButton type="submit">Add assignment</PrimaryButton></div>
          </form>
        </FormModal>
        {program.assignments.length === 0 ? <Notice tone="empty">No assignments yet. Weekly work and the final project are recorded here.</Notice> : (
          <ul className="space-y-4">
            {program.assignments.map((item) => (
              <li key={item.id} className="rounded-lg border border-gray-100 p-3">
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">
                  <StatusBadge value={item.kind} label={optionLabel(assignmentOptions, item.kind)} />
                  <span className="ml-2">due {formatDate(item.dueDate)}</span>
                </p>
                {item.description && <p className="mt-1 text-sm text-gray-700">{item.description}</p>}
                {enrolled.length === 0 ? <p className="mt-2 text-xs text-gray-500">Register participants before grading.</p> : (
                  <ul className="mt-2 space-y-2">
                    {enrolled.map((enrollment) => {
                      const submission = item.submissions.find((row) => row.participantId === enrollment.participantId);
                      const key = `${item.id}:${enrollment.participantId}`;
                      return (
                        <li key={enrollment.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="min-w-40">{personName(enrollment.participant)}</span>
                          <input
                            className="w-24 rounded-lg border border-gray-300 px-2 py-1"
                            inputMode="numeric"
                            placeholder={submission?.score != null ? String(submission.score) : 'Score'}
                            value={scores[key] ?? (submission?.score ?? '')}
                            onChange={(e) => setScores({ ...scores, [key]: e.target.value })}
                          />
                          <span className="text-xs text-gray-500">{submission ? optionLabel([['PENDING', 'Pending'], ['SUBMITTED', 'Submitted'], ['GRADED', 'Graded']], submission.status) : 'Not recorded'}</span>
                          <button type="button" className="rounded-lg border border-green-200 px-2 py-1 text-xs font-medium text-green-700" onClick={() => grade(item.id, enrollment.participantId)}>Save</button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-gray-500">
          Progress is the share of registered learners with a graded result, across every assignment.
        </p>
      </Panel>
    </div>
  );
};

export default HbmsProgramDetail;
