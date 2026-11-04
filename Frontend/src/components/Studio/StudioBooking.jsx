import React, { useState } from "react";
import { motion } from "framer-motion";
import { FormModal, SuccessModal, ErrorModal } from "../ClientModal";
import LoadingSpinner from "../LoadingSpinner";

const StudioBooking = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    package: "",
    eventDate: "",
    eventLocation: "",
    guestCount: "",
    specialRequests: "",
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
          type: "booking",
          source: "studio-booking",
          subject: `HB Studio Booking: ${formData.eventType || "Event"} - ${formData.package || "Package"}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setModalType("success");
        setModalTitle("Booking Request Received!");
        setModalMessage("We've received your booking request. Our team will contact you within 24 hours to confirm details.");
        setShowModal(true);
        setFormData({
          name: "",
          email: "",
          phone: "",
          eventType: "",
          package: "",
          eventDate: "",
          eventLocation: "",
          guestCount: "",
          specialRequests: "",
        });
      } else {
        setModalType("error");
        setModalTitle("Booking Failed");
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
    return <LoadingSpinner message="Processing your booking..." />;
  }

  return (
    <section id="studio-booking" className="relative bg-gradient-to-b from-gray-50 to-white px-6 py-20 text-green-900 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-xs uppercase tracking-[0.45em] text-green-700">Book Your Event</p>
          <h2 className="mt-4 text-4xl font-black sm:text-5xl">Reserve Your Date</h2>
          <p className="mt-4 text-lg text-green-800/80">
            Fill out the form below and we'll get back to you to confirm your booking.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-green-900/10 bg-white p-8 shadow-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-700">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#2e6b57] focus:outline-none focus:ring-4 focus:ring-[#2e6b57]/30 transition-all"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#2e6b57] focus:outline-none focus:ring-4 focus:ring-[#2e6b57]/30 transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-gray-700">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#2e6b57] focus:outline-none focus:ring-4 focus:ring-[#2e6b57]/30 transition-all"
                  placeholder="+250 788 123 456"
                />
              </div>
              <div>
                <label htmlFor="eventType" className="mb-2 block text-sm font-semibold text-gray-700">
                  Event Type *
                </label>
                <select
                  id="eventType"
                  required
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#2e6b57] focus:outline-none focus:ring-4 focus:ring-[#2e6b57]/30 transition-all"
                >
                  <option value="">Select event type</option>
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="seminar">Seminar/Conference</option>
                  <option value="livestream">Live Streaming</option>
                  <option value="photoshoot">Photoshoot</option>
                  <option value="podcast">Podcast Recording</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="package" className="mb-2 block text-sm font-semibold text-gray-700">
                  Package (if applicable)
                </label>
                <select
                  id="package"
                  value={formData.package}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#2e6b57] focus:outline-none focus:ring-4 focus:ring-[#2e6b57]/30 transition-all"
                >
                  <option value="">Select a package</option>
                  <option value="s-basic">S-Basic (400,000 RWF)</option>
                  <option value="basic">Basic (500,000 RWF)</option>
                  <option value="medium">Medium (600,000 RWF)</option>
                  <option value="premium">Premium (700,000 RWF)</option>
                  <option value="ultra-premium">Ultra Premium (900,000 RWF)</option>
                  <option value="pro">Pro (1,200,000 RWF)</option>
                  <option value="custom">Custom Package</option>
                </select>
              </div>
              <div>
                <label htmlFor="eventDate" className="mb-2 block text-sm font-semibold text-gray-700">
                  Event Date *
                </label>
                <input
                  id="eventDate"
                  type="date"
                  required
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#2e6b57] focus:outline-none focus:ring-4 focus:ring-[#2e6b57]/30 transition-all"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="eventLocation" className="mb-2 block text-sm font-semibold text-gray-700">
                  Event Location *
                </label>
                <input
                  id="eventLocation"
                  type="text"
                  required
                  value={formData.eventLocation}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#2e6b57] focus:outline-none focus:ring-4 focus:ring-[#2e6b57]/30 transition-all"
                  placeholder="City, Venue name"
                />
              </div>
              <div>
                <label htmlFor="guestCount" className="mb-2 block text-sm font-semibold text-gray-700">
                  Expected Guest Count
                </label>
                <input
                  id="guestCount"
                  type="number"
                  min="1"
                  value={formData.guestCount}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#2e6b57] focus:outline-none focus:ring-4 focus:ring-[#2e6b57]/30 transition-all"
                  placeholder="Number of guests"
                />
              </div>
            </div>

            <div>
              <label htmlFor="specialRequests" className="mb-2 block text-sm font-semibold text-gray-700">
                Special Requests or Additional Information
              </label>
              <textarea
                id="specialRequests"
                rows="4"
                value={formData.specialRequests}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#2e6b57] focus:outline-none focus:ring-4 focus:ring-[#2e6b57]/30 transition-all resize-none"
                placeholder="Any special requirements, timeline details, or questions..."
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-[#2e6b57] to-[#2e6b57] px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition hover:from-[#1a3d31] hover:to-[#2e6b57]"
            >
              Submit Booking Request →
            </motion.button>
          </form>
        </motion.div>
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

export default StudioBooking;

