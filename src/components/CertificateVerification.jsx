import React, { useState } from 'react';

const CertificateVerification = () => {
  const [certificateId, setCertificateId] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`http://localhost:3000/api/certificates/${certificateId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Certificate not found');
      }

      const data = await response.json();
      setCertificate(data.data);
    } catch (err) {
      setError(err.message);
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-8">
        Verify HB-LAB Certificate
      </h2>
      
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Certificate ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter certificate ID (e.g., HBL-ABCD1234)"
            />
            <button
              onClick={handleVerify}
              disabled={loading || !certificateId}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                loading || !certificateId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}
        
        {certificate && (
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-800 mb-4">
              Certificate Details
            </h3>
            <div className="space-y-3">
              <p><span className="font-medium">Recipient:</span> {certificate.recipientName}</p>
              <p><span className="font-medium">Course:</span> {certificate.courseName}</p>
              <p><span className="font-medium">Duration:</span> {certificate.duration}</p>
              <p><span className="font-medium">Date Range:</span> {certificate.dateRange}</p>
              <p><span className="font-medium">Completion Date:</span> {new Date(certificate.completionDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Certificate ID:</span> {certificate.certificateId}</p>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Skills Covered:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {certificate.skills.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateVerification;