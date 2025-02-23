import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import banner from "../assets/kk1.jpg";
import toast, { Toaster } from "react-hot-toast";


const GetStartedForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    career: "",
    language: "English",
    basicSkills: "",
    role: "",
    educationLevel: "",
    studyField: "",
    agreeTerms: false,
    agreePrivacy: false,
  });


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch("https://hblab-be.onrender.com/submit-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (data.success) {
      toast.success("Application submitted successfully! Check your email for confirmation. ");
      setFormData({ firstName: "",
    lastName: "",
    email: "",
    location: "",
    career: "",
    language: "English",
    basicSkills: "",
    role: "",
    educationLevel: "",
    studyField: "",
    agreeTerms: false,
    agreePrivacy: false, });
    } else {
      toast.error("Submission failed. Please try again. ");
    }
  } catch (error) {
    toast.error("Network error. Try again later. ");
  }
  finally {
    setLoading(false);
  }
};


  return (
    <div className="bg-gray-200">
      <Navbar />
            <Toaster position="top-center" reverseOrder={false} />
      
      <div className="relative w-full min-h-screen mt-8 flex items-center justify-center">
        <img src={banner} alt="background" className="absolute inset-0 w-full h-full object-cover contrast-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-green-900 bg-opacity-60"></div>

        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 max-w-6xl w-full flex flex-col md:flex-row items-center p-4">
          <div className="w-full md:w-1/2 text-white p-6 md:p-8">
            <motion.h2 whileHover={{ scale: 1.1 }} className="lg:text-3xl text-xl font-bold mb-4">Let’s Build the Future Together!</motion.h2>
            <p className="text-lg font-semibold">Join Our Team & Start Your Journey Today!</p>
        

          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} >

          <p className="text-base">You can join us from anywhere in the world and learn at your own pace! (only peaple in Rubavu/Rwanda use physical space)</p>

{/* Requirements Section */}
<h3 className="text-lg font-bold mt-6">What You Need to Get Started</h3>
<ul className="mt-2 space-y-2 text-base">
  <li> A PC/Laptop</li>
  <li>A Stable Internet Connection (Remotely peaple only)</li>
</ul>

{/* Fees Section */}
<h3 className="text-lg font-bold mt-6">Program Fees</h3>
<p className="text-base">Our programs are affordable, with fees ranging from 25,000 up 50,000 RWF per month, depending on the program you choose.</p>

{/* Certification & Internship Section */}
<h3 className="text-lg font-bold mt-6">What You Get After the Program</h3>
<ul className="mt-2 space-y-2 text-base">
  <li>A Certificate of Completion</li>
  <li>Real-World Internship Experience</li>
</ul>

{/* Work & Team Opportunity Section */}
<h3 className="text-lg font-bold mt-6">Work & Team Opportunities</h3>
<p className="text-base">
  After completing your internship, you’ll have a chance to work with our companies if there is an opportunity. You can also join our team and gain hands-on experience
</p>

{/* Final Call to Action */}
<h3 className="text-lg font-bold mt-6">Get Started Today!</h3>
<p className="mt-2 text-lg">
  Don't miss this opportunity to kickstart your career and be part of an amazing team! 🚀
</p>
          </motion.div>
          </div>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="w-full md:w-1/2 bg-white opacity-70 p-6 md:p-8 rounded-lg shadow-lg">
          <div className="flex justify-between mb-4">
            {["Account", "Experience", "Document"].map((label, index) => (
              <div key={index} className={`w-1/3 text-center ${step >= index + 1 ? "font-bold text-green-500" : "text-gray-400"}`}>
                {index + 1}. {label}
              </div>
            ))}
          </div>
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-semibold mb-4">Fill this form to Get Started</h2>
                  <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="w-full mb-2 rounded-lg border border-green-200 p-3 text-sm" required />
                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="w-full mb-2 rounded-lg border border-green-200 p-3 text-sm" required />
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full mb-2 rounded-lg border border-green-200 p-3 text-sm" required />
                <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full mb-2 rounded-lg border border-green-200 p-3 text-sm" required />
                {/* Career Selection */}
                <select name="career" value={formData.career} onChange={handleChange} className="w-full mb-2 rounded-lg border border-green-200 p-3 text-sm">
                    <option value="">Select Career</option>
                    <option value="Software Development">Software Development</option>
                    <option value="Networking">Networking</option>
                    <option value="Multimedia">Multimedia</option>
                  </select>

                  {/* Role Selection */}
                  <select name="role" value={formData.role} onChange={handleChange} className="w-full mb-2 rounded-lg border border-green-200 p-3 text-sm">
                    <option value="">Select Role</option>
                    <option value="Internship">Internship</option>
                    <option value="Training">Training</option>
                  </select>

                  {/* Education Level */}
                  <select name="educationLevel" value={formData.educationLevel} onChange={handleChange} className="w-full mb-2 rounded-lg border border-green-200 p-3 text-sm">
                    <option value="">Select Education Level</option>
                    <option value="RTB/TVT Level">RTB/TVT Level</option>
                    <option value="A2 Certificate">A2 Certificate</option>
                    <option value="A1">A1</option>
                    <option value="A0">A0</option>
                  </select>

                  {/* Study Field */}
                  <input type="text" name="studyField" placeholder="Study Field" value={formData.studyField} onChange={handleChange} className="w-full mb-2 rounded-lg border border-green-200 p-3 text-sm" required />
                  <div className="flex items-center mb-2">
                    <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} />
                    <span className="ml-2 text-sm">I agree to the <button onClick={() => navigate("/terms-of-use")}  className="text-green-600">Terms & Conditions</button></span>
                  </div>
                  <div className="flex items-center mb-4">
                  <input type="checkbox" name="agreePrivacy" checked={formData.agreePrivacy} onChange={handleChange} />
                  <span className="ml-2 text-sm">I understand the <button onClick={() => navigate("/privacy-policy")}  className="text-green-600">Privacy Policy</button></span>
                </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={nextStep} className="w-full bg-green-500 text-white p-2 rounded">Get Started</motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-semibold mb-4">Experience Details</h2>
                  <textarea name="experience" placeholder="Describe your experience..." onChange={handleChange} className="w-full rounded-lg border p-3 text-sm" />
                  <div className="flex justify-between mt-4">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={prevStep} className="bg-gray-300 p-2 rounded">Back</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={nextStep} className="bg-green-500 text-white p-2 rounded">Next</motion.button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-semibold mb-4">Upload documents if any</h2>
                   <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="flex"
                          >
                            <p className="break-words text-black p-4">
                            NB: TVET/RTB Students  documents will submited at office (hard copy) 
                            </p>
                          </motion.div>
                  <input type="file" className="w-full rounded-lg border p-3 text-sm mb-2" />
                  <div className="flex justify-between mt-4">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={prevStep} className="bg-gray-300 p-2 rounded">Back</motion.button>
                     <motion.button
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          transition={{ duration: 0.5 }}
                                          className=" py-3 px-5 bg-green-900 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center"
                                          type="submit"
                                          disabled={loading}
                                        >
                                          {loading ? (
                                            <span className="loader animate-spin border-t-2 border-white border-solid rounded-full h-5 w-5"></span>
                                          ) : (
                                            "Submit →"
                                          )}
                                        </motion.button>
                  </div>
                </motion.div>
              )}
            </form>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default GetStartedForm;
