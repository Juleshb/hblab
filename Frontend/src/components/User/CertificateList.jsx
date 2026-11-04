import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../../assets/context/AuthContext';
import { buildCertificateHtml } from '../certificate/certificateMarkup';

const CertificateList = ({ userId, certificates: propCertificates, loading: propLoading }) => {
  const [certificates, setCertificates] = useState(propCertificates || []);
  const [loading, setLoading] = useState(propLoading !== undefined ? propLoading : true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (propCertificates !== undefined) {
      setCertificates(propCertificates);
      setLoading(!!propLoading);
      return;
    }
    const fetchCertificates = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:3000/api/certificates?userId=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCertificates(response.data.certificates || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load certificates');
        setLoading(false);
      }
    };
    if (userId) fetchCertificates();
  }, [userId, propCertificates, propLoading]);

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

  if (loading) return <div className="text-green-700">Loading certificates...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-green-900 mb-2">Certificates</h3>
      <ul className="divide-y divide-gray-200">
        {(certificates || []).map((cert) => (
          <li key={cert.id} className="py-2 flex justify-between items-center">
            <span>{cert.courseName} Certificate</span>
            <button
              onClick={() => handleDownload(cert)}
              className="text-green-700 hover:underline px-2 py-1 rounded bg-green-50 hover:bg-green-100 transition text-xs"
              disabled={downloadingId === cert.id}
            >
              {downloadingId === cert.id ? 'Downloading...' : 'Download'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default CertificateList; 