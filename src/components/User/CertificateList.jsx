import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../../assets/context/AuthContext';

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

      certificateContainer.innerHTML = `
         <div style="
      border: 10px solid rgba(3, 61, 22, 0.63); 
      width: 100%; 
      min-height: 850px; 
      display: flex; 
      flex-direction: column; 
      position: relative; 
      background-image: url('/images/dd.jpg');
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      font-family: 'Poppins', sans-serif;
    ">
          
          <!-- Top Banner -->
          <div style="background: rgba(3, 61, 22, 0.45); color: white; text-align: center; padding: 20px;"> 
          <div style="font-size: 40px; font-weight: bold;">
          <center>
              <img src="/images/logo.png" alt="Logo" style="height: 160px; width: 160px">
              </center>
              INTERNSHIP CERTIFICATE
            </div>
          </div>
  
          <!-- Badge -->
          <div style="margin: 30px auto 20px;">
            <img src="/images/bdg.png" alt="Attendee Badge" style="height: 200px;" />
          </div>
  
          <!-- Recipient Info -->
          <div style="text-align: center; padding: 0 60px;">
            <p style="font-size: 18px; margin: 0 0 10px;">This Certificate is Proudly Presented to</p>
            <h2 style="font-size: 36px; font-family: 'Silentha', cursive; font-weight: bold; margin: 10px 0; color:rgb(3, 61, 22);">${cert.recipientName}</h2>
            <p style="font-size: 18px; margin: 20px 0;">
              We sincerely appreciate your dedication and valuable contribution during your internship at  
              <strong>“Hb-Lab”</strong>.
            </p>
            ${cert.dateRange ? `<p style="margin: 8px 0;"><strong>Training Period:</strong> ${cert.dateRange}</p>` : ''}
            <p style="margin: 8px 0;"><strong>Date of Completion:</strong> ${new Date(cert.completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
  
          <!-- Skills Section -->
          ${cert.skills?.length ? `
            <div style="margin: 30px 60px 0;">
              <h4 style="font-size: 20px; text-align: center; font-weight: bold; margin-bottom: 10px; color: rgb(3, 61, 22);">Skills Acquired:</h4>
              <ul style="text-align: center; font-size: 16px; padding-left: 20px;">
                ${cert.skills.map(skill => `<li>${skill}</li>`).join('')}
              </ul>
            </div>` : ''}
  
          <!-- Signatures -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin: 40px 60px 20px;">
            <div style="text-align: center;">
              <img src="/signatures/jules-signature.png" alt="Signature" style="height: 70px;"><br/>
              <strong style="font-size: 16px;">Mr. Jules HABARUREMA</strong><br/>
              <span style="font-size: 14px;">Chief Executive Officer</span><br/>
              <span style="font-size: 14px;">HB-Lab</span>
            </div>
  
            
            <div style="text-align: center;">
              <img src="${qrCodeUrl}" style="width: 100px; height: 120px;" alt="QR Code"/><br/>
              <span style="font-size: 12px; color: #444;">Scan to verify</span>
            </div>
  
            <div style="text-align: center;">
              <img src="/signatures/ferdinard-signature.png" alt="Signature" style="height: 70px;"><br/>
              <strong style="font-size: 16px;">Mr. Ferdnard KWIZERA</strong><br/>
              <span style="font-size: 14px;">Training Coordinator</span><br/>
              <span style="font-size: 14px;">HB-Lab</span>
            </div>
  
          </div>
  
          <!-- Footer: Certificate ID & Sponsors -->
          <div style="text-align: center; font-size: 12px; color: #777; margin-bottom: 10px;">
            Certificate ID: ${cert.certificateId}
          </div>
  
          <div style="border-top: 1px solid #ccc; margin: 10px 60px; padding-top: 10px; display: flex; justify-content: center; flex-wrap: wrap; gap: 20px;">
            <img src="/sponsors/buttercms.png" style="height: 30px;" alt="ButterCMS" />
            <img src="/sponsors/twicpics.png" style="height: 30px;" alt="TwicPics" />
            <img src="/sponsors/base.png" style="height: 30px;" alt="Base" />
            <img src="/sponsors/progress.png" style="height: 30px;" alt="Progress" />
            <img src="/sponsors/stormkit.png" style="height: 30px;" alt="Stormkit" />
          </div>
        </div>
      `;

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