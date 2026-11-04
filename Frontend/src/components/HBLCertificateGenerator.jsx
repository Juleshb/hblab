import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuth } from "../assets/context/AuthContext.jsx";
import axios from "axios";
import HBLCertificateModal from "./HBLCertificateModal";

const HBLCertificateGenerator = ({ onCreated }) => {
  const [certificateData, setCertificateData] = useState({
    recipientName: "",
    email: "",
    courseName: "Computer Skills and Software Development",
    duration: "3 months",
    dateRange: "Jan-March 2025",
    completionDate: new Date().toISOString().split('T')[0],
    skills: [
      "Computer Skills (Ms Word, Excel, Computer Maintenance)",
      "UX/UI",
      "HTML",
      "CSS",
      "Javascript",
      "React Js",
      "Database Management"
    ],
    currentSkill: ""
  });

  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCertificateData({
      ...certificateData,
      [name]: value,
    });
  };

  const handleAddSkill = () => {
    if (certificateData.currentSkill.trim()) {
      setCertificateData({
        ...certificateData,
        skills: [...certificateData.skills, certificateData.currentSkill],
        currentSkill: "",
      });
    }
  };

  const handleRemoveSkill = (index) => {
    const updatedSkills = [...certificateData.skills];
    updatedSkills.splice(index, 1);
    setCertificateData({
      ...certificateData,
      skills: updatedSkills,
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (
      !certificateData.recipientName ||
      !certificateData.email ||
      !certificateData.courseName ||
      certificateData.skills.length === 0
    ) {
      setSuccessMessage("");
      setErrorMessage("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post("http://localhost:3000/api/certificates", {
        recipientName: certificateData.recipientName,
        email: certificateData.email,
        courseName: certificateData.courseName,
        duration: certificateData.duration,
        dateRange: certificateData.dateRange,
        completionDate: certificateData.completionDate,
        skills: certificateData.skills,
        generatedBy: user?.id
      }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

      setCertificateData(prev => ({
        ...prev,
        certificateId: response.data.certificateId,
        createdAt: response.data.createdAt
      }));

      setErrorMessage("");
      setSuccessMessage("Certificate generated successfully!");
      setShowModal(true);
      if (onCreated) onCreated(response.data);

      // Auto-clear success message after 4 seconds
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(error.response?.data?.error || "Something went wrong while generating the certificate.");
      console.error("Certificate generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-green-900 mb-6">Generate New Certificate</h1>
        {successMessage && (
          <div className="mb-4 p-4 text-green-800 bg-green-100 border border-green-300 rounded">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="mb-4 p-4 text-red-800 bg-red-100 border border-red-300 rounded">{errorMessage}</div>
        )}
        <form onSubmit={handleGenerate}>
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Recipient Name */}
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="recipientName">Recipient Name*</label>
                <input type="text" id="recipientName" name="recipientName" value={certificateData.recipientName} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
              </div>
              {/* Email */}
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="email">Recipient Email*</label>
                <input type="email" id="email" name="email" value={certificateData.email} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
              </div>
              {/* Course Name */}
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="courseName">Course Name*</label>
                <input type="text" id="courseName" name="courseName" value={certificateData.courseName} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
              </div>
              {/* Duration */}
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="duration">Duration*</label>
                <input type="text" id="duration" name="duration" value={certificateData.duration} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Date Range */}
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="dateRange">Date Range*</label>
                <input type="text" id="dateRange" name="dateRange" value={certificateData.dateRange} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
              </div>
              {/* Completion Date */}
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="completionDate">Completion Date*</label>
                <input type="date" id="completionDate" name="completionDate" value={certificateData.completionDate} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Skills Covered*</label>
              <div className="flex gap-2 mb-4">
                <input type="text" value={certificateData.currentSkill} onChange={(e) => setCertificateData({ ...certificateData, currentSkill: e.target.value })} placeholder="Add a skill" className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                <button type="button" onClick={handleAddSkill} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {certificateData.skills.map((skill, index) => (
                  <span key={index} className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{skill}<button type="button" onClick={() => handleRemoveSkill(index)} className="text-green-600 hover:text-green-800">&times;</button></span>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between mt-6">
            {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Back</button>}
            {step < 3 && <button type="button" onClick={() => setStep(step + 1)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Next</button>}
            {step === 3 && <button type="submit" disabled={loading} className={`px-6 py-3 text-white rounded-lg font-semibold ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>{loading ? "Generating..." : "Generate Certificate"}</button>}
          </div>
        </form>
      </div>
      {showModal && (
        <HBLCertificateModal certificateData={certificateData} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default HBLCertificateGenerator;