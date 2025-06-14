import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Navbar from './Navbar';
import Footer from './Footer';

const CertificateRetrieval = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [certificateData, setCertificateData] = useState(null);
  const [certificateFound, setCertificateFound] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setLoading(true);
    setMessage('');
    setCertificateFound(false);

    try {
      const response = await axios.post('http://localhost:3000/api/certificates/check', { email });
      
      if (response.data.exists) {
        setCertificateData(response.data.certificate);
        setCertificateFound(true);
        setMessage('Certificate found! Click download to get your PDF.');
      } else {
        setMessage('No certificate found for this email address.');
      }
    } catch (error) {
      console.error('Error checking certificate:', error);
      setMessage(error.response?.data?.error || 'An error occurred while checking for your certificate.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (data) => {
    if (!data || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    setMessage('Generating PDF...');

    try {
      const certificateContainer = document.createElement('div');
      certificateContainer.style.position = 'absolute';
      certificateContainer.style.left = '-9999px';
      certificateContainer.style.width = '1200px';
      certificateContainer.style.padding = '60px';
      certificateContainer.style.background = 'white';
      
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.certificateId)}`;
      
      certificateContainer.innerHTML = `
        <div style="font-family: 'Times New Roman', serif; position: relative; width: 100%; text-align: center; padding: 60px; border: 10px solid #14532d; min-height: 800px; display: flex; flex-direction: column;">
          <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-45deg); 
                     font-size: 72px; font-weight: bold; color: #14532d; opacity: 0.1; white-space: nowrap; z-index: 0;">
            HBLAB CERTIFIED
          </div>
          
          <div style="margin-bottom: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <img src="/images/hb-lab-logo.png" style="height: 100px; margin-bottom: 15px;" alt="HB-Lab Logo" />
            <div style="font-size: 18px; font-weight: bold; color: #14532d; letter-spacing: 1px;">HB-Lab</div>
            <div style="width: 80%; height: 2px; background: #14532d; margin: 15px auto;"></div>
          </div>
          
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <h1 style="font-size: 42px; font-weight: bold; color: #14532d; margin-bottom: 30px; letter-spacing: 1px;">
              CERTIFICATE OF COMPLETION
            </h1>
            
            <p style="font-size: 20px; margin-bottom: 20px;">
              This is to certify that
            </p>
            
            <h2 style="font-size: 36px; font-weight: bold; color: #14532d; margin: 20px 0; text-decoration: underline; line-height: 1.2;">
              ${data.recipientName}
            </h2>
            
            <p style="font-size: 20px; margin-bottom: 20px;">
              has successfully completed the training program
            </p>
            
            <h3 style="font-size: 28px; font-weight: bold; color: #14532d; margin: 20px 0 30px; line-height: 1.3;">
              "${data.courseName}"
            </h3>
            
            <div style="text-align: center; margin-bottom: 40px; font-size: 18px; line-height: 1.6;">
              ${data.duration ? `<p style="margin: 8px 0;"><strong>Duration:</strong> ${data.duration}</p>` : ''}
              <p style="margin: 8px 0;"><strong>Date of Completion:</strong> ${new Date(data.completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              ${data.dateRange ? `<p style="margin: 8px 0;"><strong>Training Period:</strong> ${data.dateRange}</p>` : ''}
            </div>
            
            ${data.skills?.length > 0 ? `
              <div style="margin-bottom: 40px;">
                <h4 style="font-size: 22px; font-weight: bold; color: #14532d; margin-bottom: 15px;">
                  Skills Acquired:
                </h4>
                <ul style="display: inline-block; text-align: left; margin: 0 auto; padding-left: 20px; font-size: 18px; line-height: 1.6;">
                  ${data.skills.map(skill => `<li style="margin-bottom: 6px;">${skill}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
          
          <div style="margin-top: auto; padding-top: 40px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div style="display: flex; gap: 80px; flex: 1;">
                <div style="width: 250px; text-align: center;">
                  <div style="margin-bottom: 10px;">
                    <div style="font-weight: bold; font-size: 18px; color: #14532d;">Mr. Jules HABARUREMA</div>
                    <div style="font-size: 16px; color: #555;">Chief Executive Officer</div>
                    <div style="font-size: 16px; color: #555;">HB-Lab</div>
                  </div>
                  <div style="height: 1px; background: #ccc; margin: 10px 0;"></div>
                  <div style="height: 80px; display: flex; justify-content: center; align-items: center;">
                    <img src="/signatures/jules-signature.png" style="height: 60px; width: auto;" alt="CEO's Signature" />
                  </div>
                </div>
                
                <div style="width: 250px; text-align: center;">
                  <div style="margin-bottom: 10px;">
                    <div style="font-weight: bold; font-size: 18px; color: #14532d;">Mr. Ferdnard KWIZERA</div>
                    <div style="font-size: 16px; color: #555;">Training Coordinator</div>
                    <div style="font-size: 16px; color: #555;">HB-Lab</div>
                  </div>
                  <div style="height: 1px; background: #ccc; margin: 10px 0;"></div>
                  <div style="height: 80px; display: flex; justify-content: center; align-items: center;">
                    <img src="/signatures/ferdinard-signature.png" style="height: 60px; width: auto;" alt="Coordinator's Signature" />
                  </div>
                </div>
              </div>
              
              <div style="width: 200px; text-align: center;">
                <img src="${qrCodeUrl}" style="width: 120px; height: 120px;" alt="Verification QR Code" />
                <div style="font-size: 14px; color: #666; margin-top: 8px;">
                  Scan to verify authenticity
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #666;">
              Certificate ID: ${data.certificateId}
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(certificateContainer);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const canvas = await html2canvas(certificateContainer, {
        scale: 2,
        useCORS: true,
        logging: true,
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
      
      pdf.save(`HB-Lab-Certificate-${data.recipientName.replace(/\s+/g, '-')}.pdf`);
      setMessage('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 bg-white p-8 rounded-lg shadow-md flex flex-col">
              <div className="flex items-center mb-6">
                <Icon icon="carbon:certificate" className="text-green-900 text-3xl mr-4" />
                <h2 className="text-2xl font-bold text-green-900">About Your Certificate</h2>
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="mb-6 text-gray-700">
                    Welcome to HB-Lab Academy's certificate verification portal. Retrieve your digital certificate 
                    of completion using the email address you registered with.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <Icon icon="carbon:checkmark-outline" className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                      <span>Official digital credential with unique verification ID</span>
                    </div>
                    <div className="flex items-start">
                      <Icon icon="carbon:checkmark-outline" className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                      <span>Contains your course details and completion date</span>
                    </div>
                    <div className="flex items-start">
                      <Icon icon="carbon:checkmark-outline" className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                      <span>Downloadable as a high-quality PDF document</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Icon icon="carbon:information" className="text-green-900 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      If you can't find your certificate, please contact support with your registration details.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-green-900">Retrieve Your Certificate</h1>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon icon="carbon:search" className="text-green-900 text-xl" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="email" className="flex items-center text-gray-700">
                    <Icon icon="carbon:email" className="mr-2 text-green-900" />
                    <span>Your Registered Email</span>
                  </label>
                  <div className="flex">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-grow px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="your.email@example.com"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex items-center justify-center px-6 py-3 border border-transparent rounded-r-lg shadow-sm font-medium text-white ${
                        loading ? 'bg-green-400' : 'bg-green-900 hover:bg-green-800'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    >
                      {loading ? (
                        <>
                          <Icon icon="eos-icons:loading" className="mr-2 h-5 w-5 animate-spin" />
                          Verifying
                        </>
                      ) : (
                        'Verify'
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {message && (
                <div className={`flex items-start mt-6 p-4 rounded-lg text-sm ${
                  certificateFound ? 'bg-green-100 text-green-900' : 
                  message.includes('error') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  <Icon 
                    icon={
                      certificateFound ? "carbon:checkmark-filled" :
                      message.includes('error') ? "carbon:warning-filled" : "carbon:information-filled"
                    } 
                    className="mr-3 mt-0.5 flex-shrink-0 text-lg" 
                  />
                  <span>{message}</span>
                </div>
              )}

              {certificateData && certificateFound && (
                <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-green-900 p-4 flex items-center justify-between">
                    <h3 className="font-medium text-lg text-white">Certificate Details</h3>
                    <div className="flex items-center text-green-200 text-sm">
                      <Icon icon="carbon:id" className="mr-1" />
                      <span>{certificateData.certificateId}</span>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="flex">
                      <span className="font-semibold text-gray-700 w-28">Name:</span>
                      <span>{certificateData.recipientName}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-700 w-28">Course:</span>
                      <span>{certificateData.courseName}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-700 w-28">Completed:</span>
                      <span>{new Date(certificateData.completionDate).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <button
                        onClick={() => generatePDF(certificateData)}
                        disabled={isGeneratingPDF}
                        className={`w-full flex items-center justify-center py-3 px-6 rounded-lg text-white ${
                          isGeneratingPDF ? 'bg-blue-400 cursor-not-allowed' : 'bg-green-900 hover:bg-green-800'
                        }`}
                      >
                        <Icon 
                          icon={isGeneratingPDF ? "eos-icons:loading" : "carbon:download"} 
                          className={`mr-3 h-5 w-5 ${isGeneratingPDF ? 'animate-spin' : ''}`} 
                        />
                        {isGeneratingPDF ? 'Generating PDF...' : 'Download Certificate'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CertificateRetrieval;