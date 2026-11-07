import React, { useState } from "react";
import { motion } from "framer-motion";
import { FormModal, SuccessModal, ErrorModal } from "../ClientModal";
import LoadingSpinner from "../LoadingSpinner";
import { apiOrigin } from "../../apiOrigin";

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
      const response = await fetch(`${apiOrigin}/api/studio/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "studio-contact",
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
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
    <section id="studio-contact" className="bg-[#090b0a] px-6 py-20 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.38em] text-[#e7c15a]">Contact</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Talk to the studio.</h2>
          <p className="mt-4 text-sm leading-6 text-white/60">
            HB Studio is a product of HBLab. Send the brief and the same team will answer.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-white"
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
                  <p className="text-green-100">studio@hblab.rw</p>
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
            className="rounded-[28px] bg-white p-8 text-[#121614]"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-black/10 bg-[#f6f7f5] px-4 py-3 text-sm text-[#121614] outline-none transition focus:border-[#1f6b4a] focus:bg-white focus:ring-4 focus:ring-[#1f6b4a]/15"
                  placeholder="Your full name"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-black/10 bg-[#f6f7f5] px-4 py-3 text-sm text-[#121614] outline-none transition focus:border-[#1f6b4a] focus:bg-white focus:ring-4 focus:ring-[#1f6b4a]/15"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-black/10 bg-[#f6f7f5] px-4 py-3 text-sm text-[#121614] outline-none transition focus:border-[#1f6b4a] focus:bg-white focus:ring-4 focus:ring-[#1f6b4a]/15"
                    placeholder="+250 788 123 456"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="service" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                  Service Interest
                </label>
                <select
                  id="service"
                  required
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-black/10 bg-[#f6f7f5] px-4 py-3 text-sm text-[#121614] outline-none transition focus:border-[#1f6b4a] focus:bg-white focus:ring-4 focus:ring-[#1f6b4a]/15"
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
                <label htmlFor="message" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-black/10 bg-[#f6f7f5] px-4 py-3 text-sm text-[#121614] outline-none transition focus:border-[#1f6b4a] focus:bg-white focus:ring-4 focus:ring-[#1f6b4a]/15 resize-none"
                  placeholder="Tell us about your project..."
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full rounded-full bg-[#121614] px-8 py-4 text-sm font-semibold text-white"
              >
                Send message
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
              className="rounded-xl bg-[#2e6b57] px-6 py-2 font-medium text-white transition hover:bg-[#1a3d31]"
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

