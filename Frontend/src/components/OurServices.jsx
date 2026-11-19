import React from "react";
import { FaCode, FaCog, FaHandshake, FaLaptop } from "react-icons/fa";
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
            Our services
          </h1>
        </motion.div>

        {/* Services Grid */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Service 1 - Web & Mobile Development */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            id="service-development"
            className="flex h-full w-full flex-col rounded-lg bg-teal-100 px-5 py-5 text-center shadow-lg lg:py-10"
          >
            <div className="flex justify-center">
              <FaCode size={50} />
            </div>
            <h3 className="font-black text-xl p-2">Software and websites</h3>
            <ul className="list-disc text-black pl-7 text-left">
              <li>Management, school, and hotel systems</li>
              <li>E-commerce and custom business applications</li>
              <li>Corporate, school, NGO, and government websites</li>
              <li>Databases, APIs, and website support</li>
            </ul>
          </motion.div>

          {/* Service 2 - IT Services */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            id="service-studio"
            className="flex h-full w-full flex-col rounded-lg bg-blue-200 px-5 py-5 text-center shadow-lg lg:py-10"
          >
            <div className="flex justify-center">
              <FaLaptop size={50} />
            </div>
            <h3 className="font-black text-xl p-2">HB Studio</h3>
            <ul className="list-disc text-black pl-7 text-left">
              <li>Corporate, event, product, and graduation photography</li>
              <li>Corporate, event, promotional, and documentary video</li>
              <li>Live streaming for conferences, churches, and graduations</li>
              <li>Podcast recording, video podcasts, and editing</li>
            </ul>
          </motion.div>

          {/* Service 3 - Online & Offline Courses */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            id="service-courses"
            className="flex h-full w-full flex-col rounded-lg bg-blue-100 px-5 py-5 text-center shadow-lg lg:py-10"
          >
            <div className="flex justify-center">
              <FaCog size={50} />
            </div>
            <h3 className="font-black text-xl p-2">Mobile, design, and training</h3>
            <ul className="list-disc text-black pl-7 text-left">
              <li>Android apps, progressive web apps, and cross-platform apps</li>
              <li>UI and UX design, wireframes, and prototypes</li>
              <li>Training in software, networks, multimedia, electronics, accounting, and electrical work</li>
              <li>Internships for TVET, university students, and graduates</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            id="service-consultancy"
            className="flex h-full w-full flex-col rounded-lg bg-green-100 px-5 py-5 text-center shadow-lg lg:py-10"
          >
            <div className="flex justify-center">
              <FaHandshake size={50} />
            </div>
            <h3 className="font-black text-xl p-2">Consultancy</h3>
            <p className="mb-3 text-left text-sm text-black">
              Expert IT consulting services to help organizations optimize their technology infrastructure and strategy.
            </p>
            <ul className="list-disc text-black pl-7 text-left">
              <li>IT Strategy and Policy Development</li>
              <li>Implementation Solutions</li>
              <li>Technical Problem-Solving</li>
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
