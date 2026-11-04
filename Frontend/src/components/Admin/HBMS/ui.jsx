import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import hbmsApi from './api';

export function StatusBadge({ value, label }) {
  const tones = {
    ACTIVE: 'bg-green-100 text-green-800',
    PLANNING: 'bg-slate-100 text-slate-700',
    ON_LEAVE: 'bg-amber-100 text-amber-800',
    ON_HOLD: 'bg-amber-100 text-amber-800',
    INACTIVE: 'bg-gray-200 text-gray-700',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    DONE: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-gray-200 text-gray-600',
    TODO: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    IN_REVIEW: 'bg-violet-100 text-violet-800',
    BLOCKED: 'bg-red-100 text-red-800',
    PENDING: 'bg-slate-100 text-slate-700',
    LOW: 'bg-slate-100 text-slate-600',
    MEDIUM: 'bg-sky-100 text-sky-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
    MANAGER: 'bg-green-100 text-green-800',
    MEMBER: 'bg-slate-100 text-slate-700',
    REVIEWER: 'bg-violet-100 text-violet-800',
    INTERNAL: 'bg-slate-100 text-slate-700',
    CONFIDENTIAL: 'bg-amber-100 text-amber-800',
    RESTRICTED: 'bg-red-100 text-red-800',
    OBJECT: 'bg-sky-100 text-sky-800',
    PRIVATE: 'bg-slate-100 text-slate-700',
    LEAD: 'bg-green-100 text-green-800',
    CREATIVE: 'bg-sky-100 text-sky-800',
    INTERN: 'bg-violet-100 text-violet-800',
    TRAINING: 'bg-emerald-100 text-emerald-800',
    PART_TIME: 'bg-slate-100 text-slate-700',
    STAFF: 'bg-slate-100 text-slate-700',
    PLANNED: 'bg-slate-100 text-slate-700',
  };
  const text = label || String(value || '').replaceAll('_', ' ');
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[value] || 'bg-gray-100 text-gray-700'}`}>
      {text}
    </span>
  );
}

export function WorkerAvatar({ worker, className = '' }) {
  const [src, setSrc] = useState('');
  const initials = `${worker?.firstName?.[0] || ''}${worker?.lastName?.[0] || ''}`;

  useEffect(() => {
    if (!worker?.id || !worker.photoKey) {
      setSrc('');
      return undefined;
    }
    let active = true;
    let url = '';
    hbmsApi.get(`/employees/${worker.id}/photo`, { responseType: 'blob' })
      .then((response) => {
        url = URL.createObjectURL(response.data);
        if (active) setSrc(url);
        else URL.revokeObjectURL(url);
      })
      .catch(() => {
        if (active) setSrc('');
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [worker?.id, worker?.photoKey]);

  if (src) {
    return <img src={src} alt="" className={`${className} object-cover`} />;
  }
  return (
    <span className={`${className} inline-flex items-center justify-center font-semibold`}>
      {initials}
    </span>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-100 p-1">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-xl px-3 py-1.5 text-sm font-medium ${value === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Panel({ title, action, children, id }) {
  return (
    <section id={id} className="rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block text-xs font-medium text-gray-600">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100';

export function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function FormModal({ open, title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[min(90vh,860px)] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-xl'}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 bg-[#0d3b2e] px-5 py-4 text-white">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-200">HBMS</p>
            <h2 className="text-base font-semibold">{title}</h2>
            {subtitle ? <p className="mt-1 text-xs text-emerald-100">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white hover:bg-white/25">
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Notice({ children, tone = 'error' }) {
  const tones = {
    error: 'border-red-200 bg-red-50 text-red-700',
    empty: 'border-gray-200 bg-gray-50 text-gray-600',
  };
  return <div className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>{children}</div>;
}
