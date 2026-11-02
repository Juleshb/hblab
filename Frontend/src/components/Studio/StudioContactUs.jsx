import React, { useState } from "react";
import { motion } from "framer-motion";
import { FormModal, SuccessModal, ErrorModal } from "../ClientModal";
import LoadingSpinner from "../LoadingSpinner";

const StudioContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("https://hblab-be.onrender.com/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "studio-contact",
          subject: `HB Studio Contact: ${formData.service || "General Inquiry"}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setModalType("success");
        setModalTitle("Message Sent Successfully!");
        setModalMessage("Thank you for contacting HB Studio. We'll get back to you within 24 hours.");
        setShowModal(true);
        setFormData({ name: "", email: "", phone: "", service: "", message: "" });
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

  if (loading) {
    return <LoadingSpinner message="Sending your message..." />;
  }

  return (
    <section id="studio-contact" className="relative bg-gradient-to-b from-white to-gray-50 px-6 py-20 text-green-900 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-xs uppercase tracking-[0.45em] text-green-700">Get in Touch</p>
          <h2 className="mt-4 text-4xl font-black sm:text-5xl">Contact HB Studio</h2>
          <p className="mt-4 text-lg text-green-800/80">
            Have a project in mind? Let's discuss how we can bring your vision to life.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-8 text-white shadow-2xl"
            style={{ background: "linear-gradient(135deg, #16562e 0%, #0f3c1f 100%)" }}
          >
            <h3 className="mb-6 text-2xl font-bold">Studio Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Location</h4>
                  <p className="text-green-100">Rubavu, Rwanda</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Phone</h4>
                  <p className="text-green-100">+250 792 445 913</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Email</h4>
                  <p className="text-green-100">info@hblab.rw</p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/20 pt-8">
              <h4 className="mb-4 text-lg font-semibold">Business Hours</h4>
              <div className="space-y-2 text-green-100">
                <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p>Saturday: 9:00 AM - 4:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-green-900/10 bg-white p-8 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#16562e] focus:outline-none focus:ring-4 focus:ring-[#16562e]/30 transition-all"
                  placeholder="Your full name"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#16562e] focus:outline-none focus:ring-4 focus:ring-[#16562e]/30 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#16562e] focus:outline-none focus:ring-4 focus:ring-[#16562e]/30 transition-all"
                    placeholder="+250 788 123 456"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="service" className="mb-2 block text-sm font-semibold text-gray-700">
                  Service Interest
                </label>
                <select
                  id="service"
                  required
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#16562e] focus:outline-none focus:ring-4 focus:ring-[#16562e]/30 transition-all"
                >
                  <option value="">Select a service</option>
                  <option value="videography">Videography</option>
                  <option value="photography">Photography</option>
                  <option value="podcast">Podcast Production</option>
                  <option value="livestream">Live Streaming</option>
                  <option value="wedding">Wedding Package</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-semibold text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#16562e] focus:outline-none focus:ring-4 focus:ring-[#16562e]/30 transition-all resize-none"
                  placeholder="Tell us about your project..."
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full rounded-xl bg-[#16562e] px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition hover:bg-[#10401f]"
              >
                Send Message →
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>

      {showModal && modalType === "success" && (
        <SuccessModal isOpen={showModal} onClose={handleModalClose} title={modalTitle} subtitle={modalMessage}>
          <div className="py-4 text-center">
            <button
              onClick={handleModalClose}
              className="rounded-xl bg-[#16562e] px-6 py-2 font-medium text-white transition hover:bg-[#10401f]"
            >
              Thank You
            </button>
          </div>
        </SuccessModal>
      )}

      {showModal && modalType === "error" && (
        <ErrorModal isOpen={showModal} onClose={handleModalClose} title={modalTitle} subtitle={modalMessage}>
          <div className="py-4 text-center">
            <button
              onClick={handleModalClose}
              className="rounded-xl bg-red-500 px-6 py-2 font-medium text-white transition hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        </ErrorModal>
      )}
    </section>
  );
};

export default StudioContactUs;

