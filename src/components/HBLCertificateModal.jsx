import React, { useRef, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useReactToPrint } from "react-to-print";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const HBLCertificateModal = ({ show, onHide, certificateData }) => {
  const certificateRef = useRef();
  const [qrValue, setQrValue] = useState("");
  const [certificateId, setCertificateId] = useState("");
  
  // Generate a unique certificate ID and QR code value
  useEffect(() => {
    if (certificateData && show) {
      const id = `HBL-${uuidv4()}`;
      setCertificateId(id);
      const verificationUrl = `${window.location.origin}/verify-certificate?id=${id}`;
      setQrValue(verificationUrl);
    }
  }, [certificateData, show]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
    pageStyle: `
      @page { 
        size: A4 landscape;
        margin: 0;
      }
      @media print { 
        body { -webkit-print-color-adjust: exact; } 
        .no-print { display: none !important; }
        .certificate-container { 
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
      }
    `,
    onAfterPrint: () => {
      console.log("Certificate printed. ID:", certificateId);
    }
  });

  // Download as PDF
  const handleDownloadPDF = async () => {
    const certificateElement = certificateRef.current;
    const canvas = await html2canvas(certificateElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('landscape');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`HBL-Certificate-${certificateData.recipientName.replace(/\s+/g, '-')}.pdf`);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-xl font-bold text-gray-800">Certificate Preview</h3>
          <button
            onClick={onHide}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <Icon icon="carbon:close" className="h-6 w-6" />
          </button>
        </div>

        {/* Certificate Content */}
        <div className="overflow-auto p-2 sm:p-4">
          <div 
            ref={certificateRef}
            className="certificate-container relative mx-auto w-full border-8 border-green-800 bg-gray-50 p-4 font-serif print:p-0 sm:p-6 md:p-8 lg:p-12"
            style={{ 
              maxWidth: "1000px",
              backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.9))",
              backgroundSize: "cover"
            }}
          >
            {/* Watermark */}
            <div className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 -rotate-45 transform whitespace-nowrap text-4xl font-bold text-green-800 opacity-10 sm:text-5xl md:text-6xl">
              HBLAB CERTIFIED
            </div>

            {/* Decorative Border */}
            <div className="absolute inset-2 z-10 border-2 border-green-800 pointer-events-none sm:inset-3 md:inset-4" />

            {/* Header with Logo Only (removed certificate ID) */}
            <div className="relative z-20 mb-6 flex justify-center sm:mb-8">
              <div className="flex flex-col items-center">
                <img
                  src="../assets/logo.png"
                  alt="HBLAB Logo"
                  className="h-16 object-contain sm:h-20"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://via.placeholder.com/150?text=HBLAB+Logo";
                  }}
                />
                <div className="mt-1 text-xs font-bold text-green-800">
                  HBLAB ACADEMY
                </div>
              </div>
            </div>

            {/* Main Certificate Content */}
            <h1 className="relative z-20 mb-3 text-center text-xl font-bold uppercase text-green-800 sm:mb-4 sm:text-2xl md:text-3xl lg:text-4xl">
              Certificate of Completion
            </h1>

            <p className="relative z-20 mb-4 text-center text-base text-gray-700 sm:mb-6 sm:text-lg">
              This is to certify that
            </p>

            <h2 className="relative z-20 my-4 text-center text-xl font-bold underline text-green-800 sm:my-5 sm:text-2xl md:text-3xl">
              {certificateData.recipientName}
            </h2>

            <p className="relative z-20 mb-4 text-center text-base text-gray-700 sm:mb-6 sm:text-lg">
              has successfully completed the course
            </p>

            <h3 className="relative z-20 my-4 text-center text-lg font-bold text-green-800 sm:my-5 sm:text-xl md:text-2xl">
              "{certificateData.courseName}"
            </h3>

            <div className="relative z-20 my-4 space-y-1 text-center text-sm text-gray-800 sm:my-5 sm:space-y-2 sm:text-base">
              <p>
                <span className="font-semibold">Duration:</span>{" "}
                {certificateData.duration}
              </p>
              <p>
                <span className="font-semibold">Completion Date:</span>{" "}
                {formatDate(certificateData.completionDate)}
              </p>
            </div>

            {certificateData.skills?.length > 0 && (
              <div className="relative z-20 my-6">
                <h4 className="mb-2 text-center text-lg font-bold text-green-800 sm:mb-3 sm:text-xl">
                  Skills Covered:
                </h4>
                <ul className="mx-auto grid grid-cols-1 gap-1 text-left text-sm sm:grid-cols-2 sm:text-base md:gap-2">
                  {certificateData.skills.map((skill, index) => (
                    <li
                      key={index}
                      className="relative pl-5 text-gray-800 before:absolute before:left-1 before:text-green-800 before:content-['•'] sm:pl-6"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer with Signatures and QR Code */}
            <div className="relative z-20 mt-12 flex flex-col items-center justify-between gap-8 sm:flex-row sm:gap-0">
              <div className="w-36 sm:w-48">
                <div className="mx-auto border-t-2 border-green-800 pt-2 text-center text-sm sm:text-base">
                  <div className="font-bold">Director</div>
                  <div className="text-xs text-gray-600">HBLAB Academy</div>
                </div>
              </div>
              
              {/* QR Code Section */}
              <div className="flex flex-col items-center">
                {qrValue && (
                  <div className="mb-1 rounded border-2 border-white bg-white p-1 shadow-md">
                    <QRCode 
                      value={qrValue} 
                      size={80}
                      level="H"
                      fgColor="#1a365d"
                    />
                  </div>
                )}
                <div className="text-xs text-gray-600">Scan to verify</div>
                <div className="text-xxs mt-1 text-center font-mono text-gray-500">
                  {certificateId}
                </div>
              </div>
              
              <div className="w-36 sm:w-48">
                <div className="mx-auto border-t-2 border-green-800 pt-2 text-center text-sm sm:text-base">
                  <div className="font-bold">Date</div>
                  <div className="text-xs text-gray-600">
                    {formatDate(certificateData.completionDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Responsive Buttons */}
        <div className="flex flex-wrap justify-end gap-3 border-t p-4 sm:gap-4">
          <button
            onClick={onHide}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:flex-none sm:px-4 sm:text-base"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex flex-1 items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 sm:flex-none sm:px-4 sm:text-base"
          >
            <Icon icon="carbon:download" className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center rounded-md bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 sm:flex-none sm:px-4 sm:text-base"
          >
            <Icon icon="carbon:printer" className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default HBLCertificateModal;