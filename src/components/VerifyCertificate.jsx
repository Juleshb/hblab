import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Icon } from '@iconify/react';
import QRCode from 'qrcode.react';
import Navbar from './Navbar';
import Footer from './Footer';
import QrScanner from 'qr-scanner';

const VerifyCertificate = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [scanActive, setScanActive] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const qrScannerRef = useRef(null);

  // Verify certificate on mount
  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`https://www.hblab.rw/api/certificates/verify/${certificateId}`);
        
        const issueDate = new Date(response.data.createdAt);
        const expirationDate = new Date(issueDate);
        expirationDate.setFullYear(issueDate.getFullYear() + 1);
        const isExpired = new Date() > expirationDate;

        if (isExpired) {
          setVerificationStatus('expired');
          setError('This certificate has expired');
        } else {
          setVerificationStatus('valid');
          setCertificate(response.data);
        }
        
        setError(null);
      } catch (err) {
        setVerificationStatus('invalid');
        setError(err.response?.data?.error || 'Certificate not found or invalid');
        setCertificate(null);
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [certificateId]);

  // Handle QR scanning
  const startScanner = () => {
    setScanActive(true);
    setScannerError(null);
    
    qrScannerRef.current = new QrScanner(
      videoRef.current,
      result => {
        setScannedData(result);
        stopScanner();
        navigate(`/verify-certificate/${result}`);
      },
      {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    qrScannerRef.current.start().catch(err => {
      setScannerError(err.message);
      setScanActive(false);
    });
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current = null;
    }
    setScanActive(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Icon 
              icon="eos-icons:loading" 
              className="w-12 h-12 mx-auto text-green-800 animate-spin" 
            />
            <p className="mt-4 text-lg text-gray-700">Verifying certificate...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'valid': return { icon: 'carbon:checkmark-filled', color: 'text-green-500' };
      case 'invalid': return { icon: 'carbon:warning', color: 'text-red-500' };
      case 'expired': return { icon: 'carbon:time', color: 'text-yellow-500' };
      default: return { icon: 'carbon:warning', color: 'text-red-500' };
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'valid': return 'Certificate Verified';
      case 'invalid': return 'Verification Failed';
      case 'expired': return 'Certificate Expired';
      default: return 'Verification Failed';
    }
  };

  const getStatusDescription = () => {
    switch (verificationStatus) {
      case 'valid': return 'This certificate is valid and issued by HBLAB Academy';
      case 'invalid': return error || 'The certificate could not be verified';
      case 'expired': return 'This certificate is no longer valid as it has expired';
      default: return 'There was an issue verifying this certificate';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* QR Scanner Modal */}
          {scanActive && (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full">
                <div className="p-4 relative">
                  <video 
                    ref={videoRef} 
                    className="w-full h-auto rounded-md border-2 border-green-500"
                    playsInline
                  />
                  {scannerError && (
                    <div className="mt-2 text-red-500 text-center">{scannerError}</div>
                  )}
                </div>
                <div className="bg-gray-50 px-4 py-3 flex justify-end">
                  <button
                    onClick={stopScanner}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Cancel Scan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Certificate Verification Card */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <Icon 
                  icon={getStatusIcon().icon} 
                  className={`w-16 h-16 mx-auto ${getStatusIcon().color}`} 
                />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  {getStatusMessage()}
                </h2>
                <p className="mt-2 text-gray-600">
                  {getStatusDescription()}
                </p>
              </div>

              {certificate && (
                <>
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900">Certificate Details</h3>
                    <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      {/* ... existing certificate details ... */}
                    </dl>
                  </div>

                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">QR Verification</h3>
                    <div className="flex flex-col items-center">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <QRCode 
                          value={`${window.location.origin}/verify-certificate/${certificate.certificateId}`}
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <p className="mt-3 text-sm text-gray-500 text-center">
                        Scan this QR code to verify this certificate
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scan QR Code Section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Verify Another Certificate</h3>
              <div className="flex flex-col items-center">
                <button
                  onClick={startScanner}
                  className="px-6 py-3 bg-green-800 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <Icon icon="carbon:qr-code" className="w-5 h-5 mr-2" />
                  Scan QR Code
                </button>
                <p className="mt-3 text-sm text-gray-500 text-center">
                  Point your camera at a certificate's QR code to verify it
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyCertificate;