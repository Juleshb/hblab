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
      // Create a temporary container for the certificate
      const certificateContainer = document.createElement('div');
      certificateContainer.style.position = 'absolute';
      certificateContainer.style.left = '-9999px';
      certificateContainer.style.width = '1000px';
      certificateContainer.style.padding = '40px';
      certificateContainer.style.background = 'white';
      
      // Certificate HTML template - updated to match HB-Lab design
      certificateContainer.innerHTML = `
        <div style="font-family: 'Times New Roman', serif; position: relative; width: 100%; text-align: center; padding: 40px; border: 8px solid #1a365d;">
          <!-- Watermark background -->
          <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-45deg); 
                     font-size: 48px; font-weight: bold; color: #1a365d; opacity: 0.1; white-space: nowrap; z-index: 0;">
            HBLAB CERTIFIED
          </div>
          
          <!-- Main content -->
          <div style="position: relative; z-index: 1;">
            <!-- Header with logo -->
            <div style="margin-bottom: 30px;">
              <div style="font-size: 24px; font-weight: bold; color: #1a365d; margin-bottom: 5px;">
                HB-Lab 
              </div>
              <div style="width: 100%; height: 2px; background: #1a365d; margin: 10px auto;"></div>
            </div>
            
            <!-- Title -->
            <h1 style="font-size: 32px; font-weight: bold; color: #1a365d; margin-bottom: 30px;">
              Certificate of Completion
            </h1>
            
            <!-- Introductory text -->
            <p style="font-size: 16px; margin-bottom: 20px;">
              This is to certify that
            </p>
            
            <!-- Recipient name -->
            <h2 style="font-size: 24px; font-weight: bold; color: #1a365d; margin-bottom: 30px; text-decoration: underline;">
              ${data.recipientName}
            </h2>
            
            <!-- Course completion text -->
            <p style="font-size: 16px; margin-bottom: 20px;">
              has successfully completed the course
            </p>
            
            <h3 style="font-size: 20px; font-weight: bold; color: #1a365d; margin-bottom: 30px;">
              "${data.courseName}"
            </h3>
            
            <div style="text-align: center; margin-bottom: 30px;">
              ${data.duration ? `<p style="margin: 5px 0;"><strong>Duration:</strong> ${data.duration}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Completion Date:</strong> ${new Date(data.completionDate).toLocaleDateString()}</p>
              ${data.dateRange ? `<p style="margin: 5px 0;"><strong>Date Range:</strong> ${data.dateRange}</p>` : ''}
            </div>
            
            ${data.skills?.length > 0 ? `
              <div style="margin-bottom: 30px;">
                <h4 style="font-size: 18px; font-weight: bold; color: #1a365d; margin-bottom: 10px;">
                  Skills Covered:
                </h4>
                <ul style="text-align: left; width: 80%; margin: 0 auto; padding-left: 20px;">
                  ${data.skills.map(skill => `<li style="margin-bottom: 5px;">${skill}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <!-- Signatures section -->
            <div style="display: flex; justify-content: space-around; margin-top: 60px;">
              <div style="width: 200px; text-align: center;">
                <div style="height: 80px; margin-bottom: 10px;">
                  <!-- Replace with actual signature image -->
                  <img src="../assets/Jules Signture.png" style="height: 50px; width: auto;" alt="Director's Signature" />
                </div>
                <div style="font-weight: bold;">Mr.Jules HABARUREMA</div>
                <div style="font-size: 12px;">CEO</div>
                <div style="font-size: 12px;">HB-Lab </div>
              </div>
              
              <div style="width: 200px; text-align: center;">
                <div style="height: 80px; margin-bottom: 10px;">
                  <!-- Replace with actual signature image -->
                  <img src="../assets/Ferdnard Signature.png" style="height: 50px; width: auto;" alt="Manager's Signature" />
                </div>
                <div style="font-weight: bold;">Mr.Ferdnard KWIZERA</div>
                <div style="font-size: 12px;">Training Cordinator</div>
                <div style="font-size: 12px;">HB-Lab </div>
              </div>
            </div>
            
            <!-- Verification ID -->
            <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #666;">
              Verification ID: ${data.certificateId}
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(certificateContainer);
      
      // Wait for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate canvas from HTML
      const canvas = await html2canvas(certificateContainer, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: null,
        allowTaint: true
      });
      
      // Remove temporary container
      document.body.removeChild(certificateContainer);
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions to fit the PDF page
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgRatio = canvas.width / canvas.height;
      const pdfRatio = pdfWidth / pdfHeight;
      
      let finalWidth, finalHeight;
      
      if (imgRatio > pdfRatio) {
        finalWidth = pdfWidth;
        finalHeight = pdfWidth / imgRatio;
      } else {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * imgRatio;
      }
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 
        (pdfWidth - finalWidth) / 2,
        (pdfHeight - finalHeight) / 2,
        finalWidth,
        finalHeight
      );
      
      // Save the PDF
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
            {/* Description Section */}
            <div className="flex-1 bg-white p-8 rounded-lg shadow-md flex flex-col">
              <div className="flex items-center mb-6">
                <Icon icon="carbon:certificate" className="text-green-800 text-3xl mr-4" />
                <h2 className="text-2xl font-bold text-green-900">About Your Certificate</h2>
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="mb-6 text-gray-700">
                    Welcome to HB-Lab 's certificate verification portal. Retrieve your digital certificate 
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
                    <Icon icon="carbon:information" className="text-green-800 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      If you can't find your certificate, please contact support with your registration details.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Retrieval Form */}
            <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-green-900">Retrieve Your Certificate</h1>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon icon="carbon:search" className="text-green-800 text-xl" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="email" className="flex items-center text-gray-700">
                    <Icon icon="carbon:email" className="mr-2 text-green-800" />
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
                        loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
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

              {/* Message Display */}
              {message && (
                <div className={`flex items-start mt-6 p-4 rounded-lg text-sm ${
                  certificateFound ? 'bg-green-100 text-green-800' : 
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

              {/* Certificate Preview */}
              {certificateData && certificateFound && (
                <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-green-800 p-4 flex items-center justify-between">
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
                          isGeneratingPDF ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
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