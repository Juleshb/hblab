import { useRef, useState } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { apiOrigin } from '../../apiOrigin';
import { downloadCertificateTemplate, parseCertificateSheet } from './certificateExcel';

const CertificateExcelImport = ({ onClose, onCreated }) => {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null);

  const readFile = async (file) => {
    setFileName(file.name);
    setResult(null);
    setProgress('');
    const buffer = await file.arrayBuffer();
    const parsed = parseCertificateSheet(buffer);
    setRows(parsed.rows);
    setErrors(parsed.errors);
  };

  const createCertificates = async () => {
    setCreating(true);
    setResult(null);
    const created = [];
    const failed = [];
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      setProgress(`Creating ${index + 1} of ${rows.length}`);
      try {
        const response = await axios.post(`${apiOrigin}/api/certificates`, {
          recipientName: row.recipientName,
          email: row.email,
          courseName: row.courseName,
          duration: row.duration,
          dateRange: row.dateRange,
          completionDate: row.completionDate,
          skills: row.skills,
        });
        created.push(response.data);
      } catch (error) {
        failed.push({
          row: row.row,
          message: error.response?.data?.error || 'could not be saved',
        });
      }
    }
    setCreating(false);
    setProgress('');
    setResult({ created: created.length, failed });
    if (created.length) onCreated(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={creating ? undefined : onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white">
          <div>
            <h2 className="text-2xl font-bold">Upload Excel</h2>
            <p className="mt-1 text-sm text-green-100">Each row becomes one certificate.</p>
          </div>
          <button type="button" onClick={onClose} disabled={creating} className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white">
            <Icon icon="carbon:close" className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-5 overflow-y-auto p-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadCertificateTemplate}
              className="inline-flex items-center rounded-lg border border-green-200 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50"
            >
              <Icon icon="carbon:download" className="mr-1 h-4 w-4" />
              Download template
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              <Icon icon="carbon:document" className="mr-1 h-4 w-4" />
              Choose Excel file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) readFile(file);
              }}
            />
          </div>
          <p className="text-sm text-gray-600">
            Use columns for name, email, and course. Duration, date range, completion date, and skills are optional. Separate skills with commas.
          </p>
          {fileName ? <p className="text-sm font-medium text-gray-900">{fileName}</p> : null}
          {errors.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">{errors.length} row{errors.length === 1 ? '' : 's'} will be skipped</p>
              <ul className="mt-2 space-y-1">
                {errors.slice(0, 8).map((error) => (
                  <li key={`${error.row}-${error.message}`}>Row {error.row}: {error.message}</li>
                ))}
              </ul>
            </div>
          )}
          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Course</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 8).map((row) => (
                    <tr key={row.row} className="border-t border-gray-100">
                      <td className="px-3 py-2">{row.recipientName}</td>
                      <td className="px-3 py-2">{row.email}</td>
                      <td className="px-3 py-2">{row.courseName}</td>
                      <td className="px-3 py-2">{row.completionDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 8 ? <p className="px-3 py-2 text-xs text-gray-500">And {rows.length - 8} more.</p> : null}
            </div>
          )}
          {result && (
            <p className="text-sm text-gray-800">
              Created {result.created} certificate{result.created === 1 ? '' : 's'}.
              {result.failed.length ? ` ${result.failed.length} could not be saved.` : ''}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={createCertificates}
              disabled={creating || rows.length === 0}
              className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {creating ? progress || 'Creating...' : rows.length ? `Create ${rows.length} certificate${rows.length === 1 ? '' : 's'}` : 'Create certificates'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateExcelImport;
