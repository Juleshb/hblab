import React, { useRef, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useReactToPrint } from "react-to-print";
import { v4 as uuidv4 } from 'uuid';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CertificateArtwork from './certificate/CertificateArtwork';

const HBLCertificateModal = ({ show, onHide, onClose, certificateData }) => {
  onHide = onHide || onClose;
  const certificateRef = useRef();
  const [qrValue, setQrValue] = useState("");
  const [certificateId, setCertificateId] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Generate a unique certificate ID and QR code value
  useEffect(() => {
    if (certificateData && show) {
      const id = certificateData.certificateId || `HBL-${uuidv4()}`;
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

  // Download as PDF - Fixed version
  const handleDownloadPDF = async () => {
    if (!certificateRef.current || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const certificateElement = certificateRef.current;
      
      // Set a fixed width for consistent PDF generation
      const originalWidth = certificateElement.style.width;
      certificateElement.style.width = '1000px';
      
      const canvas = await html2canvas(certificateElement, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: null,
        scrollX: 0,
        scrollY: 0,
        windowWidth: certificateElement.scrollWidth,
        windowHeight: certificateElement.scrollHeight
      });
      
      // Restore original width
      certificateElement.style.width = originalWidth;
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate aspect ratio to fit the PDF
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95;
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`HBL-Certificate-${certificateData.recipientName.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!show && !certificateData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl rounded-2xl bg-white shadow-2xl mx-2 border border-gray-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-xl font-bold text-gray-800">Certificate Preview</h3>
          <button
            onClick={onHide}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            aria-label="Close"
          >
            <Icon icon="carbon:close" className="h-6 w-6" />
          </button>
        </div>

        {/* Certificate Content */}
        <div className="overflow-auto p-2 sm:p-4">
          <div ref={certificateRef} className="certificate-container mx-auto w-fit">
            <CertificateArtwork
              certificate={{
                ...certificateData,
                certificateId: certificateData?.certificateId || certificateId,
              }}
            />
          </div>
        </div>

        {/* Modal Footer with Responsive Buttons */}
        <div className="flex flex-wrap justify-end gap-3 border-t p-4 sm:gap-4">
          <button
            onClick={closeModal}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:flex-none sm:px-4 sm:text-base"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm text-white sm:flex-none sm:px-4 sm:text-base ${
              isGeneratingPDF ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Icon icon={isGeneratingPDF ? "eos-icons:loading" : "carbon:download"} className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
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