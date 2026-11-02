import React, { useState } from "react";
import { motion } from "framer-motion";
import aipi from "../assets/bambe.png";
import andela from "../assets/COOPEDHU.png";
import bict from "../assets/CRAT.png";
import ict from "../assets/nbhs.png";
import itek from "../assets/umuhuza.png";
import klab from "../assets/emmaus.png";

const logos = [aipi, andela, bict, ict, itek, klab];

const CompaniesTrustUs = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center mx-auto w-full text-green-900 overflow-hidden py-10">
      {/* Title */}
      <div className="flex justify-center items-center w-full">
        <h1 className="lg:text-3xl text-2xl md:font-bold font-black mb-8 lg:w-full text-center">
          Brands we work with
        </h1>
      </div>

      {/* Moving Logos */}
      <div 
        className="relative w-full max-w-6xl overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className="flex w-max space-x-10"
          animate={{ x: isHovered ? "0%" : ["0%", "-100%"] }} // Pause on hover
          transition={{
            repeat: Infinity,
            duration: 20, // Adjust speed
            ease: "linear",
          }}
        >
          {/* Duplicate logos for smooth looping */}
          {[...logos, ...logos].map((logo, index) => (
            <div
              key={index}
              className="w-32 h-20 flex items-center justify-center"
            >
              <motion.img
                src={logo}
                alt="Company Logo"
                className="lg:w-full lg:h-full w-20 h-20 object-contain filter grayscale hover:filter-none transition duration-300"
                whileHover={{ filter: "grayscale(0%)" }} // Show original color on hover
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default CompaniesTrustUs;
