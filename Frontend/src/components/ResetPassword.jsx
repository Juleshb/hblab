import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import { apiOrigin } from '../apiOrigin';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 8) {
      setError('Use at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('The passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${apiOrigin}/api/auth/reset-password`, { token, password });
      setMessage(response.data.message || 'Password updated. You can sign in.');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update the password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-3 pt-16">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
          <h1 className="text-xl font-bold text-gray-900">Choose a new password</h1>
          <p className="mt-1 text-sm text-gray-500">This replaces the password for the account in the reset email.</p>
          {!token ? <p className="mt-4 text-sm text-red-600">This reset link is missing its token. Ask for a new email.</p> : null}
          <label className="mt-5 block text-xs font-semibold text-gray-700" htmlFor="password">New password</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2e6b57]" />
          <label className="mt-3 block text-xs font-semibold text-gray-700" htmlFor="confirm">Confirm password</label>
          <input id="confirm" type="password" required minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-1 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2e6b57]" />
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          <button type="submit" disabled={loading || !token} className="mt-4 w-full rounded-lg bg-[#2e6b57] py-2 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? 'Saving…' : 'Save password'}
          </button>
          <Link to="/LoginForm" className="mt-4 block text-center text-sm text-[#2e6b57]">Back to sign in</Link>
        </form>
      </div>
    </>
  );
};

export default ResetPassword;
