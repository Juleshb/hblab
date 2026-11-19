import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaAward, FaBalanceScale, FaBookOpen, FaBriefcase, FaHeart, FaLightbulb, FaUsers } from "react-icons/fa";
import kids from "../assets/nn.jpg";

const coreValues = [
  { label: "Innovation", icon: FaLightbulb },
  { label: "Excellence", icon: FaAward },
  { label: "Integrity", icon: FaBalanceScale },
  { label: "Professionalism", icon: FaBriefcase },
  { label: "Teamwork", icon: FaUsers },
  { label: "Customer satisfaction", icon: FaHeart },
  { label: "Continuous learning", icon: FaBookOpen },
];

const AboutUs = () => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex font-Poppins items-center justify-center mx-auto w-full text-green-900">
      <div className="flex flex-col gap-5 max-w-screen-xl mx-auto px-5">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="p-4 text-start"
        >
          <label className="lg:text-3xl text-2xl md:font-bold font-black mb-8 lg:w-full text-center">High-Technology Builder Lab Ltd</label>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex"
        >
          <p className="break-words text-black p-4">
            HBLab Ltd is a private technology and multimedia company in Rubavu, Gisenyi. We build digital solutions, produce multimedia through HB Studio, and train young professionals with practical skills.
          </p>
        </motion.div>

        {/* Image & Text Section */}
        <div className="grid lg:grid-cols-2 grid-cols-1 flex justify-center items-center gap-15 p-4">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-col rounded-lg h-full w-full items-center justify-center border-[3px] border-solid  border-green-900"
          >
            <img src={kids} alt="" className="w-full h-auto rounded-lg p-4" />
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="flex flex-col lg:py-10 py-3 rounded-lg h-full w-full"
          >
            <div className="flex flex-col my-auto gap-5">
              <h1 className="font-black lg:text-2xl text-xl">Our mission</h1>
              <p className="font-small lg:text-start w-full leading-relaxed text-black">
                To provide innovative technology solutions, high-quality multimedia services, and practical skills programs that create value for businesses, institutions, and communities.
              </p>
              <p className="font-small lg:text-start w-full leading-relaxed text-black">
                Our vision is to become a leading technology, multimedia, and professional training company in Rwanda and across Africa. Chief Executive Officer: HABARUREMA Jules.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Legal name", "High-Technology Builder Lab Ltd"],
            ["Head office", "Rubavu, Gisenyi, Rwanda"],
            ["Status", "Private limited company"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-green-800">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="px-4">
          <h2 className="text-xl font-black">Core values</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {coreValues.map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-900 text-white">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-green-900">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid lg:grid-cols-3 grid-cols-1 my-auto w-full h-fit p-4">
          {/* Feature: Training */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex md:mx-0 mx-auto m-2"
          >
            <div className="w-[1px] h-24 bg-gradient-to-b from-black to-transparent lg:inline hidden"></div>
            <div className="flex flex-col my-auto px-2">
              <h1 className="font-bold text-xl">Training</h1>
              <p className="text-black">Practical classes in software, networking, computer systems, multimedia, electronics, accounting, and electrical technology.</p>
            </div>
          </motion.div>

          {/* Feature: Events */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex md:mx-0 mx-auto m-2"
          >
            <div className="w-[1px] h-24 bg-gradient-to-b from-black to-transparent lg:inline hidden"></div>
            <div className="flex flex-col my-auto px-2">
              <h1 className="font-bold text-xl">HB Studio</h1>
              <p className="text-black">Photography, video, live streaming, and podcast production for companies, schools, and events.</p>
            </div>
          </motion.div>

          {/* Feature: Mentorship */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex md:mx-0 mx-auto m-2"
          >
            <div className="w-[1px] h-24 bg-gradient-to-b from-black to-transparent lg:inline hidden"></div>
            <div className="flex flex-col my-auto px-2">
              <h1 className="font-bold text-xl">Internship</h1>
              <p className="text-black">Workplace experience, mentorship, and real projects for TVET students, university students, and recent graduates.</p>
            </div>
          </motion.div>

          {/* Feature: Perks */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex md:mx-0 mx-auto m-2"
          >
            <div className="w-[1px] h-24 bg-gradient-to-b from-black to-transparent lg:inline hidden"></div>
            <div className="flex flex-col my-auto px-2">
              <h1 className="font-bold text-xl">Who we serve</h1>
              <p className="text-black">Government, schools, TVET, NGOs, private companies, religious organizations, and small businesses.</p>
            </div>
          </motion.div>

          {/* Feature: Wellness */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex md:mx-0 mx-auto m-2"
          >
            <div className="w-[1px] h-24 bg-gradient-to-b from-black to-transparent lg:inline hidden"></div>
            <div className="flex flex-col my-auto px-2">
              <h1 className="font-bold text-xl">Why HBLab</h1>
              <p className="text-black">An experienced team, practical solutions, and services that can grow with the client.</p>
            </div>
          </motion.div>

          {/* Feature: Meet-ups */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="flex md:mx-0 mx-auto m-2"
          >
            <div className="w-[1px] h-24 bg-gradient-to-b from-black to-transparent lg:inline hidden"></div>
            <div className="flex flex-col my-auto px-2">
              <h1 className="font-bold text-xl">Partnerships</h1>
              <p className="text-black">Skills programs, internships, software, multimedia, digital innovation, and youth employment.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
