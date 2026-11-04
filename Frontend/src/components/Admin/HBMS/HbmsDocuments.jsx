import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import hbmsApi, {
  apiError,
  documentCategoryOptions,
  documentSensitivityOptions,
  optionLabel,
  suggestedSensitivity,
} from './api';
import { Field, FormModal, Notice, PageHeader, Panel, PrimaryButton, StatusBadge, inputClass } from './ui';

const emptyForm = {
  title: '',
  category: 'POLICY',
  sensitivity: 'INTERNAL',
  employeeId: '',
  projectId: '',
  programId: '',
  meetingId: '',
  grantIds: [],
};

function personName(person) {
  if (!person) return '';
  return `${person.firstName} ${person.lastName}`;
}

function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const HbmsDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDocuments = async (category = categoryFilter) => {
    const query = category ? `?category=${category}` : '';
    const response = await hbmsApi.get(`/documents${query}`);
    setDocuments(response.data.data);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [documentRes, workerRes, projectRes, programRes, meetingRes] = await Promise.all([
          hbmsApi.get('/documents'),
          hbmsApi.get('/employees?limit=100'),
          hbmsApi.get('/projects?limit=100'),
          hbmsApi.get('/programs?limit=100'),
          hbmsApi.get('/meetings'),
        ]);
        if (!active) return;
        setDocuments(documentRes.data.data);
        setWorkers(workerRes.data.data);
        setProjects(projectRes.data.data);
        setPrograms(programRes.data.data);
        setMeetings(meetingRes.data.data);
      } catch (err) {
        if (active) setError(apiError(err, 'Could not load documents'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const update = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      [field]: value,
      sensitivity: field === 'category' ? suggestedSensitivity[value] : current.sensitivity,
    }));
  };

  const toggleGrant = (employeeId) => {
    setForm((current) => ({
      ...current,
      grantIds: current.grantIds.includes(employeeId)
        ? current.grantIds.filter((id) => id !== employeeId)
        : [...current.grantIds, employeeId],
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Choose a file to store');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.append('title', form.title);
      body.append('category', form.category);
      body.append('sensitivity', form.sensitivity);
      if (form.employeeId) body.append('employeeId', form.employeeId);
      if (form.projectId) body.append('projectId', form.projectId);
      if (form.programId) body.append('programId', form.programId);
      if (form.meetingId) body.append('meetingId', form.meetingId);
      form.grantIds.forEach((id) => body.append('grantIds', id));
      body.append('file', file);
      await hbmsApi.post('/documents', body);
      setForm((current) => ({ ...emptyForm, category: current.category, sensitivity: suggestedSensitivity[current.category] }));
      setFile(null);
      event.target.reset();
      await loadDocuments();
      setShowForm(false);
      toast.success('Document stored');
    } catch (err) {
      setError(apiError(err, 'Could not store the document'));
    } finally {
      setSaving(false);
    }
  };

  const download = async (item) => {
    try {
      const response = await hbmsApi.get(`/documents/${item.id}/file`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(apiError(err, 'Could not open the file'));
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove ${item.title}?`)) return;
    try {
      await hbmsApi.delete(`/documents/${item.id}`);
      await loadDocuments();
      toast.success('Document removed');
    } catch (err) {
      toast.error(apiError(err, 'Could not remove the document'));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Documents" subtitle="Photos and video stay in object storage. Other files stay private. Access follows each document’s sensitivity.">
        <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setShowForm(true)}>
          Upload file
        </button>
      </PageHeader>
      <Panel
        title="Library"
        action={(
          <div className="flex flex-wrap gap-1">
            {[['', 'All files'], ...documentCategoryOptions.slice(0, 4)].map(([value, label]) => (
              <button
                key={label}
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-medium ${categoryFilter === value ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => {
                  setCategoryFilter(value);
                  loadDocuments(value).catch((err) => setError(apiError(err, 'Could not load documents')));
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      >
        {loading ? <p className="text-sm text-gray-500">Loading documents…</p> : null}
        {!loading && documents.length === 0 ? <Notice tone="empty">No documents in this library yet.</Notice> : null}
        {documents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Size</th>
                  <th className="py-2 pr-3">Access</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {documents.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.fileName}</p>
                    </td>
                    <td className="py-3 pr-3 text-gray-600">{optionLabel(documentCategoryOptions, item.category)}</td>
                    <td className="py-3 pr-3 text-gray-600">{fileSize(item.sizeBytes)}</td>
                    <td className="py-3 pr-3"><StatusBadge value={item.sensitivity} label={optionLabel(documentSensitivityOptions, item.sensitivity)} /></td>
                    <td className="py-3 text-right">
                      <button type="button" className="text-xs font-medium text-emerald-700" onClick={() => download(item)}>Download</button>
                      <button type="button" className="ml-3 text-xs font-medium text-red-600" onClick={() => remove(item)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <FormModal open={showForm} wide title="Upload file" subtitle="Photos and video go to object storage. Other files stay private." onClose={() => setShowForm(false)}>
        <form className="space-y-3" onSubmit={submit}>
          <p className="text-xs leading-5 text-gray-500">
            Photos and video go to object storage. Other files stay in private storage. The database keeps the record, not the file. Access follows the sensitivity of each document.
          </p>
          {error ? <Notice>{error}</Notice> : null}
          <Field label="Title">
            <input className={inputClass} value={form.title} onChange={update('title')} required />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={update('category')}>
              {documentCategoryOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Sensitivity">
            <select className={inputClass} value={form.sensitivity} onChange={update('sensitivity')}>
              {documentSensitivityOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Worker">
            <select className={inputClass} value={form.employeeId} onChange={update('employeeId')}>
              <option value="">Not linked to a worker</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{worker.staffCode} · {personName(worker)}</option>
              ))}
            </select>
          </Field>
          <Field label="Project">
            <select className={inputClass} value={form.projectId} onChange={update('projectId')}>
              <option value="">Not linked to a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.code} · {project.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Program">
            <select className={inputClass} value={form.programId} onChange={update('programId')}>
              <option value="">Not linked to a program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>{program.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Meeting">
            <select className={inputClass} value={form.meetingId} onChange={update('meetingId')}>
              <option value="">Not linked to a meeting</option>
              {meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>{meeting.title}</option>
              ))}
            </select>
          </Field>
          <Field label="File">
            <input
              className="block w-full text-sm text-gray-700"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </Field>
          <fieldset>
            <legend className="text-xs font-medium text-gray-600">Also grant access</legend>
            <div className="mt-2 space-y-1">
              {workers.map((worker) => (
                <label key={worker.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.grantIds.includes(worker.id)}
                    onChange={() => toggleGrant(worker.id)}
                  />
                  {personName(worker)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-end border-t border-gray-100 pt-3">
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Storing…' : 'Store document'}</PrimaryButton>
          </div>
        </form>
      </FormModal>
    </div>
  );
};

export default HbmsDocuments;
