import React, { useState } from "react";
import { motion } from "framer-motion";
import { FormModal, SuccessModal, ErrorModal } from "./ClientModal";
import LoadingSpinner from "./LoadingSpinner";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("https://hblab-be.onrender.com/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setModalType("success");
        setModalTitle("Message Sent Successfully!");
        setModalMessage("Thank you for contacting us. We'll get back to you soon.");
        setShowModal(true);
        setFormData({ name: "", email: "", phone: "", message: "" }); // Clear form
      } else {
        setModalType("error");
        setModalTitle("Failed to Send Message");
        setModalMessage(data.message || "Something went wrong. Please try again.");
        setShowModal(true);
      }
    } catch (error) {
      setModalType("error");
      setModalTitle("Network Error");
      setModalMessage("Please check your connection and try again.");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  // Show loading spinner if loading
  if (loading) {
    return <LoadingSpinner message="Sending your message..." />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }}
      className="flex items-center justify-center mx-auto w-full text-[#16562e]"
    >
      <div className="flex flex-col items-center gap-5 max-w-screen-xl mx-auto px-5">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.6 }}
          className="lg:text-3xl text-2xl md:font-bold font-black mb-8 lg:w-full text-center"
        >
          Contact Us
        </motion.h1>

        <section className="w-full">
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl"
          >
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Contact Information */}
              <motion.div 
                initial={{ x: -50, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ duration: 0.6 }}
                className="rounded-lg p-8 text-white lg:p-12 shadow-2xl"
                style={{ background: "linear-gradient(135deg, #16562e 0%, #0f3c1f 100%)" }}
              >
                <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Address</h3>
                      <p className="text-green-100">Kigali, Rwanda</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Phone</h3>
                      <p className="text-green-100">+250 788 123 456</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Email</h3>
                      <p className="text-green-100">info@hblab.rw</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/20">
                  <h3 className="font-semibold text-lg mb-4">Business Hours</h3>
                  <div className="space-y-2 text-green-100">
                    <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                    <p>Saturday: 9:00 AM - 4:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div 
                initial={{ x: 50, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ duration: 0.6 }}
                className="rounded-2xl bg-white p-8 shadow-2xl border border-gray-100 lg:p-12"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h2>
                  <p className="text-gray-600">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input 
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#16562e]/30 focus:border-[#16562e] transition-all duration-200" 
                        placeholder="Your full name" 
                        type="text" 
                        id="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <input 
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#16562e]/30 focus:border-[#16562e] transition-all duration-200" 
                          placeholder="your@email.com" 
                          type="email" 
                          id="email" 
                          value={formData.email} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input 
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#16562e]/30 focus:border-[#16562e] transition-all duration-200" 
                          placeholder="+250 788 123 456" 
                          type="tel" 
                          id="phone" 
                          value={formData.phone} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Message
                    </label>
                    <div className="relative">
                      <div className="absolute top-4 left-4 flex items-start pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <textarea 
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#16562e]/30 focus:border-[#16562e] transition-all duration-200 resize-none" 
                        placeholder="Tell us how we can help you..." 
                        rows="5" 
                        id="message" 
                        value={formData.message} 
                        onChange={handleChange} 
                        required
                      ></textarea>
                    </div>
                  </div>

                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="w-full py-4 px-6 bg-[#16562e] hover:bg-[#10401f] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                      type="submit"
                  >
                    Send Message →
                    </motion.button>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Success Modal */}
      {showModal && modalType === "success" && (
        <SuccessModal
          isOpen={showModal}
          onClose={handleModalClose}
          title={modalTitle}
          subtitle={modalMessage}
        >
          <div className="text-center py-4">
            <p className="text-gray-700 mb-6">
              We've received your message and will get back to you within 24 hours.
            </p>
            <button
              onClick={handleModalClose}
              className="px-6 py-2 bg-[#16562e] hover:bg-[#10401f] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Thank You
            </button>
          </div>
        </SuccessModal>
      )}

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
              Please try again or contact us directly if the problem persists.
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
    </motion.div>
  );
};

export default ContactUs;
