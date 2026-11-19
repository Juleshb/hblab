import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Cells, Districts, Provinces, Sectors } from 'rwanda';
import Navbar from './Navbar';
import Footer from './Footer';
import { apiOrigin } from '../apiOrigin';
import momoLogo from '../assets/momo.png';
import airtelLogo from '../assets/airtel-money.png';

const TRAINING_TRACKS = [
  { name: 'Software Development', detail: 'Websites, apps, and business software' },
  { name: 'Networking & Internet Technology', detail: 'Networks, servers, and internet support' },
  { name: 'Computer System and Architecture', detail: 'Computer parts, setup, and troubleshooting' },
  { name: 'Multimedia Production', detail: 'Photo, video, design, and editing' },
  { name: 'Electronics & Telecommunications', detail: 'Circuits, communication systems, and repair' },
  { name: 'Accounting', detail: 'Business records, books, and reports' },
  { name: 'Electrical Technology', detail: 'Installation, measurement, and safe electrical work' },
];
const INTERNSHIP_PLACEMENTS = [
  { name: 'Software Development', detail: 'Work with the team on websites, apps, and software' },
  { name: 'Multimedia', detail: 'Work on design, video, and digital content' },
  { name: 'Networking', detail: 'Work on networks, servers, and support' },
  { name: 'Computer Systems', detail: 'Work on hardware, systems, and day-to-day IT' },
];
const INTERNSHIP_SITUATIONS = [
  { name: 'I am still in school', detail: 'I am a student now' },
  { name: 'I finished school', detail: 'I completed my studies' },
  { name: 'I am not in school', detail: 'School and field of study can stay blank' },
];
const INTERNSHIP_LENGTHS = ['1 month', '2 months', '3 months', '6 months'];

const LEVELS = ['Not educated', 'REB', 'RTB/TVET', 'A2', 'A1', 'A0 / Bachelor', 'Other'];
const SKILLS = [
  { name: 'Unskilled', detail: 'I have not done this work before' },
  { name: 'I can write and I am ready', detail: 'I can write, and I am ready to start' },
];
const STARTS = ['Immediately', 'Choose a date'];
const TRAINING_REASONS = [
  'I want a job in this field',
  'I want to improve my skills',
  'I want a certificate',
  'I want to start my own work',
  'Someone asked me to join',
  'Other',
];
const INTERNSHIP_REASONS = [
  'I want work experience',
  'I want to improve my skills',
  'I want a job after this internship',
  'My school asked me to do an internship',
  'Other',
];
const COUNTRIES = ['Rwanda', 'Burundi', 'Uganda', 'Kenya', 'Tanzania', 'DR Congo', 'Other'];
const PROVINCE_LABEL = {
  East: 'Eastern Province',
  Kigali: 'Kigali City',
  North: 'Northern Province',
  South: 'Southern Province',
  West: 'Western Province',
};
const TRAINING_MODES = [
  { name: 'On-site in Rubavu', detail: 'Attend class at HBLab in Rubavu' },
  { name: 'Remote', detail: 'Learn from where you live' },
  { name: 'Either', detail: 'Class or remote is fine' },
];
const INTERNSHIP_MODES = [
  { name: 'On-site in Rubavu', detail: 'Work at the HBLab office in Rubavu' },
  { name: 'Remote', detail: 'Work from where you live' },
  { name: 'Either', detail: 'Office or remote is fine' },
];
const PROVIDERS = [
  {
    id: 'MTN_MOMO_RWA',
    label: 'MTN MoMo',
    hint: 'Numbers starting with 078 or 079',
    logo: momoLogo,
    card: 'border-[#166534] bg-[#f3faf6] ring-2 ring-[#166534]',
    idle: 'border-[#d0d5dd] bg-white hover:border-[#166534]',
    button: 'bg-[#166534] text-white hover:bg-[#14532d]',
  },
  {
    id: 'AIRTEL_RWA',
    label: 'Airtel Money',
    hint: 'Numbers starting with 072 or 073',
    logo: airtelLogo,
    card: 'border-[#166534] bg-[#f3faf6] ring-2 ring-[#166534]',
    idle: 'border-[#d0d5dd] bg-white hover:border-[#166534]',
    button: 'bg-[#166534] text-white hover:bg-[#14532d]',
  },
];
const FEE = '5,000 RWF';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  country: 'Rwanda',
  countryOther: '',
  province: '',
  district: '',
  sector: '',
  city: '',
  school: '',
  fieldOfStudy: '',
  educationLevel: '',
  track: '',
  mode: 'On-site in Rubavu',
  skillLevel: '',
  startWhen: '',
  startDate: '',
  reason: '',
  reasonOther: '',
  portfolio: '',
  provider: '',
  paymentPhone: '',
  agree: false,
};

const fieldClass = 'h-12 w-full rounded-lg border border-[#d0d5dd] bg-white px-3.5 text-[15px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#166534] focus:ring-4 focus:ring-[#166534]/10';

function sectorsIn(province, district) {
  if (!province || !district) return [];
  return (Sectors({ province, district }) || [])
    .filter((sector) => Cells({ province, district, sector })?.length)
    .sort((left, right) => left.localeCompare(right));
}

function livedIn(form) {
  if (form.country === 'Rwanda') {
    if (!form.province || !form.district || !form.sector) return '';
    return `${form.sector}, ${form.district}, ${PROVINCE_LABEL[form.province]}, Rwanda`;
  }
  const country = form.country === 'Other' ? form.countryOther.trim() : form.country;
  if (!country || !form.city.trim()) return '';
  return `${form.city.trim()}, ${country}`;
}

function startLabel(form) {
  if (form.startWhen === 'Choose a date') return form.startDate;
  return form.startWhen;
}

function reasonText(form) {
  return form.reason === 'Other' ? form.reasonOther.trim() : form.reason;
}

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

function paymentError(message, provider) {
  const text = String(message || '');
  if (/did not specify a reason|insufficient|not enough funds|UNSPECIFIED_FAILURE|PAYER_NOT_FOUND/i.test(text)) {
    const brand = provider === 'AIRTEL_RWA' || /airtel/i.test(text) ? 'Airtel Money' : 'MTN MoMo';
    return `This ${brand} number could not pay. Activate the mobile money account and make sure the wallet has at least ${FEE}, then try again.`;
  }
  return text;
}

function walletCheck(provider, raw) {
  const msisdn = rwandaPhone(raw);
  if (!provider) return { ok: false, tone: 'muted', message: '' };
  if (!raw.trim()) {
    const chosen = PROVIDERS.find((item) => item.id === provider);
    return { ok: false, tone: 'muted', message: chosen.hint };
  }
  if (!msisdn) return { ok: false, tone: 'bad', message: 'Enter a Rwandan number, for example 0788 000 000.' };
  const detected = providerForPhone(msisdn);
  if (!detected) return { ok: false, tone: 'bad', message: 'This number is not MTN or Airtel. MTN starts with 078 or 079. Airtel starts with 072 or 073.' };
  if (detected !== provider) {
    return { ok: false, tone: 'bad', message: `This number belongs to ${providerLabel(detected)}. Choose ${providerLabel(detected)}, or enter an ${providerLabel(provider)} number.` };
  }
  const local = `0${msisdn.slice(3)}`;
  const pretty = `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  return { ok: true, tone: 'good', message: `${pretty} is a ${providerLabel(provider)} number.` };
}

function statusMessage(application) {
  if (application.status === 'awaiting_payment') {
    return `Keep this number. You can pay ${FEE} now, or come back when the wallet has the money and request the prompt.`;
  }
  if (application.status === 'approved') {
    return 'Your application has been approved. HBLab will contact you with the next step.';
  }
  if (application.status === 'rejected') {
    return 'This application was not approved.';
  }
  return 'Payment received. The application is submitted and waiting for HBLab to accept it.';
}

const statusTone = {
  awaiting_payment: 'bg-amber-100 text-amber-900',
  pending: 'bg-blue-100 text-blue-900',
  under_review: 'bg-blue-100 text-blue-900',
  approved: 'bg-green-100 text-green-900',
  rejected: 'bg-red-100 text-red-800',
};

function Field({ label, required, hint, hintClass = 'text-gray-500', children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {hint ? <span className={`mt-1.5 block text-xs ${hintClass}`}>{hint}</span> : null}
    </label>
  );
}

function Notice({ children }) {
  if (!children) return null;
  return (
    <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <Icon icon="carbon:warning-alt" className="mt-0.5 shrink-0 text-base" />
      <span>{children}</span>
    </p>
  );
}

function Stepper({ step, steps, onSelect }) {
  return (
    <ol className="mb-6 grid grid-cols-3">
      {steps.map((item, index) => {
        const done = step > item.id;
        const current = step === item.id;
        return (
          <li key={item.id} className="relative flex flex-col items-center">
            {index > 0 ? (
              <span className={`absolute left-0 right-1/2 top-[18px] h-px ${step >= item.id ? 'bg-[#166534]' : 'bg-[#d0d5dd]'}`} />
            ) : null}
            {index < steps.length - 1 ? (
              <span className={`absolute left-1/2 right-0 top-[18px] h-px ${done ? 'bg-[#166534]' : 'bg-[#d0d5dd]'}`} />
            ) : null}
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              disabled={!done}
              aria-current={current ? 'step' : undefined}
              className="relative z-10 flex flex-col items-center gap-2 disabled:cursor-default"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${done || current ? 'bg-[#166534] text-white' : 'border border-[#d0d5dd] bg-white text-gray-400'}`}>
                {done ? <Icon icon="carbon:checkmark" className="text-lg" /> : item.id}
              </span>
              <span className={`text-center text-xs font-medium ${current ? 'text-[#166534]' : done ? 'text-gray-700' : 'text-gray-500'}`}>{item.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function SummaryGroup({ title, onEdit, rows }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e4e7ec]">
      <div className="flex items-center justify-between border-b border-[#e4e7ec] bg-[#f8faf9] px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-[#166534] hover:underline">
          Change
        </button>
      </div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-1 gap-1 border-b border-[#f2f4f7] px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[11rem_1fr] sm:gap-3">
            <dt className="text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-900">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PaymentStep({ form, update, setForm, feeLabel }) {
  const chosen = PROVIDERS.find((item) => item.id === form.provider);
  const wallet = walletCheck(form.provider, form.paymentPhone);
  const tone = wallet.tone === 'good' ? 'text-[#166534]' : wallet.tone === 'bad' ? 'text-red-700' : 'text-gray-500';

  return (
    <div className="space-y-4 rounded-xl border border-[#e4e7ec] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4 rounded-lg bg-[#f3faf6] px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount due</p>
          <p className="text-sm text-gray-600">{feeLabel}</p>
        </div>
        <p className="text-lg font-bold text-gray-950">{FEE}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">Payment method</p>
        <div className="mt-2 space-y-2">
          {PROVIDERS.map((item) => {
            const selected = form.provider === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setForm((current) => ({ ...current, provider: item.id }))}
                className={`flex w-full items-center gap-4 rounded-xl border px-3 py-3 text-left ${selected ? item.card : item.idle}`}
              >
                <img src={item.logo} alt="" className="h-10 w-24 object-contain" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">{item.label}</span>
                  <span className="block text-xs text-gray-500">{item.hint}</span>
                </span>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-[#166534]' : 'border-[#d0d5dd]'}`}>
                  {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#166534]" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <Field label={chosen ? `${chosen.label} number` : 'Wallet number'} required hint={wallet.message} hintClass={tone}>
        <input
          name="paymentPhone"
          value={form.paymentPhone}
          onChange={update}
          inputMode="tel"
          autoComplete="tel"
          placeholder={form.provider === 'AIRTEL_RWA' ? '0730 000 000' : '0788 000 000'}
          className={`${fieldClass} tracking-wide`}
        />
      </Field>
      <label className="flex items-start gap-2.5 text-sm text-gray-600">
        <input type="checkbox" name="agree" checked={form.agree} onChange={update} className="mt-1 h-4 w-4 accent-[#166534]" />
        <span>
          I agree to the <Link to="/terms-of-use" className="font-medium text-[#166534]">Terms of Use</Link> and <Link to="/privacy-policy" className="font-medium text-[#166534]">Privacy Policy</Link>.
        </span>
      </label>
    </div>
  );
}

const InternshipRegister = ({ program = 'internship' }) => {
  const training = program === 'training';
  const apiName = training ? 'training' : 'internship';
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [application, setApplication] = useState(null);
  const [payment, setPayment] = useState(null);
  const [lookupCode, setLookupCode] = useState(searchParams.get('code') || '');
  const [checking, setChecking] = useState(false);
  const [showLookup, setShowLookup] = useState(Boolean(searchParams.get('code')));
  const [copied, setCopied] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [recoverNotice, setRecoverNotice] = useState('');

  const loadApplication = async (code) => {
    const response = await fetch(`${apiOrigin}/api/applications/${apiName}/applications/${encodeURIComponent(code)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'No application was found with that number.');
    setApplication(data.application);
    setShowLookup(false);
    setPayment(null);
    return data.application;
  };

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return undefined;
    let stopped = false;
    setLookupCode(code);
    setShowLookup(true);
    loadApplication(code).catch((loadError) => {
      if (!stopped) setError(loadError.message);
    });
    return () => {
      stopped = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!payment?.depositId || !application?.code) return undefined;
    let stopped = false;
    const code = application.code;

    const check = async () => {
      try {
        const response = await fetch(`${apiOrigin}/api/applications/${apiName}/payments/${payment.depositId}`);
        const data = await response.json().catch(() => ({}));
        if (stopped) return;
        if (data.status === 'COMPLETED') {
          await loadApplication(code);
          return;
        }
        if (data.status === 'FAILED') {
          setPayment(null);
          setError(paymentError(data.error, form.provider) || 'The payment was not approved. You can try again.');
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
  }, [payment, application?.code]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const choose = (name, value) => {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'country') {
        next.province = '';
        next.district = '';
        next.sector = '';
        next.city = '';
        next.countryOther = '';
      }
      if (name === 'province') {
        next.district = '';
        next.sector = '';
      }
      if (name === 'district') next.sector = '';
      if (name === 'reason' && value !== 'Other') next.reasonOther = '';
      if (name === 'startWhen' && value !== 'Choose a date') next.startDate = '';
      if (name === 'educationLevel' && value === 'I am not in school') {
        next.school = '';
        next.fieldOfStudy = '';
      }
      return next;
    });
    setError('');
  };

  const validate = (currentStep) => {
    if (currentStep === 1) {
      if (form.fullName.trim().length < 2) return 'Enter your full name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.';
      if (!rwandaPhone(form.phone)) return 'Enter a Rwandan phone number, for example 0788 000 000.';
      if (!livedIn(form)) return form.country === 'Rwanda'
        ? 'Choose the province, district, and sector where you live.'
        : 'Enter the country and city where you live.';
      return '';
    }
    if (currentStep === 2) {
      if (training) {
        const educated = form.educationLevel && form.educationLevel !== 'Not educated';
        if (!form.educationLevel || !form.track || !form.skillLevel) return 'Choose your education, skill level, and training.';
        if (educated && !form.school.trim()) return 'Enter the school or institution. This is required when you studied in REB or another school.';
        if (educated && !form.fieldOfStudy.trim()) return 'Enter your field of study.';
      } else {
        const studied = form.educationLevel && form.educationLevel !== 'I am not in school';
        if (!form.educationLevel || !form.track || !form.skillLevel) return 'Choose your situation, where you want to work, and how long you can stay.';
        if (studied && !form.school.trim()) return 'Enter your school or institution.';
        if (studied && !form.fieldOfStudy.trim()) return 'Enter your field of study.';
      }
      if (!form.startWhen || (form.startWhen === 'Choose a date' && !form.startDate)) return 'Choose when you can start.';
      if (!reasonText(form)) return training ? 'Choose why you want this training.' : 'Choose why you want this internship.';
      if (form.reason === 'Other' && form.reasonOther.trim().length < 8) return 'Write a short reason in Other.';
      if (form.portfolio && !/^https?:\/\/\S+$/i.test(form.portfolio.trim())) {
        return 'Portfolio link must start with http:// or https://.';
      }
      return '';
    }
    return '';
  };

  const prepareWallet = (current) => {
    const paymentPhone = current.paymentPhone || current.phone;
    const detected = providerForPhone(rwandaPhone(paymentPhone));
    return { ...current, paymentPhone, provider: current.provider || detected };
  };

  const goNext = () => {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    if (step === 2) setForm((current) => prepareWallet(current));
    setStep((current) => Math.min(current + 1, 3));
  };

  const createApplication = async ({ withWallet = false } = {}) => {
    const response = await fetch(`${apiOrigin}/api/applications/${apiName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        location: livedIn(form),
        school: form.school,
        fieldOfStudy: form.fieldOfStudy,
        educationLevel: form.educationLevel,
        skillLevel: form.skillLevel,
        track: form.track,
        mode: form.mode,
        availability: startLabel(form),
        portfolio: form.portfolio,
        motivation: reasonText(form),
        ...(withWallet ? { provider: form.provider, paymentPhone: form.paymentPhone } : {}),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.depositId && !data.application) {
      setShowLookup(false);
      setPayment(data);
      return null;
    }
    if (!data.application) {
      const message = data.error || 'Could not save the application. Please try again.';
      throw new Error(form.provider && message === 'Choose MTN MoMo or Airtel Money.' ? 'The payment choice was not accepted. Try the pay button again.' : message);
    }
    setShowLookup(false);
    return { ...data.application, emailed: Boolean(data.emailed) };
  };

  const submit = async (event) => {
    event.preventDefault();
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const created = await createApplication();
      setForm((current) => prepareWallet(current));
      setApplication(created);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const recoverNumber = async (event) => {
    event.preventDefault();
    const email = recoverEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter the email you used when you registered.');
      setRecoverNotice('');
      return;
    }
    setRecovering(true);
    setError('');
    setRecoverNotice('');
    try {
      const response = await fetch(`${apiOrigin}/api/applications/${apiName}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not send the email.');
      setRecoverNotice(data.message || 'If an application uses that email, we sent the application number. Check your inbox.');
    } catch (recoverError) {
      setError(recoverError.message);
    } finally {
      setRecovering(false);
    }
  };

  const lookup = async (event) => {
    event.preventDefault();
    const code = lookupCode.trim();
    if (code.length < 4) {
      setError('Enter the application number from your registration.');
      return;
    }
    setChecking(true);
    setError('');
    try {
      await loadApplication(code);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setChecking(false);
    }
  };

  const startPayment = async (code) => {
    const response = await fetch(`${apiOrigin}/api/applications/${apiName}/${encodeURIComponent(code)}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: form.provider,
        paymentPhone: form.paymentPhone,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.application && data.paid) {
      setApplication(data.application);
      setPayment(null);
      return;
    }
    if (!response.ok && response.status !== 202) {
      if (data.application) setApplication(data.application);
      setError(paymentError(data.error, form.provider) || 'Could not start the payment. Please try again.');
      return;
    }
    setPayment(data);
  };

  const pay = async (event) => {
    event.preventDefault();
    const wallet = walletCheck(form.provider, form.paymentPhone);
    if (!wallet.ok) {
      setError(wallet.message);
      return;
    }
    if (!form.agree) {
      setError('Please agree to the terms before paying.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await startPayment(application.code);
    } catch {
      setError('Could not reach HBLab. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const payFromReview = async () => {
    const wallet = walletCheck(form.provider, form.paymentPhone);
    if (!wallet.ok) {
      setError(wallet.message);
      return;
    }
    if (!form.agree) {
      setError('Please agree to the terms before paying.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const created = await createApplication({ withWallet: true });
      if (!created) {
        setError('The application number was not issued. Use Get number, pay later, then pay from that number.');
        return;
      }
      setApplication(created);
      if (created.canPay) await startPayment(created.code);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(application.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const visibleError = error && !(form.provider && error === 'Choose MTN MoMo or Airtel Money.')
    ? paymentError(error, form.provider)
    : '';
  const steps = [
    { id: 1, label: 'Applicant' },
    { id: 2, label: training ? 'Training' : 'Internship' },
    { id: 3, label: 'Review' },
  ];
  const feeLabel = training ? 'Training registration fee' : 'Internship application fee';
  const reasons = training ? TRAINING_REASONS : INTERNSHIP_REASONS;
  const tracks = training ? TRAINING_TRACKS : INTERNSHIP_PLACEMENTS;
  const modes = training ? TRAINING_MODES : INTERNSHIP_MODES;
  const studied = form.educationLevel && form.educationLevel !== 'I am not in school';
  const educated = form.educationLevel && form.educationLevel !== 'Not educated';
  const districts = useMemo(
    () => (form.province ? Districts({ provinces: form.province }) || [] : []),
    [form.province],
  );
  const sectors = useMemo(
    () => sectorsIn(form.province, form.district),
    [form.province, form.district],
  );
  const today = new Date().toISOString().slice(0, 10);
  const stepTitle = ['Who is applying', training ? 'Choose your training' : 'Your placement', 'Review and pay'][step - 1];
  const stepHelp = [
    'Tell us who is applying. You will use this email to recover the application number.',
    training
      ? 'This is a class. HBLab has four trainings. Choose one, then tell us about your studies.'
      : 'This is work with the HBLab team. Choose where you want to work, how long you can stay, and your school situation.',
    'Check every answer. Get your application number now, and pay the 5,000 RWF registration fee when the wallet has the money.',
  ][step - 1];

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f8]">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-28 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">{training ? 'Training' : 'Internship'}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
              {application ? 'Application number' : showLookup ? 'Track application' : training ? 'Training registration' : 'Internship application'}
            </h1>
            {!application && !showLookup ? (
              <p className="mt-1 text-sm text-gray-500">
                {training
                  ? `Training is a class you join to learn a skill. Registration fee ${FEE}.`
                  : `An internship is work experience at HBLab. It is not a training class. Application fee ${FEE}.`}
              </p>
            ) : null}
          </div>
          {!application ? (
            <button
              type="button"
              onClick={() => {
                setShowLookup((current) => !current);
                setError('');
                setRecoverNotice('');
              }}
              className="text-sm font-semibold text-[#166534] hover:underline"
            >
              {showLookup ? 'Start a new application' : 'Track an application'}
            </button>
          ) : null}
        </div>

        <section className="rounded-2xl border border-[#e4e7ec] bg-white p-4 shadow-sm sm:p-8">
          {application ? (
            <div className="space-y-6">
              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f6ee] text-[#166534]">
                  <Icon icon="carbon:checkmark-filled" className="text-3xl" />
                </span>
                <h2 className="mt-4 text-xl font-semibold text-gray-950">
                  {application.canPay ? 'Application saved' : 'Application submitted'}
                </h2>
                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">{statusMessage(application)}</p>
              </div>
              {application.code ? (
                <div className="rounded-xl border border-dashed border-[#166534] bg-[#f3faf6] px-4 py-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#166534]">Application number</p>
                  <p className="mt-2 font-mono text-3xl font-bold tracking-[0.14em] text-gray-950 sm:text-4xl">{application.code}</p>
                  <button type="button" onClick={copyCode} className="mt-3 text-sm font-semibold text-[#166534] hover:underline">
                    {copied ? 'Copied' : 'Copy number'}
                  </button>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusTone[application.status] || statusTone.pending}`}>
                  {application.statusLabel}
                </span>
                <span className="text-sm text-gray-500">{application.fullName} · {application.track}</span>
              </div>
              {application.emailed && application.canPay ? (
                <p className="text-center text-sm text-gray-600">We emailed the application number, the status, and how to pay.</p>
              ) : null}
              {application.status === 'pending' ? (
                <p className="text-center text-sm text-gray-600">The invoice was sent to your email.</p>
              ) : null}
              {payment ? (
                <div className="rounded-xl bg-[#f3faf6] px-4 py-6 text-center">
                  <Icon icon="carbon:phone" className="mx-auto text-3xl text-[#166534]" />
                  <h2 className="mt-3 text-lg font-semibold text-gray-950">Approve {FEE} on your phone</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
                    {payment.provider || providerLabel(form.provider)} sent a collection request to {payment.payerPhone}. Enter your PIN. This page updates when the payment is confirmed.
                  </p>
                  <div className="mx-auto mt-4 max-w-md rounded-lg border border-[#d7eadf] bg-white px-4 py-3 text-left">
                    <p className="text-sm font-semibold text-gray-900">If you do not see the prompt</p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Dial <span className="font-mono text-base font-semibold tracking-wide text-gray-950">*182*7*1#</span> on this {/airtel/i.test(payment.provider || form.provider) ? 'Airtel' : 'MTN'} phone. Open the pending approval and enter your PIN to accept it.
                    </p>
                    {/airtel/i.test(payment.provider || form.provider) ? (
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        You can also open Airtel Money by dialing <span className="font-mono text-base font-semibold tracking-wide text-gray-950">*500#</span>.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : application.canPay ? (
                <form onSubmit={pay} className="space-y-4">
                  <PaymentStep form={form} update={update} setForm={setForm} feeLabel={feeLabel} />
                  <Notice>{visibleError}</Notice>
                  <button
                    type="submit"
                    disabled={submitting || !walletCheck(form.provider, form.paymentPhone).ok}
                    className="h-12 w-full rounded-lg bg-[#166534] text-sm font-semibold text-white hover:bg-[#14532d] disabled:opacity-50"
                  >
                    {submitting ? 'Sending prompt…' : `Pay ${FEE}`}
                  </button>
                </form>
              ) : null}
              <div className="flex flex-col-reverse gap-3 border-t border-[#e4e7ec] pt-5 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setApplication(null);
                    setPayment(null);
                    setError('');
                    setCopied(false);
                    setShowLookup(true);
                  }}
                  className="h-12 rounded-lg border border-[#d0d5dd] px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Track another application
                </button>
                <Link to="/" className="inline-flex h-12 items-center justify-center rounded-lg px-5 text-sm font-semibold text-[#166534] hover:underline">
                  Back to home
                </Link>
              </div>
            </div>
          ) : showLookup ? (
            <div className="space-y-8">
              <form onSubmit={lookup} className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-gray-950">Enter your application number</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {training
                      ? 'Training numbers start with HB, for example HB18492037.'
                      : 'Internship numbers start with IN, for example IN18492037.'}
                  </p>
                </div>
                <Field label="Application number" required>
                  <input
                    value={lookupCode}
                    onChange={(event) => { setLookupCode(event.target.value); setError(''); }}
                    placeholder={training ? 'HB18492037' : 'IN18492037'}
                    className={`${fieldClass} font-mono tracking-wide`}
                  />
                </Field>
                <Notice>{visibleError}</Notice>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="submit" disabled={checking} className="h-12 rounded-lg bg-[#166534] px-6 text-sm font-semibold text-white hover:bg-[#14532d] disabled:opacity-50">
                    {checking ? 'Checking…' : 'Check status'}
                  </button>
                </div>
              </form>
              <form onSubmit={recoverNumber} className="space-y-5 border-t border-[#e4e7ec] pt-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-950">Forgot the number?</h3>
                  <p className="mt-1 text-sm text-gray-500">Enter the email you used. We will send the number again.</p>
                </div>
                <Field label="Email" required>
                  <input
                    type="email"
                    value={recoverEmail}
                    onChange={(event) => { setRecoverEmail(event.target.value); setError(''); setRecoverNotice(''); }}
                    placeholder="you@example.com"
                    className={fieldClass}
                  />
                </Field>
                {recoverNotice ? <p className="rounded-lg bg-[#f3faf6] px-3 py-2.5 text-sm text-[#166534]">{recoverNotice}</p> : null}
                <button type="submit" disabled={recovering} className="h-12 w-full rounded-lg border border-[#166534] text-sm font-semibold text-[#166534] hover:bg-[#f3faf6] disabled:opacity-50 sm:w-auto sm:px-6">
                  {recovering ? 'Sending…' : 'Email me the number'}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={submit}>
              <Stepper
                step={step}
                steps={steps}
                onSelect={(id) => {
                  if (id >= step) return;
                  setError('');
                  setStep(id);
                }}
              />
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#166534]">Step {step} of 3</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-950">{stepTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-gray-500">{stepHelp}</p>
              </div>

              {step === 1 && (
                <div className="space-y-5">
                  <Field label="Full name" required>
                    <input name="fullName" value={form.fullName} onChange={update} autoComplete="name" className={fieldClass} />
                  </Field>
                  <Field label="Email" required hint="We send the application number to this address.">
                    <input type="email" name="email" value={form.email} onChange={update} autoComplete="email" className={fieldClass} />
                  </Field>
                  <Field label="Phone" required>
                    <input name="phone" value={form.phone} onChange={update} inputMode="tel" autoComplete="tel" placeholder="0788 000 000" className={fieldClass} />
                  </Field>
                  <Field label="Country" required hint="Where you live now.">
                    <select name="country" value={form.country} onChange={(event) => choose('country', event.target.value)} className={fieldClass}>
                      {COUNTRIES.map((country) => <option key={country}>{country}</option>)}
                    </select>
                  </Field>
                  {form.country === 'Other' ? (
                    <Field label="Country name" required>
                      <input name="countryOther" value={form.countryOther} onChange={update} className={fieldClass} />
                    </Field>
                  ) : null}
                  {form.country === 'Rwanda' ? (
                    <div className="grid gap-5 sm:grid-cols-3">
                      <Field label="Province" required>
                        <select value={form.province} onChange={(event) => choose('province', event.target.value)} className={fieldClass}>
                          <option value="">Select</option>
                          {Provinces().map((province) => <option key={province} value={province}>{PROVINCE_LABEL[province]}</option>)}
                        </select>
                      </Field>
                      <Field label="District" required>
                        <select value={form.district} onChange={(event) => choose('district', event.target.value)} className={fieldClass} disabled={!form.province}>
                          <option value="">Select</option>
                          {districts.map((district) => <option key={district}>{district}</option>)}
                        </select>
                      </Field>
                      <Field label="Sector" required>
                        <select value={form.sector} onChange={(event) => choose('sector', event.target.value)} className={fieldClass} disabled={!form.district}>
                          <option value="">Select</option>
                          {sectors.map((sector) => <option key={sector}>{sector}</option>)}
                        </select>
                      </Field>
                    </div>
                  ) : (
                    <Field label="City" required>
                      <input name="city" value={form.city} onChange={update} className={fieldClass} />
                    </Field>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  {training ? (
                    <>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Education level" required hint="Choose Not educated if you have not been to school.">
                          <select name="educationLevel" value={form.educationLevel} onChange={update} className={fieldClass}>
                            <option value="">Select level</option>
                            {LEVELS.map((level) => <option key={level}>{level}</option>)}
                          </select>
                        </Field>
                        <Field label="School or institution" required={Boolean(educated)} hint={educated ? 'Required because you studied in REB or another school.' : 'Leave this blank if you are not educated.'}>
                          <input name="school" value={form.school} onChange={update} className={fieldClass} />
                        </Field>
                      </div>
                      <Field label="Field of study" required={Boolean(educated)} hint={educated ? '' : 'Leave this blank if you are not educated.'}>
                        <input name="fieldOfStudy" value={form.fieldOfStudy} onChange={update} className={fieldClass} />
                      </Field>
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-800">Skill level <span className="text-red-600">*</span></p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {SKILLS.map((skill) => {
                            const selected = form.skillLevel === skill.name;
                            return (
                              <button
                                key={skill.name}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => choose('skillLevel', skill.name)}
                                className={`rounded-xl border px-4 py-3 text-left ${selected ? 'border-[#166534] bg-[#f3faf6] text-[#14532d] ring-2 ring-[#166534]' : 'border-[#d0d5dd] text-gray-800 hover:border-[#166534]'}`}
                              >
                                <span className="block text-sm font-semibold">{skill.name}</span>
                                <span className="mt-1 block text-xs font-normal text-gray-500">{skill.detail}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-800">Your situation <span className="text-red-600">*</span></p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {INTERNSHIP_SITUATIONS.map((item) => {
                            const selected = form.educationLevel === item.name;
                            return (
                              <button
                                key={item.name}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => choose('educationLevel', item.name)}
                                className={`rounded-xl border px-4 py-3 text-left ${selected ? 'border-[#166534] bg-[#f3faf6] text-[#14532d] ring-2 ring-[#166534]' : 'border-[#d0d5dd] text-gray-800 hover:border-[#166534]'}`}
                              >
                                <span className="block text-sm font-semibold">{item.name}</span>
                                <span className="mt-1 block text-xs font-normal text-gray-500">{item.detail}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {studied ? (
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label="School or institution" required hint="Required because you are in school or you finished school.">
                            <input name="school" value={form.school} onChange={update} className={fieldClass} />
                          </Field>
                          <Field label="Field of study" required>
                            <input name="fieldOfStudy" value={form.fieldOfStudy} onChange={update} className={fieldClass} />
                          </Field>
                        </div>
                      ) : null}
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-800">How long can you stay? <span className="text-red-600">*</span></p>
                        <div className="grid gap-2 sm:grid-cols-4">
                          {INTERNSHIP_LENGTHS.map((length) => {
                            const selected = form.skillLevel === length;
                            return (
                              <button
                                key={length}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => choose('skillLevel', length)}
                                className={`rounded-xl border px-3 py-3 text-sm font-semibold ${selected ? 'border-[#166534] bg-[#f3faf6] text-[#14532d] ring-2 ring-[#166534]' : 'border-[#d0d5dd] text-gray-800 hover:border-[#166534]'}`}
                              >
                                {length}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-800">{training ? 'Training' : 'Where you want to work'} <span className="text-red-600">*</span></p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {tracks.map((track) => {
                        const selected = form.track === track.name;
                        return (
                          <button
                            key={track.name}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => choose('track', track.name)}
                            className={`rounded-xl border px-4 py-3 text-left ${selected ? 'border-[#166534] bg-[#f3faf6] text-[#14532d] ring-2 ring-[#166534]' : 'border-[#d0d5dd] text-gray-800 hover:border-[#166534]'}`}
                          >
                            <span className="block text-sm font-semibold">{track.name}</span>
                            <span className="mt-1 block text-xs font-normal text-gray-500">{track.detail}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-800">{training ? 'How you want to learn' : 'How you will work'} <span className="text-red-600">*</span></p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {modes.map((mode) => {
                        const selected = form.mode === mode.name;
                        return (
                          <button
                            key={mode.name}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => choose('mode', mode.name)}
                            className={`rounded-xl border px-3 py-3 text-left ${selected ? 'border-[#166534] bg-[#f3faf6] text-[#14532d] ring-2 ring-[#166534]' : 'border-[#d0d5dd] text-gray-800 hover:border-[#166534]'}`}
                          >
                            <span className="block text-sm font-semibold">{mode.name}</span>
                            <span className="mt-1 block text-xs font-normal text-gray-500">{mode.detail}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="When you can start" required hint="Choose Immediately, or pick the date you can begin.">
                      <select value={form.startWhen} onChange={(event) => choose('startWhen', event.target.value)} className={fieldClass}>
                        <option value="">Select</option>
                        {STARTS.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </Field>
                    {form.startWhen === 'Choose a date' ? (
                      <Field label="Start date" required>
                        <input type="date" name="startDate" min={today} value={form.startDate} onChange={update} className={fieldClass} />
                      </Field>
                    ) : (
                      <Field label={training ? 'Portfolio or GitHub' : 'CV or portfolio'} hint="Optional. Leave it blank if you do not have a link.">
                        <input name="portfolio" value={form.portfolio} onChange={update} placeholder="https://" className={fieldClass} />
                      </Field>
                    )}
                  </div>
                  {form.startWhen === 'Choose a date' ? (
                    <Field label={training ? 'Portfolio or GitHub' : 'CV or portfolio'} hint="Optional. Leave it blank if you do not have a link.">
                      <input name="portfolio" value={form.portfolio} onChange={update} placeholder="https://" className={fieldClass} />
                    </Field>
                  ) : null}
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-800">{training ? 'Why do you want this training?' : 'Why do you want this internship?'} <span className="text-red-600">*</span></p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {reasons.map((item) => {
                        const selected = form.reason === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => choose('reason', item)}
                            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${selected ? 'border-[#166534] bg-[#f3faf6] text-[#14532d] ring-2 ring-[#166534]' : 'border-[#d0d5dd] text-gray-800 hover:border-[#166534]'}`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                    {form.reason === 'Other' ? (
                      <textarea name="reasonOther" value={form.reasonOther} onChange={update} rows={3} placeholder="Write your reason" className={`${fieldClass} mt-3 h-auto py-3`} />
                    ) : null}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <SummaryGroup
                    title="Applicant details"
                    onEdit={() => { setError(''); setStep(1); }}
                    rows={[
                      ['Full name', form.fullName],
                      ['Email', form.email],
                      ['Phone', form.phone],
                      ['Where you live', livedIn(form)],
                    ]}
                  />
                  <SummaryGroup
                    title={training ? 'Training' : 'Internship placement'}
                    onEdit={() => { setError(''); setStep(2); }}
                    rows={training ? [
                      ['Education level', form.educationLevel],
                      ['School', form.school],
                      ['Field of study', form.fieldOfStudy],
                      ['Skill level', form.skillLevel],
                      ['Training', form.track],
                      ['How you will learn', form.mode],
                      ['Start', startLabel(form)],
                      ['Why', reasonText(form)],
                      ['Portfolio', form.portfolio],
                    ] : [
                      ['Your situation', form.educationLevel],
                      ['School', form.school],
                      ['Field of study', form.fieldOfStudy],
                      ['Where you will work', form.track],
                      ['How long', form.skillLevel],
                      ['How you will work', form.mode],
                      ['Start', startLabel(form)],
                      ['Why', reasonText(form)],
                      ['CV or portfolio', form.portfolio],
                    ]}
                  />
                  <PaymentStep form={form} update={update} setForm={setForm} feeLabel={feeLabel} />
                </div>
              )}

              <div className="mt-6 space-y-4 border-t border-[#e4e7ec] pt-5">
                <Notice>{visibleError}</Notice>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {step > 1 ? (
                    <button type="button" onClick={() => { setError(''); setStep((current) => current - 1); }} className="h-12 rounded-lg border border-[#d0d5dd] px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      Previous
                    </button>
                  ) : <span className="hidden sm:block" />}
                  {step < 3 ? (
                    <button type="button" onClick={goNext} className="h-12 rounded-lg bg-[#166534] px-8 text-sm font-semibold text-white hover:bg-[#14532d] sm:ml-auto sm:min-w-40">
                      Next
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="h-12 rounded-lg border border-[#d0d5dd] px-5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {submitting ? 'Saving…' : 'Get number, pay later'}
                      </button>
                      <button
                        type="button"
                        onClick={payFromReview}
                        disabled={submitting || !walletCheck(form.provider, form.paymentPhone).ok || !form.agree}
                        className="h-12 rounded-lg bg-[#166534] px-5 text-sm font-semibold text-white hover:bg-[#14532d] disabled:opacity-50"
                      >
                        {submitting ? 'Sending prompt…' : `Pay ${FEE}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default InternshipRegister;
