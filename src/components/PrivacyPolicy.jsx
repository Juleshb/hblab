import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { QRCodeCanvas } from "qrcode.react";
import { motion } from "framer-motion";
import logo from "../assets/logo-icon.png"; // Import your logo
import Navbar from "./Navbar";
import Footer from "./Footer";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const printRef = useRef(); // Reference for printing

  const latestPrivacyURL = "https://hblab.rw/privacy-policy"; // Change this to your actual URL

  // Function to trigger print
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Privacy Policy - HBLab",
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="bg-gray-200">
    <section>
      <Navbar/>
    </section>
    <div className="mt-14 min-h-screen flex flex-col items-center justify-center p-6">
      {/* Printable Area */}
      <motion.div ref={printRef} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="max-w-4xl bg-white p-8 border-2 border-solid  border-green-900 shadow-lg relative">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="font-black lg:text-3xl text-xl text-green-900 mb-2">HB-lab Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last Updated: February 18, 2025</p>
        </div>

        {/* Content Section */}
        <div className="mt-6 space-y-6 text-gray-700">
          <p>
            At <span className="font-semibold text-green-900">HBLab</span>, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal data.
          </p>

          {/* Privacy Policy Sections */}
          {[
            { title: "1. Information We Collect", content: "We collect personal information such as name, email, contact details, and usage data when you use our services." },
            { title: "2. How We Use Your Information", content: "Your data helps us improve our services, provide customer support, and send important updates." },
            { title: "3. Data Sharing & Security", content: "We do not sell your data. We use security measures to protect your personal information from unauthorized access." },
            { title: "4. Cookies & Tracking", content: "Our website uses cookies to enhance user experience. You can disable cookies in your browser settings." },
            { title: "5. User Rights", content: "You have the right to request access to, update, or delete your personal data stored with us." },
            { title: "6. Third-Party Services", content: "We may integrate with third-party services. Their privacy policies apply to their data collection and processing." },
            { title: "7. Changes to Privacy Policy", content: "We may update this policy. Continued use of our services means you accept the changes." },
            { title: "8. Contact Information", content: "If you have any privacy-related questions, contact us at hblabltd@gmail.com." },
          ].map((section, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                           <h2 className="text-lg font-semibold text-green-900">{section.title}</h2>
                           <p className="text-gray-700">{section.content}</p>
                         </motion.div>
                       ))}

          {/* QR Code Section */}
          <div className="flex flex-col items-center mt-8">
            <p className="text-sm text-gray-600">Scan this QR code to verify the latest Privacy Policy:</p>
            
            <div className="relative mt-3">
              {/* QR Code */}
              <QRCodeCanvas
                value={latestPrivacyURL}
                size={150} // Adjust size as needed
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
              Or visit: <a href={latestPrivacyURL} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">{latestPrivacyURL}</a>
            </p>
          </div>
        </div>

          {/* Buttons Section */}
          <div className="mt-6 flex justify-between">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handlePrint} className="bg-green-900 hover:bg-green-800 text-white px-6 py-2 rounded-lg transition duration-300">
              Print
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="bg-gray-500 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition duration-300">
              Back
            </motion.button>
          </div>
        </motion.div>
      </div>
      <section className="grid mx-auto place-items-center w-full">
        <Footer />
      </section>
    </motion.div>
  );
};

export default PrivacyPolicy;
