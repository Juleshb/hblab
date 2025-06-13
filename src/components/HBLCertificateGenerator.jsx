import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import axios from "axios";
import HBLCertificateModal from "./HBLCertificateModal";

const HBLCertificateGenerator = () => {
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
      const response = await axios.post("http://localhost:3000/api/certificates", {
        recipientName: certificateData.recipientName,
        email: certificateData.email,
        courseName: certificateData.courseName,
        duration: certificateData.duration,
        dateRange: certificateData.dateRange,
        completionDate: certificateData.completionDate,
        skills: certificateData.skills
      });

      setCertificateData(prev => ({
        ...prev,
        certificateId: response.data.certificateId,
        createdAt: response.data.createdAt
      }));

      setErrorMessage("");
      setSuccessMessage("Certificate generated successfully!");
      setShowModal(true);

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="m-20 max-w-4xl mx-auto">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate("/certificates")}
              className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-600"
            >
              View All Certificates
            </button>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-green-900 mb-6">
              Generate New Certificate
            </h1>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mb-4 p-4 text-green-800 bg-green-100 border border-green-300 rounded">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 p-4 text-red-800 bg-red-100 border border-red-300 rounded">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleGenerate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Recipient Name */}
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="recipientName">
                    Recipient Name*
                  </label>
                  <input
                    type="text"
                    id="recipientName"
                    name="recipientName"
                    value={certificateData.recipientName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="email">
                    Recipient Email*
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={certificateData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Course Name */}
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="courseName">
                    Course Name*
                  </label>
                  <input
                    type="text"
                    id="courseName"
                    name="courseName"
                    value={certificateData.courseName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="duration">
                    Duration*
                  </label>
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    value={certificateData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="dateRange">
                    Date Range*
                  </label>
                  <input
                    type="text"
                    id="dateRange"
                    name="dateRange"
                    value={certificateData.dateRange}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Completion Date */}
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="completionDate">
                    Completion Date*
                  </label>
                  <input
                    type="date"
                    id="completionDate"
                    name="completionDate"
                    value={certificateData.completionDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Skills */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">
                    Skills Covered*
                  </label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={certificateData.currentSkill}
                      onChange={(e) =>
                        setCertificateData({
                          ...certificateData,
                          currentSkill: e.target.value,
                        })
                      }
                      className="flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Add a skill"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-green-800 text-white px-4 py-2 rounded-r-md hover:bg-green-600"
                    >
                      Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {certificateData.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-100 p-2 rounded"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Icon icon="carbon:trash-can" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit/Reset Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setCertificateData({
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
                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 bg-green-800 text-white rounded-md hover:bg-green-600 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    "Generate Certificate"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />

      <HBLCertificateModal
        show={showModal}
        onHide={() => setShowModal(false)}
        certificateData={certificateData}
      />
    </div>
  );
};

export default HBLCertificateGenerator;