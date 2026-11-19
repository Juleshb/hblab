import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';
import { apiOrigin } from '../apiOrigin';

const LetterCheck = () => {
  const { code } = useParams();
  const [params] = useSearchParams();
  const [state, setState] = useState('loading');
  const [letter, setLetter] = useState(null);

  useEffect(() => {
    let active = true;
    axios.get(`${apiOrigin}/api/applications/letters/${encodeURIComponent(code || '')}`, {
      params: { v: params.get('v') || '' },
    }).then((response) => {
      if (!active) return;
      if (response.data?.official) {
        setLetter(response.data);
        setState('official');
      } else {
        setState('unofficial');
      }
    }).catch(() => {
      if (active) setState('unofficial');
    });
    return () => {
      active = false;
    };
  }, [code, params]);

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 pb-16 pt-28">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-sm">
          {state === 'loading' ? (
            <p className="text-center text-sm text-gray-500">Checking this letter…</p>
          ) : null}
          {state === 'official' && letter ? (
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#166534] text-white">
                <Icon icon="carbon:checkmark" className="text-3xl" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#166534]">Official letter</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">This letter was issued by HBLab</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                High Technology Builder Lab Ltd issued this acceptance letter. The name and details below match our records.
              </p>
              <dl className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100">
                {[
                  ['Letter number', letter.letterNumber],
                  ['Name', letter.fullName],
                  [letter.program === 'Training' ? 'Training' : 'Internship', letter.track],
                  ['Issued', letter.issuedOn],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label} className="px-4 py-3">
                    <dt className="text-[11px] uppercase tracking-wider text-slate-400">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
          {state === 'unofficial' ? (
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600 text-white">
                <Icon icon="carbon:close" className="text-3xl" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">This is not an official HBLab letter</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The code does not match an acceptance letter issued by High Technology Builder Lab Ltd.
              </p>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LetterCheck;
