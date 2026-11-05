import React, { useState, useEffect } from 'react';
import { StudentLayout } from './index';
import { Icon } from '@iconify/react';
import { useAuth } from '../../assets/context/AuthContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import StudentHeader from './StudentHeader';
import { buildCertificateHtml } from '../certificate/certificateMarkup';
import { apiOrigin } from '../../apiOrigin';

const EMPTY_ILLUSTRATION = 'https://undraw.co/api/illustrations/empty?color=teal';

const StudentCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const certsPerPage = 8;
  const [downloadingId, setDownloadingId] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true);
      try {
        if (user?.email) {
          const res = await fetch(`${apiOrigin}/api/certificates/email/${user.email}`);
          const data = await res.json();
          setCertificates(data);
        }
      } catch (err) {
        console.error('Error fetching certificates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, [user]);

  const indexOfLastCert = currentPage * certsPerPage;
  const indexOfFirstCert = indexOfLastCert - certsPerPage;
  const currentCerts = certificates.slice(indexOfFirstCert, indexOfLastCert);
  const totalPages = Math.ceil(certificates.length / certsPerPage);

  const handleDownload = async (cert) => {
    if (!user?.email || user.email !== cert.email) {
      alert('You are not authorized to download this certificate.');
      return;
    }
    setDownloadingId(cert.id);
    try {
      const certificateContainer = document.createElement('div');
      certificateContainer.style.position = 'absolute';
      certificateContainer.style.left = '-9999px';
      certificateContainer.style.width = '1200px';
      certificateContainer.style.padding = '0';
      certificateContainer.style.background = 'white';
      certificateContainer.style.fontFamily = "'Poppins', sans-serif";

      const qrData = `https://www.hblab.rw/verfiy/${cert.certificateId}`;
      const encodedData = encodeURIComponent(qrData);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedData}`;

      certificateContainer.innerHTML = buildCertificateHtml(cert, qrCodeUrl);

      document.body.appendChild(certificateContainer);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(certificateContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        allowTaint: true
      });

      document.body.removeChild(certificateContainer);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.save(`HB-Lab-Certificate-${cert.recipientName.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <StudentLayout title="My Achievements">
          <h1 className="text-base font-bold text-green-900 mb-2 tracking-tight">My Certificates</h1>
          <div className="bg-white rounded-lg shadow border border-green-100 p-2 sm:p-4 mt-0">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Icon icon="eos-icons:loading" className="h-8 w-8 animate-spin text-teal-700" />
              </div>
            ) : currentCerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <img src={EMPTY_ILLUSTRATION} alt="No certificates" className="w-32 h-32 mb-3 opacity-80" />
                <p className="text-base text-gray-500 mb-1 font-semibold">No certificates found.</p>
                <p className="text-xs text-gray-400">Complete a course to earn your first certificate!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-green-100 text-xs rounded-xl overflow-hidden">
                  <thead className="bg-green-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-green-700 uppercase tracking-wider">Name</th>
                      <th className="px-2 py-2 text-left font-semibold text-green-700 uppercase tracking-wider">Course</th>
                      <th className="px-2 py-2 text-left font-semibold text-green-700 uppercase tracking-wider">Completed</th>
                      <th className="px-2 py-2 text-left font-semibold text-green-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-green-50">
                    {currentCerts.map(cert => (
                      <tr key={cert.id} className="hover:bg-green-50/60 transition">
                        <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-900">{cert.recipientName}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-gray-700">{cert.courseName}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-gray-500">{cert.completionDate ? new Date(cert.completionDate).toLocaleDateString() : ''}</td>
                        <td className="px-2 py-2 whitespace-nowrap flex gap-2 items-center">
                          <button
                            onClick={() => handleDownload(cert)}
                            className="text-green-700 hover:underline px-2 py-1 rounded bg-green-50 hover:bg-green-100 transition text-xs"
                            disabled={downloadingId === cert.id}
                          >
                            {downloadingId === cert.id ? 'Downloading...' : 'Download'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-3 gap-2">
                  <div className="text-[10px] text-gray-500">
                    Showing {indexOfFirstCert + 1}-{Math.min(indexOfLastCert, certificates.length)} of {certificates.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 text-xs"
                    >
                      Prev
                    </button>
                    <span className="px-2 py-1">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 text-xs"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </StudentLayout>
  );
};

export default StudentCertificates; 