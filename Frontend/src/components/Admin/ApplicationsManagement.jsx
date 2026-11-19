import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { apiOrigin } from '../../apiOrigin';
import { useAuth } from '../../assets/context/AuthContext.jsx';
import ApplicationModal from './ApplicationModal';

const KINDS = [
  { id: 'all', label: 'All' },
  { id: 'internship', label: 'Internship' },
  { id: 'training', label: 'Training' },
  { id: 'jobs', label: 'Jobs' },
];

const STATUS = {
  awaiting_payment: { label: 'Waiting for payment', className: 'bg-amber-100 text-amber-900' },
  pending: { label: 'Ready to review', className: 'bg-blue-100 text-blue-900' },
  under_review: { label: 'Under review', className: 'bg-blue-100 text-blue-900' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Not approved', className: 'bg-red-100 text-red-800' },
};

function signedInTokens() {
  const current = String(axios.defaults.headers.common.Authorization || '').replace(/^Bearer\s+/i, '');
  return [current, localStorage.getItem('token') || '', sessionStorage.getItem('token') || '']
    .filter((token, index, list) => token && list.indexOf(token) === index);
}

async function withSignedIn(request) {
  const tokens = signedInTokens();
  let lastError;
  for (const token of tokens) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    try {
      return await request();
    } catch (error) {
      lastError = error;
      const message = error.response?.data?.error;
      if (message !== 'Invalid token' && message !== 'Authentication required') throw error;
    }
  }
  throw lastError || new Error('Sign in again, then open Internships.');
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name) {
  return String(name || '?').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

const columns = [
  { key: 'waiting', title: 'Waiting for payment', tone: 'bg-amber-50', chip: 'text-amber-800', match: (status) => status === 'awaiting_payment' },
  { key: 'review', title: 'Ready to review', tone: 'bg-sky-50', chip: 'text-sky-800', match: (status) => status === 'pending' || status === 'under_review' },
  { key: 'approved', title: 'Approved', tone: 'bg-emerald-50', chip: 'text-emerald-800', match: (status) => status === 'approved' },
  { key: 'rejected', title: 'Not approved', tone: 'bg-rose-50', chip: 'text-rose-700', match: (status) => status === 'rejected' },
];

const ApplicationsManagement = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [sendingLetterId, setSendingLetterId] = useState(null);
  const [search, setSearch] = useState('');
  const [focus, setFocus] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = KINDS.some((item) => item.id === searchParams.get('kind')) ? searchParams.get('kind') : 'all';

  const fetchApplications = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await withSignedIn(() => axios.get(`${apiOrigin}/api/applications`));
      const data = response.data;
      setApplications(Array.isArray(data) ? data : (data.applications || []));
    } catch (error) {
      setApplications([]);
      const message = error.response?.data?.error;
      setLoadError(message === 'Invalid token' || message === 'Authentication required'
        ? 'Your sign-in expired. Sign in again, then open Internships.'
        : (message || 'Could not load applicants.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const markPaidCash = async (applicationId) => {
    setActionError('');
    try {
      await withSignedIn(() => axios.post(`${apiOrigin}/api/applications/${applicationId}/cash`));
    } catch (error) {
      setActionError(error.response?.data?.error || 'Could not record the cash payment.');
      return;
    }
    setSelectedApplication(null);
    fetchApplications();
  };

  const resendLetter = async (applicationId) => {
    setActionError('');
    setNotice('');
    setSendingLetterId(applicationId);
    try {
      await withSignedIn(() => axios.post(`${apiOrigin}/api/applications/${applicationId}/letter`));
    } catch (error) {
      setActionError(error.response?.data?.error || 'Could not send the acceptance letter again.');
      return false;
    } finally {
      setSendingLetterId(null);
    }
    setNotice('The acceptance letter was sent again.');
    return true;
  };

  const updateStatus = async (applicationId, status) => {
    setActionError('');
    setNotice('');
    try {
      await withSignedIn(() => axios.patch(`${apiOrigin}/api/applications/${applicationId}/status`, { status }));
    } catch (error) {
      setActionError(error.response?.data?.error || 'Could not update this applicant.');
      return;
    }
    setSelectedApplication(null);
    fetchApplications();
  };

  const deleteApplication = async (applicationId) => {
    if (!window.confirm('Delete this application?')) return;
    setActionError('');
    try {
      await withSignedIn(() => axios.delete(`${apiOrigin}/api/applications/${applicationId}`));
    } catch (error) {
      setActionError(error.response?.data?.error || 'Could not delete this application.');
      return;
    }
    setSelectedApplication(null);
    fetchApplications();
  };

  const inKind = applications.filter((application) => {
    if (kind === 'internship') return application.careerTitle === 'Internship';
    if (kind === 'training') return application.careerTitle === 'Training';
    if (kind === 'jobs') return application.careerTitle !== 'Internship' && application.careerTitle !== 'Training';
    return true;
  });
  const visibleApplications = inKind.filter((application) => {
    const haystack = [application.fullName, application.email, application.applicationCode, application.careerDepartment]
      .join(' ')
      .toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const counts = {
    total: inKind.length,
    waiting: inKind.filter((item) => item.status === 'awaiting_payment').length,
    review: inKind.filter((item) => item.status === 'pending' || item.status === 'under_review').length,
    approved: inKind.filter((item) => item.status === 'approved').length,
    rejected: inKind.filter((item) => item.status === 'rejected').length,
  };
  const canDecide = (status) => status === 'pending' || status === 'under_review';
  const firstName = (user?.name || 'there').split(' ')[0];
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const shownColumns = columns.filter((column) => focus === 'all' || focus === column.key);
  const stats = [
    ['all', 'emerald', 'carbon:user-multiple', counts.total, 'Applicants', 'Internship, training, and jobs'],
    ['waiting', 'amber', 'carbon:currency', counts.waiting, 'Waiting for payment', 'Fee not paid yet'],
    ['review', 'sky', 'carbon:task', counts.review, 'Ready to review', 'Paid and waiting for a decision'],
    ['approved', 'violet', 'carbon:checkmark-outline', counts.approved, 'Approved', `${counts.rejected} not approved`],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Welcome back, {firstName}.</h2>
          <p className="mt-1 text-sm text-gray-500">Internship numbers start with IN. Training numbers start with HB.</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-right shadow-sm">
          <p className="text-sm font-medium text-gray-800">{todayLabel}</p>
          <p className="text-[11px] text-gray-400">Applicants</p>
        </div>
      </div>

      <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-gray-800">
        {counts.review
            ? `${counts.review} applicant${counts.review === 1 ? '' : 's'} can be approved now. ${counts.waiting} still need the 5,000 RWF fee, by phone or in cash.`
            : counts.waiting
              ? `${counts.waiting} applicant${counts.waiting === 1 ? ' is' : 's are'} waiting for 5,000 RWF. Use Paid by cash when the money was received at HBLab, then approve.`
              : 'New internship and training applications will appear here.'}
      </p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([key, tone, icon, value, label, detail]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFocus(key)}
            className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              tone === 'emerald' ? 'border-emerald-100 bg-emerald-50' : tone === 'amber' ? 'border-amber-100 bg-amber-50' : tone === 'sky' ? 'border-sky-100 bg-sky-50' : 'border-violet-100 bg-violet-50'
            } ${focus === key ? 'ring-2 ring-emerald-700' : ''}`}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-emerald-800">
                <Icon icon={icon} className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-2xl font-semibold leading-none text-gray-900">{loading ? '…' : value}</span>
                <span className="mt-1 block text-sm font-medium text-gray-800">{label}</span>
                <span className="block text-xs text-gray-500">{detail}</span>
              </span>
            </span>
            <Icon icon="carbon:chevron-right" className="h-4 w-4 shrink-0 opacity-60" />
          </button>
        ))}
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">Applicants</h3>
            <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-100 p-1">
              {KINDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSearchParams(item.id === 'all' ? {} : { kind: item.id })}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium ${kind === item.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <label className="relative block w-full sm:w-64">
            <Icon icon="carbon:search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, or number"
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>

        {actionError ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p> : null}
        {notice ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading applicants…</p>
        ) : loadError ? (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-6 text-sm text-red-700">
            {loadError}
            <button type="button" onClick={fetchApplications} className="ml-3 font-medium text-emerald-800 hover:underline">Try again</button>
          </div>
        ) : (
          <div className={`mt-4 grid gap-3 ${shownColumns.length > 1 ? 'xl:grid-cols-4 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {shownColumns.map((column) => {
              const items = visibleApplications.filter((application) => column.match(application.status));
              return (
                <div key={column.key} className={`rounded-2xl p-2 ${column.tone}`}>
                  <p className={`px-1 text-xs font-semibold ${column.chip}`}>{column.title} · {items.length}</p>
                  <ul className="mt-2 space-y-2">
                    {items.length === 0 && <li className="px-1 py-3 text-xs text-gray-400">None</li>}
                    {items.map((application) => {
                      const status = STATUS[application.status] || { label: application.status, className: 'bg-gray-100 text-gray-700' };
                      return (
                        <li key={application.id} className="rounded-xl bg-white p-3 shadow-sm">
                          <div className="flex items-start gap-2">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">{initials(application.fullName)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">{application.fullName}</p>
                              <p className="truncate text-[11px] text-gray-500">{application.email}</p>
                            </div>
                          </div>
                          <p className="mt-2 font-mono text-xs font-semibold tracking-wide text-gray-800">{application.applicationCode || 'No number'}</p>
                          <p className="mt-1 text-[11px] text-gray-500">{application.careerTitle}{application.careerDepartment ? ` · ${application.careerDepartment}` : ''} · {formatDate(application.createdAt)}</p>
                          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>{status.label}</span>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => setSelectedApplication(application)} className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">View</button>
                            {application.status === 'awaiting_payment' ? (
                              <button type="button" onClick={() => markPaidCash(application.id)} className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-amber-700">Paid by cash</button>
                            ) : null}
                            <button type="button" onClick={() => deleteApplication(application.id)} className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-gray-400 hover:text-rose-700">Delete</button>
                            {application.status === 'approved' && (application.careerTitle === 'Internship' || application.careerTitle === 'Training') ? (
                              <button type="button" onClick={() => resendLetter(application.id)} disabled={sendingLetterId === application.id} className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-800 disabled:opacity-60">
                                {sendingLetterId === application.id ? 'Sending…' : 'Send letter again'}
                              </button>
                            ) : null}
                            {canDecide(application.status) ? (
                              <>
                                <button type="button" onClick={() => updateStatus(application.id, 'approved')} className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-800">Approve</button>
                                <button type="button" onClick={() => updateStatus(application.id, 'rejected')} className="rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">Not approved</button>
                              </>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedApplication ? (
        <ApplicationModal
          key={selectedApplication.id}
          application={selectedApplication}
          isOpen
          onClose={() => setSelectedApplication(null)}
          onStatusUpdate={updateStatus}
          onCashPaid={markPaidCash}
          onResendLetter={resendLetter}
        />
      ) : null}
    </div>
  );
};

export default ApplicationsManagement;
