import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import banner from "../assets/bg3.jpg";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <div className="relative w-full h-screen flex items-center">
      {/* Background Image */}
      <img src={banner} alt="relative" className="w-full h-full object-cover contrast-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-green-900 bg-opacity-70"></div>

      {/* Main Content */}
      <div className="absolute left-10 mt-10 rounded-lg max-w-screen-lg mx-auto">
        <motion.label
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="lg:font-black font-black text-white lg:text-5xl text-xl"
        >
          Empowering the Next Generation of Tech Professionals!
        </motion.label>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex text-start text-white mt-2 lg:w-3/4 break-words font-bold lg:text-xl text-sm lg:mt-10"
        >
          Gain hands-on experience in Software Development, Multimedia, Networking, and Computer Systems with HBLab.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          onClick={() => navigate("/get-started")} 
          className="mt-4 py-3 px-5 bg-transparent border-2 rounded border-white text-gray-50 text-sm hover:bg-white hover:text-green-900 hover:font-semibold"
        >
          Get Started Now &rarr;
        </motion.button>

        {/* Statistics Section with Count Animation */}
        <div className="grid lg:grid-cols-3 grid-cols-1 my-auto w-full h-fit lg:mt-10 lg:pt-10 text-white">
          {/* Stat 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex md:mx-0 mx-auto m-2"
          >
            <div className="w-[1px] h-24 bg-gradient-to-b from-white to-transparent lg:inline"></div>
            <div className="flex flex-col my-auto px-2">
              <h1 className="font-bold text-sm lg:text-base underline">Number of Interns Trained</h1>
              <h1 className="font-bold lg:text-xl text-sm">
                <CountUp start={0} end={500} duration={3} />+
              </h1>
              <p className="text-white">Students Trained in Software Development, Multimedia, Networking, and Computer Systems!</p>
            </div>
          </motion.div>

          {/* Stat 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex md:mx-0 mx-auto m-2"
          >
            <div className="w-[1px] h-24 bg-gradient-to-b from-white to-transparent lg:inline"></div>
            <div className="flex flex-col my-auto px-2">
              <h1 className="font-bold text-sm lg:text-base underline">Internship Placement Rate</h1>
              <h1 className="font-bold lg:text-xl text-sm">
                <CountUp start={0} end={90} duration={3} />%
              </h1>
              <p className="text-white">of Our Interns Secure Jobs or Start Their Own Tech Projects!</p>
            </div>
          </motion.div>

          {/* Stat 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex md:mx-0 mx-auto m-2"
          >
            <div className="w-[1px] h-24 bg-gradient-to-b from-white to-transparent lg:inline"></div>
            <div className="flex flex-col my-auto px-2">
              <h1 className="font-bold text-sm lg:text-base underline">Successful Projects Completed</h1>
              <h1 className="font-bold lg:text-xl text-sm">
                <CountUp start={0} end={100} duration={3} />+
              </h1>
              <p className="text-white">Real-World Projects Completed by Our Interns!</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
