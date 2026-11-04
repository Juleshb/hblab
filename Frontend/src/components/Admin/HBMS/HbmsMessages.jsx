import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import hbmsApi, { announcementKindOptions, apiError, formatWhen, optionLabel, taskStatusOptions } from './api';
import { Field, FormModal, Notice, PrimaryButton, Segmented, StatusBadge, inputClass } from './ui';
import HbmsConversations from './HbmsConversations';

const statTones = {
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  sky: 'border-sky-100 bg-sky-50 text-sky-700',
  violet: 'border-violet-100 bg-violet-50 text-violet-700',
  amber: 'border-amber-100 bg-amber-50 text-amber-700',
};

const kindColors = ['#15803d', '#0ea5e9', '#7c3aed', '#f59e0b', '#f43f5e', '#64748b'];

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

function dateChip(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: '—', day: '—', time: '' };
  return {
    month: date.toLocaleDateString(undefined, { month: 'short' }),
    day: date.getDate(),
    time: date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

function initials(name) {
  return String(name || '?').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function personName(person) {
  return person ? `${person.firstName} ${person.lastName}` : 'Unassigned';
}

const noticeLabels = {
  MEETING: 'Meeting',
  ANNOUNCEMENT: 'Announcement',
  TASK_ASSIGNED: 'Task assigned',
  TASK_UPDATED: 'Task updated',
  DEADLINE: 'Deadline',
  CONVERSATION: 'Conversation',
};

const HbmsMessages = () => {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notices, setNotices] = useState([]);
  const [meetingId, setMeetingId] = useState('');
  const [noticeWorker, setNoticeWorker] = useState('');
  const [meetingForm, setMeetingForm] = useState({
    title: '', startsAt: '', location: '', agenda: '', projectId: '', attendeeIds: [],
  });
  const [minutes, setMinutes] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [followUp, setFollowUp] = useState({ title: '', dueDate: '', projectId: '', assigneeIds: [] });
  const [announcement, setAnnouncement] = useState({ title: '', body: '', kind: 'GENERAL', businessUnitId: '' });
  const [error, setError] = useState('');
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [minutesOpen, setMinutesOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const startWorker = params.get('worker') || '';
  const [view, setView] = useState(startWorker ? 'conversations' : 'meetings');

  const loadNotices = async (employeeId = noticeWorker) => {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    const response = await hbmsApi.get(`/notifications${query}`);
    setNotices(response.data.data);
  };

  const load = async (keepId) => {
    const [workerRes, projectRes, unitRes, meetingRes, announcementRes] = await Promise.all([
      hbmsApi.get('/employees?limit=100'),
      hbmsApi.get('/projects?limit=100'),
      hbmsApi.get('/business-units'),
      hbmsApi.get('/meetings'),
      hbmsApi.get('/announcements'),
    ]);
    setWorkers(workerRes.data.data);
    setProjects(projectRes.data.data);
    setUnits(unitRes.data.data);
    setMeetings(meetingRes.data.data);
    setAnnouncements(announcementRes.data.data);
    const nextId = keepId || meetingId || meetingRes.data.data[0]?.id || '';
    setMeetingId(nextId);
    await loadNotices();
    return meetingRes.data.data;
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [workerRes, projectRes, unitRes, meetingRes, announcementRes, noticeRes] = await Promise.all([
          hbmsApi.get('/employees?limit=100'),
          hbmsApi.get('/projects?limit=100'),
          hbmsApi.get('/business-units'),
          hbmsApi.get('/meetings'),
          hbmsApi.get('/announcements'),
          hbmsApi.get('/notifications'),
        ]);
        if (!active) return;
        setWorkers(workerRes.data.data);
        setProjects(projectRes.data.data);
        setUnits(unitRes.data.data);
        setMeetings(meetingRes.data.data);
        setAnnouncements(announcementRes.data.data);
        setNotices(noticeRes.data.data);
        setMeetingId(meetingRes.data.data[0]?.id || '');
      } catch (err) {
        if (active) setError(apiError(err, 'Could not load messages'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const meeting = meetings.find((item) => item.id === meetingId);

  useEffect(() => {
    setMinutes(meeting?.minutes || '');
    setAttendees(meeting?.attendees.map((item) => item.employeeId) || []);
    setFollowUp((current) => ({
      ...current,
      projectId: meeting?.projectId || current.projectId,
    }));
  }, [meeting?.id]);

  const toggle = (list, id) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

  const schedule = async (event) => {
    event.preventDefault();
    try {
      const response = await hbmsApi.post('/meetings', {
        ...meetingForm,
        projectId: meetingForm.projectId || null,
      });
      toast.success('Meeting scheduled');
      setShowMeetingForm(false);
      setMeetingForm({ title: '', startsAt: '', location: '', agenda: '', projectId: meetingForm.projectId, attendeeIds: [] });
      await load(response.data.data.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not schedule the meeting'));
    }
  };

  const saveMinutes = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.patch(`/meetings/${meeting.id}`, { minutes });
      toast.success('Minutes saved');
      setMinutesOpen(false);
      await load(meeting.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not save minutes'));
    }
  };

  const saveAttendees = async () => {
    try {
      await hbmsApi.patch(`/meetings/${meeting.id}`, { attendeeIds: attendees });
      toast.success('Participants saved');
      await load(meeting.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not update participants'));
    }
  };

  const createFollowUp = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post(`/meetings/${meeting.id}/tasks`, {
        ...followUp,
        projectId: followUp.projectId || meeting.projectId || null,
      });
      toast.success('Follow-up task created');
      setFollowOpen(false);
      setFollowUp({ title: '', dueDate: '', projectId: meeting.projectId || '', assigneeIds: [] });
      await load(meeting.id);
    } catch (err) {
      toast.error(apiError(err, 'Could not create the follow-up'));
    }
  };

  const publish = async (event) => {
    event.preventDefault();
    try {
      await hbmsApi.post('/announcements', {
        ...announcement,
        businessUnitId: announcement.businessUnitId || null,
      });
      toast.success('Announcement published');
      setAnnounceOpen(false);
      setAnnouncement({ title: '', body: '', kind: announcement.kind, businessUnitId: announcement.businessUnitId });
      await load(meetingId);
    } catch (err) {
      toast.error(apiError(err, 'Could not publish the announcement'));
    }
  };

  const remind = async () => {
    try {
      const response = await hbmsApi.post('/notifications/reminders');
      toast.success(`${response.data.data.sent} deadline reminders sent`);
      await loadNotices();
    } catch (err) {
      toast.error(apiError(err, 'Could not send reminders'));
    }
  };

  const markRead = async (id) => {
    try {
      await hbmsApi.post(`/notifications/${id}/read`);
      await loadNotices();
    } catch (err) {
      toast.error(apiError(err, 'Could not mark it read'));
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading messages…</p>;
  if (error) return <Notice>{error}</Notice>;

  const now = new Date();
  const todayLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const upcoming = meetings.filter((item) => new Date(item.startsAt) >= now).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const earlier = meetings.filter((item) => new Date(item.startsAt) < now).sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
  const unread = notices.filter((notice) => !notice.readAt).length;
  const followUps = meetings.reduce((sum, item) => sum + (item.tasks?.length || 0), 0);
  const kindCounts = announcementKindOptions.map(([value, label], index) => ({
    label,
    value: announcements.filter((item) => item.kind === value).length,
    color: kindColors[index % kindColors.length],
  })).filter((item) => item.value > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Meetings and announcements</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">
            Invitations, announcements, task updates, and deadline reminders are stored for each worker. Email and Google Calendar can be connected later.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-right shadow-sm">
            <p className="text-sm font-medium text-gray-800">{todayLabel}</p>
          </div>
          {view === 'meetings' ? (
            <>
              <button type="button" className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-800" onClick={() => setAnnounceOpen(true)}>New announcement</button>
              <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setShowMeetingForm(true)}>Schedule meeting</button>
            </>
          ) : null}
        </div>
      </div>
      <Segmented value={view} onChange={setView} options={[['meetings', 'Meetings'], ['conversations', 'Conversations']]} />

      {view === 'conversations' ? <HbmsConversations startWorkerId={startWorker} /> : (
      <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatTile tone="emerald" icon="carbon:events" value={upcoming.length} label="Upcoming meetings" detail={`${earlier.length} already held`} />
        <StatTile tone="sky" icon="carbon:bullhorn" value={announcements.length} label="Announcements" detail={kindCounts[0] ? `${kindCounts[0].value} ${kindCounts[0].label.toLowerCase()}` : 'None published yet'} />
        <StatTile tone="violet" icon="carbon:notification" value={unread} label="Unread notices" detail={`${notices.length} in this view`} />
        <StatTile tone="amber" icon="carbon:task" value={followUps} label="Follow-up tasks" detail="Created from meetings" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_280px]">
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Upcoming</h3>
          {upcoming.length === 0 ? <p className="mt-4 text-sm text-gray-500">No meetings are scheduled.</p> : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((item) => {
                const when = dateChip(item.startsAt);
                return (
                  <li key={item.id}>
                    <button type="button" className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left ${item.id === meetingId ? 'bg-emerald-50' : 'hover:bg-gray-50'}`} onClick={() => setMeetingId(item.id)}>
                      <span className="w-12 shrink-0 rounded-xl bg-white py-1 text-center shadow-sm">
                        <span className="block text-[10px] font-semibold uppercase text-emerald-700">{when.month}</span>
                        <span className="block text-base font-semibold leading-none text-gray-900">{when.day}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900">{item.title}</span>
                        <span className="block text-xs text-gray-500">
                          {when.time}
                          {item.location ? ` · ${item.location}` : ''}
                          {item.project ? ` · ${item.project.code}` : ''}
                          {` · ${item.attendees.length} participant${item.attendees.length === 1 ? '' : 's'}`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {earlier.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Earlier</p>
              <ul className="mt-2 space-y-1">
                {earlier.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={`w-full rounded-xl px-2 py-1.5 text-left text-sm ${item.id === meetingId ? 'bg-emerald-50 font-medium text-emerald-900' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setMeetingId(item.id)}>
                      {item.title}
                      <span className="ml-2 text-xs text-gray-400">{formatWhen(item.startsAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Announcements</h3>
          <div className="mt-3 flex items-center gap-3">
            <SplitRing parts={kindCounts} total={announcements.length} caption="posts" />
            <ul className="space-y-2 text-sm">
              {(kindCounts.length ? kindCounts : []).map((part) => (
                <li key={part.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: part.color }} />
                  <span className="font-medium text-gray-800">{part.label}</span>
                  <span className="text-gray-500">{part.value}</span>
                </li>
              ))}
              {kindCounts.length === 0 && <li className="text-xs text-gray-500">Nothing published yet.</li>}
            </ul>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">Worker notifications</h3>
            <span className="flex items-center gap-2">
            <button type="button" className="text-xs font-medium text-emerald-700" onClick={async () => {
              const pending = notices.filter((notice) => !notice.readAt);
              await Promise.all(pending.map((notice) => hbmsApi.post(`/notifications/${notice.id}/read`).catch(() => null)));
              await loadNotices();
            }}>Mark all as read</button>
            <select className={`${inputClass} w-auto`} value={noticeWorker} onChange={async (event) => {
              setNoticeWorker(event.target.value);
              try {
                await loadNotices(event.target.value);
              } catch (err) {
                toast.error(apiError(err, 'Could not filter notifications'));
              }
            }}
            >
              <option value="">All workers</option>
              {workers.map((worker) => <option key={worker.id} value={worker.id}>{personName(worker)}</option>)}
            </select>
            </span>
          </div>
          {notices.length === 0 ? <p className="mt-4 text-sm text-gray-500">No notifications yet.</p> : (
            <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto">
              {notices.map((notice) => (
                <li key={notice.id} className="flex items-start gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${notice.readAt ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'}`}>{initials(personName(notice.employee))}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-gray-800"><span className="font-medium">{notice.title}</span></span>
                    <span className="block text-xs text-gray-500">{personName(notice.employee)} · {noticeLabels[notice.kind] || notice.kind} · {formatWhen(notice.createdAt)}</span>
                    {notice.body && <span className="mt-1 block text-sm text-gray-700">{notice.body}</span>}
                    {!notice.readAt && (
                      <button type="button" className="mt-1 text-xs font-medium text-emerald-800" onClick={() => markRead(notice.id)}>Mark read</button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
            <PrimaryButton type="button" onClick={remind}>Send deadline reminders</PrimaryButton>
            <p className="text-xs text-gray-500">Open tasks that are overdue or due within 14 days. Unassigned tasks go to the project manager.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">Announcements</h3>
            <button type="button" className="text-xs font-medium text-emerald-700" onClick={() => setAnnounceOpen(true)}>New</button>
          </div>
          <FormModal open={announceOpen} title="New announcement" subtitle="Workers in the chosen unit see this in their notifications." onClose={() => setAnnounceOpen(false)}>
          <form className="space-y-3" onSubmit={publish}>
            <Field label="Title">
              <input className={inputClass} value={announcement.title} onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })} required />
            </Field>
            <Field label="Message">
              <textarea className={inputClass} rows={3} value={announcement.body} onChange={(e) => setAnnouncement({ ...announcement, body: e.target.value })} required />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Type">
                <select className={inputClass} value={announcement.kind} onChange={(e) => setAnnouncement({ ...announcement, kind: e.target.value })}>
                  {announcementKindOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Audience">
                <select className={inputClass} value={announcement.businessUnitId} onChange={(e) => setAnnouncement({ ...announcement, businessUnitId: e.target.value })}>
                  <option value="">Both units</option>
                  {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex justify-end">
              <PrimaryButton type="submit">Publish</PrimaryButton>
            </div>
          </form>
          </FormModal>
          {announcements.length === 0 ? <p className="mt-4 text-sm text-gray-500">No announcements yet.</p> : (
            <ul className="mt-4 space-y-3">
              {announcements.map((item) => (
                <li key={item.id} className="rounded-2xl bg-gray-50 px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <StatusBadge value={item.kind} label={optionLabel(announcementKindOptions, item.kind)} />
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{item.body}</p>
                  <p className="mt-2 text-xs text-gray-500">{item.businessUnit?.name || 'Both units'} · {formatWhen(item.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">All meetings</h3>
            <button type="button" className="text-xs font-medium text-emerald-700" onClick={() => setShowMeetingForm(true)}>Schedule</button>
          </div>
          <FormModal open={showMeetingForm} wide title="Schedule meeting" subtitle="Participants are notified in the app." onClose={() => setShowMeetingForm(false)}>
          <form className="space-y-3" onSubmit={schedule}>
            <Field label="Title">
              <input className={inputClass} value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} required />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Starts">
                <input type="datetime-local" className={inputClass} value={meetingForm.startsAt} onChange={(e) => setMeetingForm({ ...meetingForm, startsAt: e.target.value })} required />
              </Field>
              <Field label="Place">
                <input className={inputClass} value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} />
              </Field>
            </div>
            <Field label="Project">
              <select className={inputClass} value={meetingForm.projectId} onChange={(e) => setMeetingForm({ ...meetingForm, projectId: e.target.value })}>
                <option value="">No project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}
              </select>
            </Field>
            <Field label="Agenda">
              <textarea className={inputClass} rows={2} value={meetingForm.agenda} onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })} />
            </Field>
            <div>
              <p className="text-xs font-medium text-gray-600">Participants</p>
              <div className="mt-1 flex flex-wrap gap-3">
                {workers.map((worker) => (
                  <label key={worker.id} className="flex items-center gap-1 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={meetingForm.attendeeIds.includes(worker.id)}
                      onChange={() => setMeetingForm({ ...meetingForm, attendeeIds: toggle(meetingForm.attendeeIds, worker.id) })}
                    />
                    {personName(worker)}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <PrimaryButton type="submit">Schedule meeting</PrimaryButton>
            </div>
          </form>
          </FormModal>
          {meetings.length === 0 ? <p className="mt-4 text-sm text-gray-500">No meetings scheduled.</p> : (
            <ul className="mt-3 space-y-2">
              {meetings.map((item) => {
                const when = dateChip(item.startsAt);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left ${item.id === meetingId ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                      onClick={() => setMeetingId(item.id)}
                    >
                      <span className="w-12 shrink-0 rounded-xl bg-white py-1 text-center shadow-sm">
                        <span className="block text-[10px] font-semibold uppercase text-emerald-700">{when.month}</span>
                        <span className="block text-base font-semibold leading-none text-gray-900">{when.day}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900">{item.title}</span>
                        <span className="block text-xs text-gray-500">
                          {when.time}
                          {item.location ? ` · ${item.location}` : ''}
                          {` · ${item.attendees.length} participant${item.attendees.length === 1 ? '' : 's'}`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">{meeting ? meeting.title : 'Meeting'}</h3>
          {!meeting ? <p className="mt-4 text-sm text-gray-500">Select a meeting to record minutes or add a follow-up task.</p> : (
            <div className="mt-3 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="w-12 shrink-0 rounded-xl bg-emerald-50 py-1 text-center">
                  <span className="block text-[10px] font-semibold uppercase text-emerald-700">{dateChip(meeting.startsAt).month}</span>
                  <span className="block text-base font-semibold leading-none text-gray-900">{dateChip(meeting.startsAt).day}</span>
                </span>
                <span>
                  <span className="block font-medium text-gray-900">{dateChip(meeting.startsAt).time}</span>
                  <span className="block text-xs text-gray-500">
                    {meeting.location || 'No place set'}
                    {meeting.project ? ` · ${meeting.project.code}` : ''}
                  </span>
                </span>
              </div>
              {meeting.agenda && <p className="rounded-2xl bg-gray-50 px-3 py-2 text-gray-800">{meeting.agenda}</p>}
              {meeting.minutes && <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-gray-800">{meeting.minutes}</p>}
              <div>
                <p className="text-xs font-medium text-gray-600">Participants</p>
                <div className="mt-1 flex flex-wrap gap-3">
                  {workers.map((worker) => (
                    <label key={worker.id} className="flex items-center gap-1 text-sm text-gray-800">
                      <input type="checkbox" checked={attendees.includes(worker.id)} onChange={() => setAttendees(toggle(attendees, worker.id))} />
                      {personName(worker)}
                    </label>
                  ))}
                </div>
                <button type="button" className="mt-2 text-xs font-medium text-green-800" onClick={saveAttendees}>Save participants</button>
              </div>
              <button type="button" className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white" onClick={() => setMinutesOpen(true)}>Record minutes</button>
              <FormModal open={minutesOpen} title="Meeting minutes" subtitle={meeting.title} onClose={() => setMinutesOpen(false)}>
                <form className="space-y-3" onSubmit={saveMinutes}>
                  <Field label="Minutes">
                    <textarea className={inputClass} rows={5} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                  </Field>
                  <div className="flex justify-end">
                    <PrimaryButton type="submit">Save minutes</PrimaryButton>
                  </div>
                </form>
              </FormModal>
              <div>
                <p className="text-xs font-medium text-gray-600">Follow-up tasks</p>
                {meeting.tasks.length === 0 ? <p className="mt-1 text-xs text-gray-500">None yet.</p> : (
                  <ul className="mt-2 space-y-2">
                    {meeting.tasks.map((task) => (
                      <li key={task.id} className="flex items-center justify-between gap-2 rounded-2xl bg-gray-50 px-3 py-2">
                        <Link to={task.project ? `/admin/hbms/projects/${task.project.id}` : '/admin/hbms/tasks'} className="font-medium text-gray-900 hover:text-emerald-800">{task.title}</Link>
                        <StatusBadge value={task.status} label={optionLabel(taskStatusOptions, task.status)} />
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" className="mt-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-800" onClick={() => setFollowOpen(true)}>Add follow-up</button>
                <FormModal open={followOpen} title="Follow-up task" subtitle={meeting.title} onClose={() => setFollowOpen(false)}>
                <form className="space-y-3" onSubmit={createFollowUp}>
                  <input className={inputClass} placeholder="Follow-up task" value={followUp.title} onChange={(e) => setFollowUp({ ...followUp, title: e.target.value })} required />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" aria-label="Follow-up deadline" className={inputClass} value={followUp.dueDate} onChange={(e) => setFollowUp({ ...followUp, dueDate: e.target.value })} />
                    <select className={inputClass} value={followUp.projectId} onChange={(e) => setFollowUp({ ...followUp, projectId: e.target.value })}>
                      <option value="">Meeting project</option>
                      {projects.map((project) => <option key={project.id} value={project.id}>{project.code}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {workers.map((worker) => (
                      <label key={worker.id} className="flex items-center gap-1 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={followUp.assigneeIds.includes(worker.id)}
                          onChange={() => setFollowUp({ ...followUp, assigneeIds: toggle(followUp.assigneeIds, worker.id) })}
                        />
                        {personName(worker)}
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <PrimaryButton type="submit">Create follow-up</PrimaryButton>
                  </div>
                </form>
                </FormModal>
              </div>
            </div>
          )}
        </section>
      </div>
      </>
      )}
    </div>
  );
};

export default HbmsMessages;
