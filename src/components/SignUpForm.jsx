import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../assets/context/AuthContext.jsx";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FormModal, ErrorModal, SuccessModal } from "./ClientModal";
import LoadingSpinner from "./LoadingSpinner";

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "APPLICANT"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("form");
  const [modalTitle, setModalTitle] = useState("Create Account");
  const [modalMessage, setModalMessage] = useState("");
  const { register } = useAuth();
  const [page, setPage] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await register(formData.email, formData.password, formData.name, formData.role);
      // Success will be handled by AuthContext navigation
    } catch (err) {
      let errorMessage = "Registration failed. Please try again.";
      
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = err.response.data.error || "Invalid registration data";
        } else if (err.response.status === 409) {
          errorMessage = "Email already exists. Please use a different email.";
        } else if (err.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      setError(errorMessage);
      setModalType("error");
      setModalTitle("Registration Failed");
      setModalMessage(errorMessage);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setError("");
  };

  const nextPage = () => setPage((p) => Math.min(p + 1, 3));
  const prevPage = () => setPage((p) => Math.max(p - 1, 1));

  // Show loading spinner if loading
  if (loading) {
    return <LoadingSpinner message="Creating your account..." />;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-2 py-4 mt-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mx-2"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-4 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-8 -mt-8"></div>
              <div className="absolute bottom-0 left-0 w-14 h-14 bg-white rounded-full -ml-7 -mb-7"></div>
            </div>
            <div className="relative text-center">
              <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-1">
                Join Our Platform
              </h2>
              <p className="text-green-100 text-xs">
                Create your account to get started
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {page === 1 && (
                <>
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 text-sm"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                        required
                        className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 text-sm"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                </>
              )}
              {page === 2 && (
                <>
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        required
                        className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 text-sm"
                        placeholder="••••••••"
                        minLength="6"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-xs font-semibold text-gray-700 mb-1">
                      Account Type
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 text-sm appearance-none bg-white"
                      >
                        <option value="APPLICANT">Job Applicant</option>
                        <option value="STUDENT">Student</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {page === 3 && (
                <>
                  <div className="flex items-start space-x-2">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      required
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="terms" className="block text-xs text-gray-700">
                      I agree to the{' '}
                      <Link to="/terms-of-use" className="text-green-600 hover:text-green-500 font-medium">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy-policy" className="text-green-600 hover:text-green-500 font-medium">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 font-semibold text-sm"
                  >
                    Create Account
                  </button>
                </>
              )}
              <div className="flex justify-between mt-4">
                {page > 1 && (
                  <button type="button" onClick={prevPage} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 font-medium text-xs">
                    Previous
                  </button>
                )}
                {page < 3 && (
                  <button type="button" onClick={nextPage} className="ml-auto px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 font-medium text-xs">
                    Next
                  </button>
                )}
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/LoginForm"
                  className="font-semibold text-green-600 hover:text-green-500 transition duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Error Modal */}
      {showModal && modalType === "error" && (
        <ErrorModal
          isOpen={showModal}
          onClose={handleModalClose}
          title={modalTitle}
          subtitle={modalMessage}
        >
          <div className="text-center py-4">
            <p className="text-gray-700 mb-6">
              Please check your information and try again.
            </p>
            <button
              onClick={handleModalClose}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </ErrorModal>
      )}

      <Footer />
    </>
  );
};

export default SignUpForm;
