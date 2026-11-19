import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import banner from "../assets/bg3.jpg";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center">
      {/* Background Image */}
      <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover contrast-40" />
      <div className="absolute inset-0 bg-green-950/60"></div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-16 pt-32 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-3xl font-black text-white sm:text-5xl"
        >
          Empowering the Next Generation of Tech Professionals!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mx-auto mt-4 max-w-3xl text-sm font-bold text-white sm:text-xl"
        >
          Gain hands-on experience in Software Development, Multimedia, Networking, and Computer Systems with HBLab.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => navigate("/get-started")}
            className="py-3 px-5 bg-white rounded text-green-900 text-sm font-semibold hover:bg-green-50"
          >
            Join a training &rarr;
          </button>
          <button
            type="button"
            onClick={() => navigate("/internship")}
            className="py-3 px-5 bg-transparent border border-white rounded text-white text-sm font-semibold hover:bg-white hover:text-green-900"
          >
            Apply for an internship &rarr;
          </button>
        </motion.div>

        {/* Statistics Section with Count Animation */}
        <div className="mt-12 grid w-full grid-cols-1 gap-8 text-white sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="px-3"
          >
            <h2 className="text-sm font-bold underline sm:text-base">Number of Interns Trained</h2>
            <p className="mt-2 text-2xl font-black">
              <CountUp start={0} end={500} duration={3} />+
            </p>
            <p className="mt-1 text-sm">Students Trained in Software Development, Multimedia, Networking, and Computer Systems!</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="px-3"
          >
            <h2 className="text-sm font-bold underline sm:text-base">Internship Placement Rate</h2>
            <p className="mt-2 text-2xl font-black">
              <CountUp start={0} end={90} duration={3} />%
            </p>
            <p className="mt-1 text-sm">of Our Interns Secure Jobs or Start Their Own Tech Projects!</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="px-3"
          >
            <h2 className="text-sm font-bold underline sm:text-base">Successful Projects Completed</h2>
            <p className="mt-2 text-2xl font-black">
              <CountUp start={0} end={100} duration={3} />+
            </p>
            <p className="mt-1 text-sm">Real-World Projects Completed by Our Interns!</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
