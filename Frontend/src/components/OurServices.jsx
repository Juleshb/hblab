import React from "react";
import { FaCode, FaLaptop, FaCog } from "react-icons/fa";
import { motion } from "framer-motion";

const OurServices = () => {
  return (
    <div className="flex items-center justify-center mx-auto w-full text-green-900">
      <div className="flex flex-col items-center gap-5 max-w-screen-xl mx-auto px-5">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="lg:text-3xl text-2xl md:font-bold font-black mb-8 lg:w-full text-center">
            Other Services
          </h1>
        </motion.div>

        {/* Services Grid */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 lg:gap-10 gap-3">
          {/* Service 1 - Web & Mobile Development */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col bg-teal-100 px-5 py-5 mx-auto lg:py-10 rounded-lg h-full w-full md:w-80 text-center shadow-lg"
          >
            <div className="flex justify-center">
              <FaCode size={50} />
            </div>
            <h3 className="font-black text-xl p-2">Web & Mobile Development</h3>
            <ul className="list-disc text-black pl-7 text-left">
              <li>Crafting captivating landing pages</li>
              <li>Building robust e-commerce websites</li>
              <li>Developing dynamic full-stack web & mobile applications</li>
            </ul>
          </motion.div>

          {/* Service 2 - IT Services */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col bg-blue-200 px-5 py-5 mx-auto lg:py-10 rounded-lg h-full w-full md:w-80 text-center shadow-lg"
          >
            <div className="flex justify-center">
              <FaLaptop size={50} />
            </div>
            <h3 className="font-black text-xl p-2">IT Services</h3>
            <ul className="list-disc text-black pl-7 text-left">
              <li>Providing reliable IT support and CCTV operations</li>
              <li>Designing tailored IT business solutions</li>
              <li>Expertly managing network design and administration</li>
            </ul>
          </motion.div>

          {/* Service 3 - Online & Offline Courses */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col bg-blue-100 px-5 py-5 mx-auto lg:py-10 rounded-lg h-full w-full md:w-80 text-center shadow-lg"
          >
            <div className="flex justify-center">
              <FaCog size={50} />
            </div>
            <h3 className="font-black text-xl p-2">Online & Offline Courses</h3>
            <ul className="list-disc text-black pl-7 text-left">
              <li>Software Development (Front-End and Back-End)</li>
              <li>UI/UX Design and Graphic Design</li>
              <li>Hardware and Video Production</li>
              <li>Comprehensive IT training to enhance skills</li>
            </ul>
          </motion.div>
        </div>

        {/* Request Service Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="mt-4 py-3 px-5 bg-transparent border-2 rounded border-green-900 text-green-900 text-sm hover:bg-green-900 hover:text-white hover:font-semibold"
          >
            Request service &rarr;
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default OurServices;
