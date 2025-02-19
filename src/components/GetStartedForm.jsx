import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import banner from "../assets/kk.jpg";

const GetStartedForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    navigate("/success");
  };

  return (
    <div className="bg-gray-200">
      
    <section>
      <Navbar/>
    </section>
    <div className="relative w-full min-h-screen mt-8 flex items-center justify-center">
      {/* Background Image */}
      <img src={banner} alt="background" className="absolute inset-0 w-full h-full object-cover contrast-70" />
      
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-900  bg-opacity-60"></div>

      {/* Content Wrapper */}
      <div className="relative z-10 max-w-6xl w-full flex flex-col md:flex-row items-center p-4">
        {/* Text Section */}
        <div className="w-full md:w-1/2 text-white p-6 md:p-8">
  <h2 className="lg:text-3xl text-xl font-bold mb-4">Let’s Build the Future Together! </h2>
  <p className="text-lg font-semibold">Join Our Team & Start Your Journey Today!</p>
  
  {/* Work & Learning Mode Section */}
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
</div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 bg-white opacity-70 p-6 md:p-8 rounded-lg shadow-lg">
          {/* Step Indicator */}
          <div className="flex justify-between mb-4">
            {["Account", "Experience", "Resume"].map((label, index) => (
              <div key={index} className={`w-1/3 text-center ${step >= index + 1 ? "font-bold text-green-500" : "text-gray-400"}`}>
                {index + 1}. {label}
              </div>
            ))}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Fill this form  to Get Started</h2>
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
                  <span className="ml-2 text-sm">I agree to the <a href="#" onClick={() => navigate("/terms-of-use")} className="text-green-600">Terms & Conditions</a></span>
                </div>
                <div className="flex items-center mb-4">
                  <input type="checkbox" name="agreePrivacy" checked={formData.agreePrivacy} onChange={handleChange} />
                  <span className="ml-2 text-sm">I understand the <a href="#"  className="text-green-600">Privacy Policy</a></span>
                </div>
                <button type="button" onClick={nextStep} className="w-full bg-green-500 text-white p-2 rounded">Get started</button>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Experience Details</h2>
                <textarea name="experience" placeholder="Describe your experience..." onChange={handleChange} className="w-full rounded-lg border border-green-200 p-3 text-sm" />
                <button type="button" onClick={prevStep} className="mr-2 bg-gray-300 p-2 rounded">Back</button>
                <button type="button" onClick={nextStep} className="bg-green-500 text-white p-2 rounded">Next</button>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Upload Resume</h2>
                <input type="file" className="w-full rounded-lg border border-green-200 p-3 text-sm mb-2" />
                <button type="button" onClick={prevStep} className="mr-2 bg-gray-300 p-2 rounded">Back</button>
                <button type="submit" className="bg-green-500 text-white p-2 rounded">Submit</button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
    <section className="grid mx-auto place-items-center w-full">
        <Footer />
      </section>
    </div>
  );
};

export default GetStartedForm;
