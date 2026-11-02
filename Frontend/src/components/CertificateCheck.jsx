import  { useState } from 'react';
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
      const response = await axios.post('https://umuhuza.store/api/certificates/check', { email });
      
      if (response.data.exists) {
        setCertificateData(response.data.certificate);
        setCertificateFound(true);
        setMessage('Certificate found! Click download to get your PDF.');
      } else {
        setMessage('No certificate found for this email address.');
      }
    } catch (error) {
      console.error('Error checking certificate:', error);
      setMessage(error.response?.data?.error || 'No certificate found for this email address.');
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
    certificateContainer.style.padding = '0';
    certificateContainer.style.background = 'white';
    certificateContainer.style.fontFamily = "'Poppins', sans-serif";

const qrData = `https://www.hblab.rw/verfiy/${data.certificateId}`;
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
          <h2 style="font-size: 36px; font-family: 'Silentha', cursive; font-weight: bold; margin: 10px 0; color:rgb(3, 61, 22);">${data.recipientName}</h2>
          <p style="font-size: 18px; margin: 20px 0;">
            We sincerely appreciate your dedication and valuable contribution during your internship at  
            <strong>“Hb-Lab”</strong>.
          </p>
          ${data.dateRange ? `<p style="margin: 8px 0;"><strong>Training Period:</strong> ${data.dateRange}</p>` : ''}
          <p style="margin: 8px 0;"><strong>Date of Completion:</strong> ${new Date(data.completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <!-- Skills Section -->
        ${data.skills?.length ? `
          <div style="margin: 30px 60px 0;">
            <h4 style="font-size: 20px; text-align: center; font-weight: bold; margin-bottom: 10px; color: rgb(3, 61, 22);">Skills Acquired:</h4>
            <ul style="text-align: center; font-size: 16px; padding-left: 20px;">
              ${data.skills.map(skill => `<li>${skill}</li>`).join('')}
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
          Certificate ID: ${data.certificateId}
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