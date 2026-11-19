import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiClock, FiMail, FiMapPin, FiPhone, FiSend } from "react-icons/fi";
import { SuccessModal, ErrorModal } from "./ClientModal";
import { apiOrigin } from "../apiOrigin";

const contactItems = [
  {
    icon: FiMapPin,
    label: "Head office",
    lines: [
      { text: "Rubavu, Gisenyi, Western Province, Rwanda" },
    ],
  },
  {
    icon: FiPhone,
    label: "Phone",
    lines: [
      { text: "+250 789 028 283", href: "tel:+250789028283" },
      { text: "+250 792 697 730", href: "tel:+250792697730" },
    ],
  },
  {
    icon: FiMail,
    label: "Email",
    lines: [
      { text: "info@hblab.rw", href: "mailto:info@hblab.rw" },
      { text: "studio@hblab.rw", href: "mailto:studio@hblab.rw" },
      { text: "hblabltd@gmail.com", href: "mailto:hblabltd@gmail.com" },
    ],
  },
];

const fieldClass =
  "w-full rounded-2xl border border-green-100 bg-white px-4 py-3.5 text-sm text-green-950 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-600/10 disabled:opacity-60";

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${apiOrigin}/api/contact`, {
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
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        setModalType("error");
        setModalTitle("Failed to Send Message");
        setModalMessage(data.message || "Something went wrong. Please try again.");
        setShowModal(true);
      }
    } catch {
      setModalType("error");
      setModalTitle("Network Error");
      setModalMessage("Please check your connection and try again.");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="mx-auto w-full max-w-6xl px-6 py-20 text-green-950"
    >
      <div className="mb-10 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-green-700">Contact</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Talk with HBLab</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-green-800 sm:text-base">
          Send a message about training, an internship, or a project. We reply from the Rubavu office.
        </p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-green-100 bg-white">
        <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <aside className="relative bg-green-950 px-6 py-8 text-white sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-black/10" />

            <div className="relative">
              <h2 className="text-2xl font-black sm:text-3xl">Get in touch</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-green-50">
                High-Technology Builder Lab Ltd. Chief Executive Officer: HABARUREMA Jules.
              </p>

              <div className="mt-8 space-y-3">
                {contactItems.map(({ icon: Icon, label, lines }) => (
                  <div key={label} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-green-100">{label}</p>
                        {lines.map((line) =>
                          line.href ? (
                            <a key={line.text} href={line.href} className="mt-0.5 block text-sm text-white hover:underline">
                              {line.text}
                            </a>
                          ) : (
                            <p key={line.text} className="mt-0.5 text-sm text-white">{line.text}</p>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-white/10 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FiClock className="h-4 w-4" aria-hidden="true" />
                  Business hours
                </div>
                <div className="mt-3 space-y-1 text-sm text-green-50">
                  <p>Monday to Friday, 8:00 AM – 6:00 PM</p>
                  <p>Saturday, 9:00 AM – 4:00 PM</p>
                  <p>Sunday, closed</p>
                </div>
              </div>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="bg-white px-6 py-8 sm:px-8 sm:py-10">
            <div className="mb-6">
              <h2 className="text-2xl font-black sm:text-3xl text-green-950">Send a message</h2>
              <p className="mt-2 text-sm leading-6 text-green-800">
                Tell us what you need. The fields marked with a star are required.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-green-900">
                  Full name <span className="text-green-600">*</span>
                </label>
                <input
                  className={fieldClass}
                  placeholder="Your full name"
                  type="text"
                  id="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-green-900">
                    Email <span className="text-green-600">*</span>
                  </label>
                  <input
                    className={fieldClass}
                    placeholder="you@email.com"
                    type="email"
                    id="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-green-900">
                    Phone <span className="text-green-600">*</span>
                  </label>
                  <input
                    className={fieldClass}
                    placeholder="0788 000 000"
                    type="tel"
                    id="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-green-900">
                  Message <span className="text-green-600">*</span>
                </label>
                <textarea
                  className={`${fieldClass} resize-none`}
                  placeholder="Training, internship, software, or studio work"
                  rows="6"
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-wait disabled:opacity-70"
              >
                <FiSend className="h-4 w-4" aria-hidden="true" />
                {loading ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showModal && modalType === "success" && (
        <SuccessModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalTitle}
          subtitle={modalMessage}
        >
          <div className="py-4 text-center">
            <p className="mb-6 text-gray-700">
              We've received your message and will get back to you within 24 hours.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="rounded-full bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-800"
            >
              Thank you
            </button>
          </div>
        </SuccessModal>
      )}

      {showModal && modalType === "error" && (
        <ErrorModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalTitle}
          subtitle={modalMessage}
        >
          <div className="py-4 text-center">
            <p className="mb-6 text-gray-700">
              Please try again or contact us directly if the problem persists.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="rounded-full bg-red-600 px-6 py-2 font-medium text-white"
            >
              Try again
            </button>
          </div>
        </ErrorModal>
      )}
    </motion.div>
  );
};

export default ContactUs;
