import { useState } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';

const CertificateVerification = () => {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);

  const verifyCertificate = async (e) => {
    e.preventDefault();
    if (!certificateId) return;

    setLoading(true);
    setResult(null);
    setVerificationDetails(null);

    try {
      const response = await axios.get(
        `https://umuhuza.store/api/certificates/verify/${certificateId}`
      );
      
      setResult(response.data.isValid);
      setVerificationDetails({
        name: response.data.recipientName,
        issueDate: response.data.issueDate,
        verificationSticker: response.data.hasVerificationSticker
      });
    } catch (error) {
      console.error('Verification error:', error);
      setResult(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Icon icon="carbon:certificate" className="mr-2 text-blue-600" />
        Certificate Verification
      </h2>
      
      <form onSubmit={verifyCertificate} className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Enter Certificate ID</label>
          <div className="flex">
            <input
              type="text"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              className="flex-grow px-3 py-2 border rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. CERT-1234-ABCD"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      </form>

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
              
              {result && verificationDetails && (
                <div className="mt-2 text-sm space-y-1">
                  <p><strong>Name:</strong> {verificationDetails.name}</p>
                  <p><strong>Issue Date:</strong> {new Date(verificationDetails.issueDate).toLocaleDateString()}</p>
                  <p className="flex items-center">
                    <Icon 
                      icon={verificationDetails.verificationSticker ? "carbon:checkmark" : "carbon:close"} 
                      className={`mr-1 ${
                        verificationDetails.verificationSticker ? 'text-green-600' : 'text-red-600'
                      }`} 
                    />
                    Verification Sticker: {verificationDetails.verificationSticker ? 'Present' : 'Not Present'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateVerification;