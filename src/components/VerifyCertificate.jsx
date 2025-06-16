import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Icon } from '@iconify/react';

const VerifyCertificate = () => {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        const response = await axios.get(`/api/certificates/verify/${certificateId}`);
        setCertificate(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Certificate not found or invalid');
        setCertificate(null);
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon icon="eos-icons:loading" className="w-12 h-12 mx-auto text-green-800" />
          <p className="mt-4 text-lg">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            {error ? (
              <div className="text-center">
                <Icon icon="carbon:warning" className="w-16 h-16 mx-auto text-red-500" />
                <h2 className="mt-4 text-2xl font-bold text-red-600">Verification Failed</h2>
                <p className="mt-2 text-gray-600">{error}</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <Icon icon="carbon:checkmark-filled" className="w-16 h-16 mx-auto text-green-500" />
                  <h2 className="mt-4 text-2xl font-bold text-green-800">Certificate Verified</h2>
                  <p className="mt-2 text-gray-600">This certificate is valid and issued by HBLAB Academy</p>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900">Certificate Details</h3>
                  <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Recipient Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{certificate.recipientName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Course Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{certificate.courseName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Completion Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(certificate.completionDate).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Certificate ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">{certificate.certificateId}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Issued On</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(certificate.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;