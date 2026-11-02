import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const CertificateVerification = () => {
  const { certificateId } = useParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [error, setError] = useState(null);

  const verifyCertificate = async () => {
    if (!certificateId) return;

    setLoading(true);
    setResult(null);
    setVerificationDetails(null);
    setError(null);

    try {
      const response = await axios.get(
        `https://umuhuza.store/api/certificates/verify/${certificateId}`
      );
      
      // Since the API returns the certificate data directly (not wrapped in isValid)
      setResult(true); // Certificate exists, so it's valid
      setVerificationDetails(response.data);
    } catch (error) {
      console.error('Verification error:', error);
      setResult(false);
      setError(error.response?.data?.message || 'Certificate not found');
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify when component mounts with certificateId
  useEffect(() => {
    if (certificateId) {
      verifyCertificate();
    }
  }, [certificateId]);

  return (
     <>
      <Navbar />
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Icon icon="carbon:certificate" className="mr-2 text-blue-600" />
        Certificate Verification
      </h2>

      {loading && (
        <div className="flex items-center justify-center p-4">
          <Icon icon="eos-icons:loading" className="text-2xl text-blue-600" />
          <span className="ml-2">Verifying certificate...</span>
        </div>
      )}

      {result !== null && (
        <div className={`p-4 rounded-lg border ${
          result ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            <Icon 
              icon={result ? "carbon:checkmark-filled" : "carbon:warning-filled"} 
              className={`text-2xl mr-2 mt-0.5 ${
                result ? 'text-green-600' : 'text-red-600'
              }`} 
            />
            <div>
              <h3 className="font-medium">
                {result ? 'Valid Certificate' : 'Invalid Certificate'}
              </h3>
              
              {error && !result && (
                <p className="mt-1 text-sm">{error}</p>
              )}

              {result && verificationDetails && (
                <div className="mt-2 text-sm space-y-1">
                  <p><strong>Certificate ID:</strong> {verificationDetails.certificateId}</p>
                  <p><strong>Recipient Name:</strong> {verificationDetails.recipientName}</p>
                  <p><strong>Course:</strong> {verificationDetails.courseName}</p>
                  <p><strong>Duration:</strong> {verificationDetails.duration}</p>
                  <p><strong>Completion Date:</strong> {new Date(verificationDetails.completionDate).toLocaleDateString()}</p>
                  
                  {verificationDetails.skills && verificationDetails.skills.length > 0 && (
                    <div>
                      <strong>Skills Acquired:</strong>
                      <ul className="list-disc list-inside">
                        {verificationDetails.skills.map((skill, index) => (
                          <li key={index}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!certificateId && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p>No certificate ID provided in the URL</p>
        </div>
      )}
    </div>
    <Footer />
        </>
  );
};

export default CertificateVerification;