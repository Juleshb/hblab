import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import hbmsApi, { accessRoleLabel, apiError, employmentLabel, formatDate } from './api';
import { Field, FormModal, Notice, Panel, PrimaryButton, StatusBadge, WorkerAvatar, inputClass } from './ui';
import { apiOrigin } from '../../../apiOrigin';

const emptyExperience = { title: '', organization: '', startDate: '', endDate: '', description: '' };
const emptyLeave = { startDate: '', endDate: '', reason: '' };

const HbmsWorkerProfile = () => {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [experience, setExperience] = useState(emptyExperience);
  const [modal, setModal] = useState('');
  const [leave, setLeave] = useState(emptyLeave);
  const [documentForm, setDocumentForm] = useState({ title: '', kind: 'CONTRACT', file: null });
  const [photoFile, setPhotoFile] = useState(null);
  const [issuedPassword, setIssuedPassword] = useState('');
  const [loginForm, setLoginForm] = useState({ name: '', email: '', password: '' });

  const load = async () => {
    const response = await hbmsApi.get(`/employees/${id}`);
    setWorker(response.data.data);
  };

  useEffect(() => {
    let active = true;
    load()
      .catch((err) => {
        if (active) setError(apiError(err, 'Could not load this profile'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const addExperience = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/employees/${id}/experience`, experience);
      toast.success('Experience added');
      setModal('');
      setExperience(emptyExperience);
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not add experience'));
    }
  };

  const removeExperience = async (experienceId) => {
    try {
      await hbmsApi.delete(`/employees/${id}/experience/${experienceId}`);
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not remove experience'));
    }
  };

  const uploadDocument = async (event) => {
    event.preventDefault();
    if (!documentForm.file) {
      toast.error('Choose a file');
      return;
    }
    const body = new FormData();
    body.append('title', documentForm.title || documentForm.file.name);
    body.append('kind', documentForm.kind);
    body.append('file', documentForm.file);
    try {
      await hbmsApi.post(`/employees/${id}/documents`, body);
      toast.success('Document stored');
      setModal('');
      setDocumentForm({ title: '', kind: 'CONTRACT', file: null });
      event.target.reset();
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not store document'));
    }
  };

  const requestLeave = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post('/employees/leave', { ...leave, employeeId: id });
      toast.success('Leave request submitted');
      setModal('');
      setLeave(emptyLeave);
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not submit leave'));
    }
  };

  const saveLogin = async (reset) => {
    try {
      const response = await hbmsApi.post(`/employees/${id}/account`, { reset });
      setIssuedPassword(response.data.data.temporaryPassword || '');
      toast.success(response.data.data.temporaryPassword ? 'Copy the temporary password below' : 'Access updated from this worker’s responsibilities');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not save the login'));
    }
  };

  const openLogin = () => {
    setLoginForm({
      name: worker.login?.name || `${worker.firstName} ${worker.lastName}`,
      email: worker.login?.email || worker.email,
      password: '',
    });
    setModal('login');
  };

  const saveLoginDetails = async (event) => {
    event.preventDefault();
    if (loginForm.password && loginForm.password.length < 8) {
      toast.error('Use at least 8 characters for the password');
      return;
    }
    try {
      await hbmsApi.post(`/employees/${id}/account`, {
        name: loginForm.name,
        email: loginForm.email,
        password: loginForm.password,
      });
      toast.success(loginForm.password ? 'Login updated. Share the new password with this person.' : 'Login updated');
      setLoginForm((current) => ({ ...current, password: '' }));
      setModal('');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not update the login'));
    }
  };

  const uploadPhoto = async (event) => {
    event.preventDefault();
    if (!photoFile) {
      toast.error('Choose a picture');
      return;
    }
    const body = new FormData();
    body.append('file', photoFile);
    try {
      await hbmsApi.post(`/employees/${id}/photo`, body);
      toast.success('Profile picture saved');
      setPhotoFile(null);
      setModal('');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not save the profile picture'));
    }
  };

  const decideLeave = async (requestId, decision) => {
    try {
      await hbmsApi.post(`/employees/leave/${requestId}/decision`, { decision });
      toast.success(decision === 'APPROVED' ? 'Leave approved' : 'Leave rejected');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Could not update leave request'));
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading profile…</p>;
  if (error) return <Notice>{error}</Notice>;
  if (!worker) return <Notice>Worker not found.</Notice>;

  const attendanceLabel = {
    OFFICE: 'Office check-in',
    REMOTE: 'Remote check-in',
    EVENT: 'Event hours',
    FLEXIBLE: 'Flexible',
  }[worker.attendancePolicy] || 'Office check-in';
  const projects = worker.memberships || [];
  const tasks = worker.assignments || [];
  const documents = worker.documents || [];
  const leaveRequests = worker.leaveRequests || [];
  const experiences = worker.experiences || [];
  const openTasks = tasks.filter((item) => !['DONE', 'CANCELLED'].includes(item.task.status)).length;
  const studio = worker.businessUnit?.name === 'HBStudio';
  const facts = [
    ['Department', worker.department?.name || '—'],
    ['Position', worker.position?.title || '—'],
    ['Employment', employmentLabel(worker.employmentType)],
    ['Supervisor', worker.reportsTo ? `${worker.reportsTo.firstName} ${worker.reportsTo.lastName}` : '—'],
    ['Attendance', attendanceLabel],
    ['Email', worker.login?.linked ? worker.login.email : worker.email],
    ['Phone', worker.phone || '—'],
    ['Business unit', worker.businessUnit?.name || '—'],
  ];
  const stats = [
    ['Projects', projects.length],
    ['Open tasks', openTasks],
    ['Documents', documents.length],
    ['Leave requests', leaveRequests.length],
  ];

  return (
    <div className="space-y-4">
      <FormModal open={modal === 'photo'} title="Profile picture" subtitle={`${worker.firstName} ${worker.lastName}`} onClose={() => setModal('')}>
        <form className="space-y-3" onSubmit={uploadPhoto}>
          <Field label="Picture">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-gray-700"
              onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
              required
            />
          </Field>
          <p className="text-xs text-gray-500">JPEG, PNG, or WebP. Up to 5 MB. The picture is stored with the worker, not in the database.</p>
          <div className="flex justify-end">
            <PrimaryButton type="submit">Save picture</PrimaryButton>
          </div>
        </form>
      </FormModal>
      <Link to="/admin/hbms/workers" className="text-xs font-medium text-emerald-700">Back to workers</Link>

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className={`px-5 py-6 text-white sm:px-6 ${studio ? 'bg-gradient-to-r from-violet-950 to-violet-700' : 'bg-gradient-to-r from-[#2e6b57] to-emerald-600'}`}>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex flex-col items-start gap-2">
              <WorkerAvatar worker={worker} className="h-20 w-20 rounded-3xl bg-white/15 text-2xl tracking-wide text-white" />
              <button type="button" className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white hover:bg-white/25" onClick={() => setModal('photo')}>
                {worker.photoKey ? 'Change photo' : 'Add photo'}
              </button>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">{worker.staffCode}</p>
              <h2 className="text-2xl font-semibold">{worker.firstName} {worker.lastName}</h2>
              <p className="mt-1 text-sm text-white/80">
                {worker.position?.title || employmentLabel(worker.employmentType)}
                {worker.department?.name ? ` · ${worker.department.name}` : ''}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">{worker.businessUnit?.name}</span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-900">{worker.status.replaceAll('_', ' ')}</span>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">{employmentLabel(worker.employmentType)}</span>
              </div>
            </div>
          </div>
        </div>
        <dl className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="mt-0.5 break-words text-sm font-medium text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-4 border-t border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs text-gray-500">Skills</p>
            {(worker.skills || []).length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No skills recorded</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {worker.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">{skill}</span>
                ))}
              </div>
            )}
          </div>
          {worker.position?.responsibilities ? (
            <div>
              <p className="text-xs text-gray-500">Position responsibilities</p>
              <p className="mt-1 text-sm text-gray-800">{worker.position.responsibilities}</p>
            </div>
          ) : null}
          {(worker.directReports || []).length > 0 ? (
            <div>
              <p className="text-xs text-gray-500">Direct reports</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {worker.directReports.map((person) => (
                  <Link key={person.id} to={`/admin/hbms/workers/${person.id}`} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-emerald-50 hover:text-emerald-800">
                    {person.firstName} {person.lastName}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <article key={label} className="rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          </article>
        ))}
      </div>

      <Panel title="Login">
        <p className="text-sm text-gray-600">Access follows the departments, projects, and programs this person actually handles.</p>
        {issuedPassword ? (
          <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="text-xs font-medium uppercase tracking-wide">Temporary password</p>
            <p className="mt-1 font-mono text-base">{issuedPassword}</p>
            <p className="mt-1 text-xs">Shown only now, and emailed to {worker.login?.email || worker.email}. They sign in with that address and should change it from Settings.</p>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-700">{worker.login?.linked ? worker.login.email : 'No login yet'}</p>
            {worker.login?.linked && worker.login.name ? <p className="mt-1 text-xs text-gray-500">{worker.login.name}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {(worker.login?.linked ? worker.login.currentRoles : worker.login?.roles || []).map((role) => (
                <span key={role} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">{accessRoleLabel(role)}</span>
              ))}
            </div>
            <ul className="mt-3 space-y-1 text-xs text-gray-500">
              {(worker.login?.reasons || []).map((item) => (
                <li key={item.role}>{accessRoleLabel(item.role)} — {item.because}</li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            {worker.login?.linked ? (
              <>
                <Link to={`/admin/hbms/messages?worker=${worker.id}`} className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white">Message</Link>
                {worker.login.canManage ? (
                  <>
                    <button type="button" className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700" onClick={openLogin}>Edit login</button>
                    <button type="button" className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700" onClick={() => saveLogin(false)}>Update access</button>
                    <PrimaryButton type="button" onClick={() => saveLogin(true)}>Reset password</PrimaryButton>
                  </>
                ) : null}
              </>
            ) : worker.login?.canManage ? (
              <PrimaryButton type="button" onClick={() => saveLogin(false)}>Create login</PrimaryButton>
            ) : null}
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {(worker.learnerProfile?.enrollments || []).length > 0 && (
          <Panel title="Learning">
            <ul className="space-y-2 text-sm">
              {worker.learnerProfile.enrollments.map((enrollment) => (
                <li key={enrollment.id}>
                  <Link to={`/admin/hbms/programs/${enrollment.program.id}`} className="font-medium text-gray-900 hover:text-green-800">
                    {enrollment.program.name}
                  </Link>
                  <span className="ml-2 text-xs text-gray-500">{enrollment.status} · also a learner, still a worker</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel title="Assigned work">
          {projects.length === 0 && tasks.length === 0 ? (
            <Notice tone="empty">No projects or tasks are assigned yet.</Notice>
          ) : (
            <div className="space-y-3 text-sm">
              {projects.map((membership) => {
                const collaborating = (membership.project.departments || [])
                  .map((link) => link.department)
                  .filter((department) => department.id !== worker.departmentId);
                return (
                  <Link key={membership.id} to={`/admin/hbms/projects/${membership.project.id}`} className="block rounded-lg bg-gray-50 px-3 py-2">
                    <span className="font-medium text-gray-900">{membership.project.name}</span>
                    <span className="ml-2 text-xs text-gray-500">{membership.role} · {membership.project.status}</span>
                    {collaborating.length > 0 && (
                      <span className="mt-1 block text-xs text-gray-500">
                        Collaborating with {collaborating.map((department) => `${department.name} (${department.businessUnit.name})`).join(', ')}
                      </span>
                    )}
                  </Link>
                );
              })}
              {tasks.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between gap-3">
                  <span>
                    <span className="font-medium text-gray-900">{assignment.task.title}</span>
                    <span className="block text-xs text-gray-500">{assignment.task.project?.name} · due {formatDate(assignment.task.dueDate)}</span>
                  </span>
                  <StatusBadge value={assignment.task.status} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Professional experience" action={<button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('experience')}>Add experience</button>}>
          <FormModal open={modal === 'experience'} title="Add experience" onClose={() => setModal('')}>
            <form className="space-y-3" onSubmit={addExperience}>
              <Field label="Role">
                <input className={inputClass} placeholder="Role" value={experience.title} onChange={(e) => setExperience({ ...experience, title: e.target.value })} required />
              </Field>
              <Field label="Organization">
                <input className={inputClass} placeholder="Organization" value={experience.organization} onChange={(e) => setExperience({ ...experience, organization: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start">
                  <input type="date" className={inputClass} value={experience.startDate} onChange={(e) => setExperience({ ...experience, startDate: e.target.value })} />
                </Field>
                <Field label="End">
                  <input type="date" className={inputClass} value={experience.endDate} onChange={(e) => setExperience({ ...experience, endDate: e.target.value })} />
                </Field>
              </div>
              <Field label="What they did">
                <textarea className={inputClass} rows={3} value={experience.description} onChange={(e) => setExperience({ ...experience, description: e.target.value })} />
              </Field>
              <div className="flex justify-end"><PrimaryButton type="submit">Add experience</PrimaryButton></div>
            </form>
          </FormModal>
          {experiences.length === 0 ? <Notice tone="empty">No experience recorded.</Notice> : (
            <ul className="space-y-2 text-sm">
              {experiences.map((item) => (
                <li key={item.id} className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{item.title}{item.organization ? ` · ${item.organization}` : ''}</span>
                    <button type="button" className="text-xs text-red-600" onClick={() => removeExperience(item.id)}>Remove</button>
                  </div>
                  <p className="text-xs text-gray-500">{formatDate(item.startDate)} – {item.endDate ? formatDate(item.endDate) : 'Present'}</p>
                  {item.description && <p className="mt-1 text-gray-700">{item.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Contracts and documents" action={<button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('document')}>Upload</button>}>
          <FormModal open={modal === 'document'} title="Upload document" onClose={() => setModal('')}>
            <form className="space-y-3" onSubmit={uploadDocument}>
              <Field label="Title">
                <input className={inputClass} value={documentForm.title} onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })} placeholder="Employment contract" />
              </Field>
              <Field label="Type">
                <select className={inputClass} value={documentForm.kind} onChange={(e) => setDocumentForm({ ...documentForm, kind: e.target.value })}>
                  {['CONTRACT', 'IDENTIFICATION', 'CERTIFICATE', 'OTHER'].map((kind) => <option key={kind} value={kind}>{kind}</option>)}
                </select>
              </Field>
              <Field label="File">
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.webp" className="text-sm" onChange={(e) => setDocumentForm({ ...documentForm, file: e.target.files?.[0] || null })} />
              </Field>
              <div className="flex justify-end"><PrimaryButton type="submit">Upload</PrimaryButton></div>
            </form>
          </FormModal>
          {documents.length === 0 ? <Notice tone="empty">No documents stored.</Notice> : (
            <ul className="space-y-2 text-sm">
              {documents.map((document) => (
                <li key={document.id} className="flex items-center justify-between gap-3">
                  <a href={`${apiOrigin}${document.fileUrl}`} target="_blank" rel="noreferrer" className="font-medium text-green-800 hover:underline">
                    {document.title}
                  </a>
                  <span className="text-xs text-gray-500">{document.kind} · {formatDate(document.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Leave" action={<button type="button" className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => setModal('leave')}>Request leave</button>}>
        <FormModal open={modal === 'login'} title="Edit login" subtitle={worker.login?.email} onClose={() => setModal('')}>
          <form className="space-y-3" onSubmit={saveLoginDetails}>
            <p className="text-sm text-gray-600">This is the email and name used to sign in. Leave the password blank to keep the current one.</p>
            <Field label="Name">
              <input className={inputClass} value={loginForm.name} onChange={(event) => setLoginForm({ ...loginForm, name: event.target.value })} required />
            </Field>
            <Field label="Email">
              <input type="email" className={inputClass} value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} required />
            </Field>
            <Field label="New password">
              <input type="password" autoComplete="new-password" className={inputClass} value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="Leave blank to keep the current password" />
            </Field>
            <PrimaryButton type="submit">Save login</PrimaryButton>
          </form>
        </FormModal>
        <FormModal open={modal === 'leave'} title="Request leave" onClose={() => setModal('')}>
          <form className="space-y-3" onSubmit={requestLeave}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start">
                <input type="date" className={inputClass} value={leave.startDate} onChange={(e) => setLeave({ ...leave, startDate: e.target.value })} required />
              </Field>
              <Field label="End">
                <input type="date" className={inputClass} value={leave.endDate} onChange={(e) => setLeave({ ...leave, endDate: e.target.value })} required />
              </Field>
            </div>
            <Field label="Reason">
              <input className={inputClass} placeholder="Reason" value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} />
            </Field>
            <div className="flex justify-end"><PrimaryButton type="submit">Request leave</PrimaryButton></div>
          </form>
        </FormModal>
        {leaveRequests.length === 0 ? <Notice tone="empty">No leave requests.</Notice> : (
          <ul className="space-y-2 text-sm">
            {leaveRequests.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <span>
                  {formatDate(request.startDate)} – {formatDate(request.endDate)}
                  <span className="text-gray-500"> · {request.reason || 'No reason given'}</span>
                  {request.reviewNote && <span className="block text-xs text-gray-500">{request.reviewNote}</span>}
                </span>
                <span className="flex items-center gap-2">
                  <StatusBadge value={request.status} />
                  {request.status === 'PENDING' && (
                    <>
                      <button type="button" className="text-xs font-medium text-green-700" onClick={() => decideLeave(request.id, 'APPROVED')}>Approve</button>
                      <button type="button" className="text-xs font-medium text-red-600" onClick={() => decideLeave(request.id, 'REJECTED')}>Reject</button>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};

export default HbmsWorkerProfile;
