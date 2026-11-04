import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../../assets/context/AuthContext.jsx';
import hblabLogo from '../../../assets/logo.png';
import studioLogo from '../../../assets/hb-studio.jpg';
import hbmsApi, { apiError } from './api';
import { Field, Notice, PageHeader, Panel, PrimaryButton, WorkerAvatar, inputClass } from './ui';

const emptyLogin = { name: '', email: '', currentPassword: '', newPassword: '', confirm: '', worker: null };

const HbmsSettings = () => {
  const { user, updateUser } = useAuth();
  const [units, setUnits] = useState([]);
  const [error, setError] = useState('');
  const [login, setLogin] = useState(emptyLogin);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    hbmsApi.get('/business-units')
      .then((response) => {
        if (active) setUnits(response.data.data || []);
      })
      .catch((err) => {
        if (active) setError(apiError(err, 'Could not load organization settings'));
      });
    hbmsApi.get('/access/login')
      .then((response) => {
        if (!active) return;
        setLogin((current) => ({
          ...current,
          name: response.data.data?.name || '',
          email: response.data.data?.email || '',
          worker: response.data.data?.worker || null,
        }));
      })
      .catch((err) => {
        if (active) setError(apiError(err, 'Could not load your login'));
      });
    return () => {
      active = false;
    };
  }, []);

  const saveLogin = async (event) => {
    event.preventDefault();
    if (login.newPassword && login.newPassword !== login.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (login.newPassword && login.newPassword.length < 8) {
      toast.error('Use at least 8 characters for the new password');
      return;
    }
    setSaving(true);
    try {
      const response = await hbmsApi.patch('/access/login', {
        name: login.name,
        email: login.email,
        currentPassword: login.currentPassword,
        newPassword: login.newPassword,
      });
      updateUser?.({ name: response.data.data.name, email: response.data.data.email });
      setLogin((current) => ({ ...current, currentPassword: '', newPassword: '', confirm: '' }));
      toast.success('Your login was updated');
    } catch (err) {
      toast.error(apiError(err, 'Could not update your login'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Update the email, name, and password you use to sign in." />
      {error ? <Notice>{error}</Notice> : null}
      <Panel title="Your login">
        {login.worker ? (
          <div className="mb-4 flex items-center gap-3">
            <WorkerAvatar worker={login.worker} className="h-14 w-14 rounded-2xl bg-emerald-100 text-lg text-emerald-800" />
            <div>
              <p className="font-medium text-gray-900">{login.worker.firstName} {login.worker.lastName}</p>
              <p className="text-xs text-gray-500">{login.email}</p>
            </div>
          </div>
        ) : null}
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveLogin}>
          <Field label="Name">
            <input className={inputClass} value={login.name} onChange={(event) => setLogin({ ...login, name: event.target.value })} required />
          </Field>
          <Field label="Email">
            <input type="email" autoComplete="username" className={inputClass} value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} required />
          </Field>
          <Field label="Current password">
            <input type="password" autoComplete="current-password" className={inputClass} value={login.currentPassword} onChange={(event) => setLogin({ ...login, currentPassword: event.target.value })} required />
          </Field>
          <Field label="New password">
            <input type="password" autoComplete="new-password" className={inputClass} value={login.newPassword} onChange={(event) => setLogin({ ...login, newPassword: event.target.value })} placeholder="Leave blank to keep the current password" />
          </Field>
          <Field label="Confirm new password">
            <input type="password" autoComplete="new-password" className={inputClass} value={login.confirm} onChange={(event) => setLogin({ ...login, confirm: event.target.value })} />
          </Field>
          <div className="flex items-end">
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save login'}</PrimaryButton>
          </div>
          <p className="sm:col-span-2 text-xs text-gray-500">Your current password is required. A new password needs at least 8 characters.</p>
        </form>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Organization">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-gray-500">Organization</dt>
              <dd className="font-medium text-gray-900">HBLab and HBStudio</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Management system</dt>
              <dd className="font-medium text-gray-900">HBMS</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Timezone</dt>
              <dd className="font-medium text-gray-900">Africa/Kigali</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Language</dt>
              <dd className="font-medium text-gray-900">English</dd>
            </div>
          </dl>
          <ul className="mt-4 space-y-2">
            {units.map((unit) => (
              <li key={unit.id} className="rounded-2xl bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">{unit.name}</span>
                <span className="ml-2 text-xs text-gray-500">{unit.code} · {(unit.departments || []).length} departments</span>
                {unit.description ? <p className="mt-1 text-xs text-gray-500">{unit.description}</p> : null}
              </li>
            ))}
          </ul>
          {user?.role === 'ADMIN' && (
            <Link to="/admin/settings" className="mt-4 inline-block text-sm font-medium text-emerald-700">Open platform settings</Link>
          )}
        </Panel>
        <Panel title="Logos">
          <div className="space-y-3">
            <img src={hblabLogo} alt="HBLab" className="h-12 w-auto mix-blend-multiply" />
            <img src={studioLogo} alt="HBStudio" className="h-12 w-auto object-contain object-left" />
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default HbmsSettings;
