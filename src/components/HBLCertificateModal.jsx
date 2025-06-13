import React, { useRef } from "react";
import { Icon } from "@iconify/react";
import { useReactToPrint } from "react-to-print";

const HBLCertificateModal = ({ show, onHide, certificateData }) => {
  const certificateRef = useRef();
  
  // Generate a unique serial number
  const serialNumber = `HBL-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    Math.random() * 10000
  ).toString().padStart(4, "0")}`;

  // Format the completion date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      @media print { 
        body { -webkit-print-color-adjust: exact; } 
      }
    `,
  });

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

        {/* Modal Body - Certificate */}
        <div className="overflow-auto p-2 sm:p-4">
          <div 
            ref={certificateRef}
            className="relative mx-auto w-full border-8 border-green-800 bg-gray-50 p-4 font-serif print:p-0 sm:p-6 md:p-8 lg:p-12"
            style={{ maxWidth: "1000px" }}
          >
            {/* Watermark */}
            <div className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 -rotate-45 transform whitespace-nowrap text-4xl font-bold text-green-800 opacity-10 sm:text-5xl md:text-6xl">
              HBLAB CERTIFIED
            </div>

            {/* Decorative Border */}
            <div className="absolute inset-2 z-10 border-2 border-green-800 pointer-events-none sm:inset-3 md:inset-4" />

            {/* Header with Serial and Logo */}
            <div className="relative z-20 mb-6 flex flex-col items-center justify-between gap-4 sm:mb-8 sm:flex-row sm:gap-0">
              {/* Serial Number */}
              <div className="order-2 w-full text-center sm:order-1 sm:w-auto sm:text-left">
                <div className="text-xs text-gray-600">Serial Number:</div>
                <div className="text-sm font-bold text-green-800 sm:text-base">
                  {serialNumber}
                </div>
              </div>

              {/* Logo */}
              <div className="order-1 flex-shrink-0 sm:order-2">
                <img
                  src="/hblab-logo.png"
                  alt="HBLAB Logo"
                  className="h-16 object-contain sm:h-20"
                />
              </div>
            </div>

            {/* Certificate Title */}
            <h1 className="relative z-20 mb-3 text-center text-xl font-bold uppercase text-green-800 sm:mb-4 sm:text-2xl md:text-3xl lg:text-4xl">
              Certificate of Completion
            </h1>

            <p className="relative z-20 mb-4 text-center text-base text-gray-700 sm:mb-6 sm:text-lg">
              This is to certify that
            </p>

            {/* Recipient Name */}
            <h2 className="relative z-20 my-4 text-center text-xl font-bold underline text-green-800 sm:my-5 sm:text-2xl md:text-3xl">
              {certificateData.recipientName}
            </h2>

            <p className="relative z-20 mb-4 text-center text-base text-gray-700 sm:mb-6 sm:text-lg">
              has successfully completed the course
            </p>

            {/* Course Name */}
            <h3 className="relative z-20 my-4 text-center text-lg font-bold text-green-800 sm:my-5 sm:text-xl md:text-2xl">
              {certificateData.courseName}
            </h3>

            {/* Course Details */}
            <div className="relative z-20 my-4 space-y-1 text-center text-sm text-gray-800 sm:my-5 sm:space-y-2 sm:text-base">
              <p>
                <span className="font-semibold">Duration:</span>{" "}
                {certificateData.duration}
              </p>
              <p>
                <span className="font-semibold">Date Range:</span>{" "}
                {certificateData.dateRange}
              </p>
              <p>
                <span className="font-semibold">Completion Date:</span>{" "}
                {formatDate(certificateData.completionDate)}
              </p>
            </div>

            {/* Skills Section */}
            <div className="relative z-20 my-6">
              <h4 className="mb-2 text-center text-lg font-bold text-green-800 sm:mb-3 sm:text-xl">
                Skills Covered:
              </h4>
              <ul className="mx-auto inline-block text-left text-sm sm:text-base">
                {certificateData.skills.map((skill, index) => (
                  <li
                    key={index}
                    className="relative mb-1 pl-5 text-gray-800 before:absolute before:left-1 before:text-green-800 before:content-['•'] sm:mb-2 sm:pl-6"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>

            {/* Signatures */}
            <div className="relative z-20 mt-8 flex flex-wrap justify-center gap-6 sm:justify-between sm:gap-0">
              <div className="w-36 sm:w-48">
                <div className="mx-auto border-t-2 border-green-800 pt-2 text-center text-sm sm:text-base">
                  Director
                </div>
              </div>
              <div className="w-36 sm:w-48">
                <div className="mx-auto border-t-2 border-green-800 pt-2 text-center text-sm sm:text-base">
                  Date
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t p-4 sm:gap-4">
          <button
            onClick={onHide}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:flex-none sm:px-4 sm:text-base"
          >
            Close
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