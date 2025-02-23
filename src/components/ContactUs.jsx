import React, { useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

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
        toast.success("Message sent successfully!");
        setFormData({ name: "", email: "", phone: "", message: "" }); // Clear form
      } else {
        toast.error("Failed to send message.");
      }
    } catch (error) {
      toast.error("Network error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }}
      className="flex items-center justify-center mx-auto w-full text-green-900"
    >
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="flex flex-col items-center gap-5 max-w-screen-xl mx-auto px-5">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.6 }}
          className="lg:text-3xl text-2xl md:font-bold font-black mb-8 lg:w-full text-center"
        >
          Contact Us
        </motion.h1>

        <section>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8"
          >
            <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-5">
              <motion.div 
                initial={{ x: -50, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ duration: 0.6 }}
                className="lg:col-span-2 lg:py-12"
              >
                <p className="max-w-xl text-lg">
                  Let’s get this conversation started. Tell us a bit about yourself and we’ll get in touch as soon as we can.
                </p>
                <div className="mt-8">
                  <a href="#" className="font-bold"> +250 789 028 283 / +250 792 445 913</a><br />
                  <a href="#" className="font-bold mt-2"> hblabltd@gmail.com</a>
                  <address className="mt-2 not-italic">or visit our office at Rubavu/Rugero front of Erica Motel</address>
                </div>
              </motion.div>

              <motion.div 
                initial={{ x: 50, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ duration: 0.6 }}
                className="rounded-lg bg-white p-8 shadow-lg lg:col-span-3 lg:p-12"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input className="w-full rounded-lg border border-green-200 p-3 text-sm" placeholder="Name" type="text" id="name" value={formData.name} onChange={handleChange} required />
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input className="w-full rounded-lg border border-green-200 p-3 text-sm" placeholder="Email address" type="email" id="email" value={formData.email} onChange={handleChange} required />
                    <input className="w-full rounded-lg border border-green-200 p-3 text-sm" placeholder="Phone Number" type="tel" id="phone" value={formData.phone} onChange={handleChange} required />
                  </div>

                  <textarea className="w-full rounded-lg border border-green-200 p-3 text-sm" placeholder="Message" rows="5" id="message" value={formData.message} onChange={handleChange} required></textarea>

                  <div className="mt-4">
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.5 }}
                      className="w-full py-3 px-5 bg-green-900 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center"
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
                </form>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>
    </motion.div>
  );
};

export default ContactUs;
