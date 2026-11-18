import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Navbar from './Navbar';
import Footer from './Footer';
import { apiOrigin } from '../apiOrigin';

const TRACKS = [
  'Software Development',
  'Multimedia',
  'Networking',
  'Computer Systems',
];

const LEVELS = ['RTB/TVET', 'A2', 'A1', 'A0 / Bachelor', 'Other'];
const MODES = ['On-site in Rubavu', 'Remote', 'Either'];
const PROVIDERS = [
  { id: 'MTN_MOMO_RWA', label: 'MTN MoMo' },
  { id: 'AIRTEL_RWA', label: 'Airtel Money' },
];
const STEPS = [
  { id: 1, label: 'Your details' },
  { id: 2, label: 'Internship' },
  { id: 3, label: 'Payment' },
];
const FEE = '5,000 RWF';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  school: '',
  fieldOfStudy: '',
  educationLevel: '',
  track: '',
  mode: 'On-site in Rubavu',
  availability: '',
  portfolio: '',
  motivation: '',
  provider: 'MTN_MOMO_RWA',
  agree: false,
};

const fieldClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20';

function rwandaPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^2507\d{8}$/.test(digits)) return digits;
  if (/^07\d{8}$/.test(digits)) return `250${digits.slice(1)}`;
  if (/^7\d{8}$/.test(digits)) return `250${digits}`;
  return '';
}

function providerForPhone(msisdn) {
  const prefix = msisdn.slice(3, 5);
  if (prefix === '78' || prefix === '79') return 'MTN_MOMO_RWA';
  if (prefix === '72' || prefix === '73') return 'AIRTEL_RWA';
  return '';
}

function providerLabel(id) {
  return PROVIDERS.find((item) => item.id === id)?.label || 'Mobile money';
}

const InternshipRegister = () => {
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    if (!payment?.depositId || done) return undefined;
    let stopped = false;

    const check = async () => {
      try {
        const response = await fetch(`${apiOrigin}/api/applications/internship/payments/${payment.depositId}`);
        const data = await response.json().catch(() => ({}));
        if (stopped) return;
        if (data.status === 'COMPLETED') {
          setDone(true);
          return;
        }
        if (data.status === 'FAILED') {
          setPayment(null);
          setStep(3);
          setError(data.error || 'The payment was not approved. You can try again.');
        }
      } catch {
        // Keep waiting. The next check will try again.
      }
    };

    check();
    const timer = setInterval(check, 4000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [payment, done]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: type === 'checkbox' ? checked : value };
      if (name === 'phone') {
        const detected = providerForPhone(rwandaPhone(value));
        if (detected) next.provider = detected;
      }
      return next;
    });
    setError('');
  };

  const validate = (currentStep) => {
    if (currentStep === 1) {
      if (form.fullName.trim().length < 2) return 'Enter your full name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.';
      if (!rwandaPhone(form.phone)) return 'Enter a Rwandan mobile money number, for example 0788 000 000.';
      return '';
    }
    if (currentStep === 2) {
      if (!form.school.trim() || !form.fieldOfStudy.trim() || !form.educationLevel || !form.track) {
        return 'Complete your school, field of study, education level, and track.';
      }
      if (form.motivation.trim().length < 20) return 'Tell us a little more about why you want this internship.';
      if (form.portfolio && !/^https?:\/\/\S+$/i.test(form.portfolio.trim())) {
        return 'Portfolio link must start with http:// or https://.';
      }
      return '';
    }
    if (!form.agree) return 'Please agree to the terms before paying.';
    return '';
  };

  const goNext = () => {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((current) => Math.min(current + 1, 3));
  };

  const submit = async (event) => {
    event.preventDefault();
    const message = validate(3);
    if (message) {
      setError(message);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${apiOrigin}/api/applications/internship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          location: form.location,
          school: form.school,
          fieldOfStudy: form.fieldOfStudy,
          educationLevel: form.educationLevel,
          track: form.track,
          mode: form.mode,
          availability: form.availability,
          portfolio: form.portfolio,
          motivation: form.motivation,
          provider: form.provider,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Could not start the payment. Please try again.');
        return;
      }
      setPayment(data);
    } catch {
      setError('Could not reach HBLab. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStep = done ? 4 : payment ? 3 : step;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-28 sm:px-6">
        <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-2xl bg-green-900 p-8 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-200">HBLab internship</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight">Register for an internship</h1>
            <p className="mt-4 text-sm leading-6 text-green-50">
              Three short steps. The application fee is {FEE}, collected by MTN MoMo or Airtel Money after you review your details.
            </p>
            <ol className="mt-8 space-y-4 text-sm">
              {STEPS.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${activeStep >= item.id ? 'bg-white text-green-900' : 'bg-green-800 text-green-100'}`}>
                    {activeStep > item.id ? <Icon icon="carbon:checkmark" /> : item.id}
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <ol className="mb-6 grid grid-cols-3 gap-2">
              {STEPS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (done || payment || item.id >= step) return;
                      setError('');
                      setStep(item.id);
                    }}
                    className={`w-full rounded-lg px-2 py-2 text-left text-xs font-semibold ${item.id === activeStep ? 'bg-green-900 text-white' : item.id < activeStep ? 'bg-green-100 text-green-900' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {item.id}. {item.label}
                  </button>
                </li>
              ))}
            </ol>

            {done ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-800">
                  <Icon icon="carbon:checkmark" className="text-3xl" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-green-900">Registration received</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600">
                  Thank you, {form.fullName.split(' ')[0]}. Your {FEE} application fee was received. HBLab will review your registration and contact you at {form.email}.
                </p>
                <Link to="/" className="mt-6 inline-flex rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
                  Back to home
                </Link>
              </div>
            ) : payment ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-800">
                  <Icon icon="carbon:phone" className="text-3xl" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-green-900">Approve {FEE} on your phone</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600">
                  {payment.provider || providerLabel(form.provider)} sent a collection request to {payment.payerPhone}. Enter your PIN. This page updates when the payment is confirmed.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Your details</h2>
                      <p className="mt-1 text-sm text-gray-500">Tell us how to reach you.</p>
                    </div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full name *
                      <input name="fullName" value={form.fullName} onChange={update} className={`${fieldClass} mt-1`} />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                      Email *
                      <input type="email" name="email" value={form.email} onChange={update} className={`${fieldClass} mt-1`} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Mobile money number *
                        <input name="phone" value={form.phone} onChange={update} placeholder="0788 000 000" className={`${fieldClass} mt-1`} />
                      </label>
                      <label className="block text-sm font-medium text-gray-700">
                        City
                        <input name="location" value={form.location} onChange={update} className={`${fieldClass} mt-1`} />
                      </label>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Internship</h2>
                      <p className="mt-1 text-sm text-gray-500">Choose the track you want to join.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-gray-700">
                        School or institution *
                        <input name="school" value={form.school} onChange={update} className={`${fieldClass} mt-1`} />
                      </label>
                      <label className="block text-sm font-medium text-gray-700">
                        Field of study *
                        <input name="fieldOfStudy" value={form.fieldOfStudy} onChange={update} className={`${fieldClass} mt-1`} />
                      </label>
                      <label className="block text-sm font-medium text-gray-700">
                        Education level *
                        <select name="educationLevel" value={form.educationLevel} onChange={update} className={`${fieldClass} mt-1`}>
                          <option value="">Select level</option>
                          {LEVELS.map((level) => <option key={level}>{level}</option>)}
                        </select>
                      </label>
                      <label className="block text-sm font-medium text-gray-700">
                        Internship track *
                        <select name="track" value={form.track} onChange={update} className={`${fieldClass} mt-1`}>
                          <option value="">Select a track</option>
                          {TRACKS.map((track) => <option key={track}>{track}</option>)}
                        </select>
                      </label>
                      <label className="block text-sm font-medium text-gray-700">
                        How you want to join *
                        <select name="mode" value={form.mode} onChange={update} className={`${fieldClass} mt-1`}>
                          {MODES.map((mode) => <option key={mode}>{mode}</option>)}
                        </select>
                      </label>
                      <label className="block text-sm font-medium text-gray-700">
                        When you can start
                        <input name="availability" value={form.availability} onChange={update} placeholder="Immediately, or a date" className={`${fieldClass} mt-1`} />
                      </label>
                    </div>
                    <label className="block text-sm font-medium text-gray-700">
                      Portfolio or GitHub link
                      <input name="portfolio" value={form.portfolio} onChange={update} placeholder="https://" className={`${fieldClass} mt-1`} />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                      Why do you want this internship? *
                      <textarea name="motivation" value={form.motivation} onChange={update} rows={4} className={`${fieldClass} mt-1`} />
                    </label>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Pay the application fee</h2>
                      <p className="mt-1 text-sm text-gray-500">HBLab collects {FEE} from your mobile money wallet. The registration is saved after you approve it.</p>
                    </div>
                    <dl className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">Name</dt>
                        <dd className="font-medium text-gray-900">{form.fullName}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">Email</dt>
                        <dd className="font-medium text-gray-900">{form.email}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">Track</dt>
                        <dd className="font-medium text-gray-900">{form.track}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">Fee</dt>
                        <dd className="font-medium text-gray-900">{FEE}</dd>
                      </div>
                    </dl>
                    <label className="block text-sm font-medium text-gray-700">
                      Collect {FEE} with *
                      <select name="provider" value={form.provider} onChange={update} className={`${fieldClass} mt-1`}>
                        {PROVIDERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                      <span className="mt-1 block text-xs font-normal text-gray-500">The prompt goes to {form.phone}.</span>
                    </label>
                    <label className="flex items-start gap-2 text-sm text-gray-600">
                      <input type="checkbox" name="agree" checked={form.agree} onChange={update} className="mt-1" />
                      <span>
                        I agree to the <Link to="/terms-of-use" className="font-medium text-green-800">Terms of Use</Link> and <Link to="/privacy-policy" className="font-medium text-green-800">Privacy Policy</Link>.
                      </span>
                    </label>
                  </div>
                )}

                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                <div className="flex gap-3">
                  {step > 1 && (
                    <button type="button" onClick={() => { setError(''); setStep((current) => current - 1); }} className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button type="button" onClick={goNext} className="flex-1 rounded-lg bg-green-900 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800">
                      Continue
                    </button>
                  ) : (
                    <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-green-900 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60">
                      {submitting ? 'Sending prompt…' : `Collect ${FEE}`}
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InternshipRegister;
