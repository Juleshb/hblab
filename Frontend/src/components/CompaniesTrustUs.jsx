import React, { useState } from "react";
import { motion } from "framer-motion";
import bambe from "../assets/bambe.png";
import coopedhu from "../assets/COOPEDHU.png";
import crat from "../assets/CRAT.png";
import nbhs from "../assets/nbhs.png";
import umuhuza from "../assets/umuhuza.png";
import emmaus from "../assets/emmaus.png";
import upsa from "../assets/upsa-next.png";
import rupsa from "../assets/rupsa-plc.png";
import nabe from "../assets/nabe.png";
import jot from "../assets/jot.png";
import elena from "../assets/elena-guerra.png";
import heroine from "../assets/la-heroine.png";

const logos = [
  { src: bambe, name: "Bambe" },
  { src: coopedhu, name: "Coopedhu" },
  { src: crat, name: "CRAT" },
  { src: nbhs, name: "NBHS" },
  { src: umuhuza, name: "Umuhuza" },
  { src: emmaus, name: "Emmaus" },
  { src: upsa, name: "UPSA Next Payment" },
  { src: rupsa, name: "RUPSA Next Payment PLC" },
  { src: nabe, name: "National Benchmark Engineering" },
  { src: jot, name: "JOT" },
  { src: elena, name: "C.S Elena Guerra Butare" },
  { src: heroine, name: "La Heroine" },
];

const CompaniesTrustUs = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center mx-auto w-full text-green-900 overflow-hidden py-10">
      {/* Title */}
      <div className="flex justify-center items-center w-full">
        <h1 className="lg:text-3xl text-2xl md:font-bold font-black mb-8 lg:w-full text-center">
          Trusted companies
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
          animate={{ x: isHovered ? "0%" : ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            duration: 36,
            ease: "linear",
          }}
        >
          {[...logos, ...logos].map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex h-20 w-40 items-center justify-center"
            >
              <motion.img
                src={logo.src}
                alt={logo.name}
                className="h-16 w-full object-contain"
                whileHover={{ filter: "grayscale(0%)" }}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default CompaniesTrustUs;
