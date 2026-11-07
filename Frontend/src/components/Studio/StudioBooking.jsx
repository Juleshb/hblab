import React, { useState } from "react";
import { motion } from "framer-motion";
import { FormModal, SuccessModal, ErrorModal } from "../ClientModal";
import LoadingSpinner from "../LoadingSpinner";
import { apiOrigin } from "../../apiOrigin";

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
      const response = await fetch(`${apiOrigin}/api/studio/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type: "booking",
          source: "studio-booking",
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
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
    <section id="studio-booking" className="bg-[#f4f6f3] px-6 py-20 text-[#121614] sm:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.38em] text-[#1f6b4a]">Booking</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Reserve the date.</h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-[#5c675f]">
            Tell the studio what you are planning. HBLab will reply within a day to confirm the crew and package.
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_50px_rgba(18,22,20,0.06)] sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                  Full Name *
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
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                  Email Address *
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
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                  Phone Number *
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
              <div>
                <label htmlFor="eventType" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                  Event Type *
                </label>
                <select
                  id="eventType"
                  required
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-black/10 bg-[#f6f7f5] px-4 py-3 text-sm text-[#121614] outline-none transition focus:border-[#1f6b4a] focus:bg-white focus:ring-4 focus:ring-[#1f6b4a]/15"
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
                <label htmlFor="package" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                  Package (if applicable)
                </label>
                <select
                  id="package"
                  value={formData.package}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-black/10 bg-[#f6f7f5] px-4 py-3 text-sm text-[#121614] outline-none transition focus:border-[#1f6b4a] focus:bg-white focus:ring-4 focus:ring-[#1f6b4a]/15"
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
                <label htmlFor="eventDate" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                  Event Date *
                </label>
                <input
                  id="eventDate"
                  type="date"
                  required
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-black/10 bg-[#f6f7f5] px-4 py-3 text-sm text-[#121614] outline-none transition focus:border-[#1f6b4a] focus:bg-white focus:ring-4 focus:ring-[#1f6b4a]/15"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="eventLocation" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                  Event Location *
                </label>
                <input
                  id="eventLocation"
                  type="text"
                  required
                  value={formData.eventLocation}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-black/10 bg-[#f6f7f5] px-4 py-3 text-sm text-[#121614] outline-none transition focus:border-[#1f6b4a] focus:bg-white focus:ring-4 focus:ring-[#1f6b4a]/15"
                  placeholder="City, Venue name"
                />
              </div>
              <div>
                <label htmlFor="guestCount" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                  Expected Guest Count
                </label>
                <input
                  id="guestCount"
                  type="number"
                  min="1"
                  value={formData.guestCount}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-black/10 bg-[#f6f7f5] px-4 py-3 text-sm text-[#121614] outline-none transition focus:border-[#1f6b4a] focus:bg-white focus:ring-4 focus:ring-[#1f6b4a]/15"
                  placeholder="Number of guests"
                />
              </div>
            </div>

            <div>
              <label htmlFor="specialRequests" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#5c675f]">
                Special Requests or Additional Information
              </label>
              <textarea
                id="specialRequests"
                rows="4"
                value={formData.specialRequests}
                onChange={handleChange}
                className="w-full rounded-2xl border border-black/10 bg-[#f6f7f5] px-4 py-3 text-sm text-[#121614] outline-none transition focus:border-[#1f6b4a] focus:bg-white focus:ring-4 focus:ring-[#1f6b4a]/15 resize-none"
                placeholder="Any special requirements, timeline details, or questions..."
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full rounded-full bg-[#121614] px-8 py-4 text-sm font-semibold text-white"
            >
              Send booking request
            </motion.button>
          </form>
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

export default StudioBooking;

