import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';

const AdminDashboard = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0
  });

  // Fetch all certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await axios.get('https://umuhuza.store/api/certificates');
        setCertificates(response.data);
        calculateStats(response.data);
      } catch (error) {
        console.error('Error fetching certificates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      verified: data.filter(c => c.verified).length,
      pending: data.filter(c => !c.verified).length
    });
  };

  // Verify certificate by ID
  const verifyCertificate = async (id) => {
    try {
      await axios.patch(`https://umuhuza.store/api/certificates/verify/${id}`);
      const updated = certificates.map(cert => 
        cert.id === id ? {...cert, verified: true} : cert
      );
      setCertificates(updated);
      calculateStats(updated);
    } catch (error) {
      console.error('Verification error:', error);
    }
  };

  // Check verification status
  const checkVerification = async (e) => {
    e.preventDefault();
    if (!verificationId) return;

    try {
      const response = await axios.get(
        `https://umuhuza.store/api/certificates/verify-status/${verificationId}`
      );
      setVerificationResult(response.data);
    } catch (error) {
      console.error('Verification check error:', error);
      setVerificationResult({ valid: false });
    }
  };

  // Filter certificates based on search
  const filteredCertificates = certificates.filter(cert =>
    cert.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Certificate Admin Dashboard
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <Icon icon="carbon:certificate" className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Certificates
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.total}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <Icon icon="carbon:checkmark" className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Verified
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.verified}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <Icon icon="carbon:warning" className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Verification
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.pending}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-yellow-600">
                      {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Check */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Verify Certificate Status
          </h2>
          <form onSubmit={checkVerification} className="flex">
            <input
              type="text"
              value={verificationId}
              onChange={(e) => setVerificationId(e.target.value)}
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Certificate ID"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
            >
              Check Status
            </button>
          </form>

          {verificationResult && (
            <div className={`mt-4 p-4 rounded-md ${
              verificationResult.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-center">
                <Icon 
                  icon={verificationResult.valid ? "carbon:checkmark-filled" : "carbon:warning-filled"} 
                  className="h-5 w-5 mr-2" 
                />
                <span>
                  {verificationResult.valid ? 
                    `Valid certificate issued to ${verificationResult.recipientName}` : 
                    'Invalid or expired certificate'}
                </span>
              </div>
              {verificationResult.valid && (
                <div className="mt-2 text-sm">
                  <p>Issued on: {new Date(verificationResult.issueDate).toLocaleDateString()}</p>
                  <p className="flex items-center">
                    <Icon 
                      icon={verificationResult.hasSticker ? "carbon:checkmark" : "carbon:close"} 
                      className="h-4 w-4 mr-1" 
                    />
                    Verification sticker: {verificationResult.hasSticker ? 'Present' : 'Not present'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Certificates Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Certificate Records
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search certificates..."
                  className="pl-10 pr-4 py-2 border rounded-md text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Icon 
                  icon="carbon:search" 
                  className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" 
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Icon icon="eos-icons:loading" className="mx-auto h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-2 text-gray-600">Loading certificates...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sticker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCertificates.length > 0 ? (
                    filteredCertificates.map((certificate) => (
                      <tr key={certificate.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {certificate.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {certificate.recipientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {certificate.recipientEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(certificate.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            certificate.verified ? 
                            'bg-green-100 text-green-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {certificate.verified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Icon 
                            icon={certificate.hasSticker ? "carbon:checkmark" : "carbon:close"} 
                            className={`h-5 w-5 ${
                              certificate.hasSticker ? 'text-green-600' : 'text-red-600'
                            }`} 
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!certificate.verified && (
                            <button
                              onClick={() => verifyCertificate(certificate.id)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Verify
                            </button>
                          )}
                          <button className="text-gray-600 hover:text-gray-900">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No certificates found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;