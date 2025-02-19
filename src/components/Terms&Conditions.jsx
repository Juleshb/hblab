import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { QRCodeCanvas } from "qrcode.react";
import logo from "../assets/logo-icon.png"; // Import your logo
import Navbar from "./Navbar";
import Footer from "./Footer";

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const printRef = useRef(); // Reference for printing
  
  const latestTermsURL = "https://hblab.rw/terms-of-use"; // Change this to your actual URL

  // Function to trigger print
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Terms & Conditions - HBLab",
  });

  return (
    <div className="bg-gray-200">
      
    <section>
      <Navbar/>
    </section>
    <div className="mt-8 min-h-screen flex flex-col items-center justify-center p-6">
      {/* Printable Area */}
      <div ref={printRef} className="max-w-4xl bg-white p-8 rounded-lg shadow-lg  relative">
        
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-900 mb-2">Terms & Conditions</h1>
          <p className="text-gray-500 text-sm">Last Updated: February 18, 2025</p>
        </div>

        {/* Content Section */}
        <div className="mt-6 space-y-6 text-gray-700">
          <p>
            Welcome to <span className="font-semibold text-green-700">HBLab</span>! By using our website, services, or products, you agree to comply with and be bound by these Terms & Conditions.
            Please read them carefully before proceeding.
          </p>

          {/* Terms Sections */}
          {[
            { title: "1. Acceptance of Terms", content: "By using HBLab, you agree to these Terms & Conditions, our Privacy Policy, and any additional guidelines or rules that may apply to specific services." },
            { title: "2. Eligibility", content: "You must be at least 18 years old or have legal parental/guardian consent to use our services." },
            { title: "3. User Responsibilities", content: "You agree not to misuse our services or violate any applicable laws." },
            { title: "4. Intellectual Property Rights", content: "All content on HBLab, including logos, text, graphics, and software, is owned by or licensed to us." },
            { title: "5. Privacy Policy", content: "Your use of HBLab is also governed by our Privacy Policy, which outlines how we collect, use, and protect your personal information." },
            { title: "6. Limitation of Liability", content: "HBLab shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of our services." },
            { title: "7. Third-Party Links", content: "Our website may contain links to third-party websites. We are not responsible for their content, privacy policies, or practices." },
            { title: "8. Modifications to Terms", content: "We reserve the right to update or modify these Terms & Conditions at any time." },
            { title: "9. Termination", content: "We may suspend or terminate your access to HBLab at our discretion if you violate these Terms." },
            { title: "10. Governing Law", content: "These Terms & Conditions are governed by and construed in accordance with the laws of Rwanda." },
            { title: "11. Contact Information", content: "For inquiries, contact us at hblabltd@gmail.com." },
          ].map((section, index) => (
            <div key={index}>
              <h2 className="text-lg font-semibold text-green-700">{section.title}</h2>
              <p className="text-gray-700">{section.content}</p>
            </div>
          ))}

          {/* QR Code Section */}
          <div className="flex flex-col items-center mt-8">
            <p className="text-sm text-gray-600">Scan this QR code to verify the latest Terms & Conditions:</p>
            
            <div className="relative mt-3">
              {/* QR Code */}
              <QRCodeCanvas
                value={latestTermsURL}
                size={160} // Adjust size as needed
                className="border-2 p-1"
                includeMargin={true} // Ensures proper spacing
                bgColor="#ffffff"
                fgColor="#000000"
              />
              {/* Overlay Logo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-10 h-10 rounded-full bg-white p-1"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Or visit: <a href={latestTermsURL} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">{latestTermsURL}</a>
            </p>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="mt-6 flex justify-between">
          <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition duration-300">
            Print / Save as PDF
          </button>
          <button onClick={() => navigate(-1)} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition duration-300">
            Back
          </button>
        </div>
      </div>
    </div>
    <section className="grid mx-auto place-items-center w-full">
        <Footer />
      </section>
    </div>
  );
};

export default TermsAndConditions;
