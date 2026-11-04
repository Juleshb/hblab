import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/auth/forgot-password', { email });
      setMessage(response.data.message || 'If an account uses that email, a reset link is on its way.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send the reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-3 pt-16">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
          <h1 className="text-xl font-bold text-gray-900">Reset your password</h1>
          <p className="mt-1 text-sm text-gray-500">Enter the email you use to sign in. We will send a link from info@hblab.rw.</p>
          <label className="mt-5 block text-xs font-semibold text-gray-700" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#16562e]"
            placeholder="your@email.com"
          />
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          <button type="submit" disabled={loading} className="mt-4 w-full rounded-lg bg-[#16562e] py-2 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
          <Link to="/LoginForm" className="mt-4 block text-center text-sm text-[#16562e]">Back to sign in</Link>
        </form>
      </div>
    </>
  );
};

export default ForgotPassword;
