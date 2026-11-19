import React from "react";
import { motion } from "framer-motion";
import avatar from '../assets/avatar.png';
import jules from '../assets/nn.jpeg';
import fab from '../assets/fab.jpeg';
import gribert from '../assets/mubea.jpeg';
import prince from '../assets/prince-mucyo.png';
import kevine from '../assets/kevine-mugabire.png';
import aimable from '../assets/aimable-niyomugabo.png';

const teamMembers = [
  { name: "Jules HABARUREMA", role: "CEO & Founder", image: jules },
  { name: "Fabrice MBARUSHIMANA", role: "Full Stack Software Engineer", image: fab },
  { name: "Ferdinand KWIZERA", role: "IT Support and Training Coordinator", image: avatar },
  { name: "Gilbert HABARUREMA", role: "UX/UI (Project Design)", image: gribert },
  { name: "Prince MUCYO", role: "Developer", image: prince },
  { name: "Kevine MUGABIRE", role: "Marketing Manager", image: kevine },
  { name: "Aimable NIYOMUGABO", role: "Project Manager", image: aimable },
];

const LeadershipTeam = () => {
  return (
    <div className="flex items-center justify-center mx-auto w-full text-green-900 lg:my-20 my-10">
      <div className="flex flex-col justify-center items-center mx-auto">
        {/* Title Animation */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="lg:text-3xl text-2xl md:font-bold font-black mb-8 lg:w-full text-center"
        >
          Meet Our Team
        </motion.h1>

        {/* Description Animation */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="font-small lg:text-start lg:w-2/4 w-full leading-relaxed text-green-900 bg-white p-4 border-s-4 border-green-900 h-full flex items-center"
        >
          At HB-Lab, our team is made up of passionate, highly skilled professionals dedicated to shaping the future of technology. With expertise in software development, multimedia, networking, and computer systems, we work together to mentor, innovate, and empower the next generation of tech leaders. Our collective experience drives success, ensuring that we provide world-class learning opportunities and groundbreaking solutions.
        </motion.p>

        {/* Team Members Grid */}
        <motion.div 
          className="mt-4 grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.3 }
            }
          }}
        >
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center text-center"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
              }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.img
                src={member.image}
                alt={member.name}
                className="h-32 w-32 rounded-full border-4 border-white object-cover object-top shadow-md"
                whileHover={{ scale: 1.1, rotate: 2 }}
              />
              <p className="font-bold mt-4">{member.name}</p>
              <p className="text-gray-500">{member.role}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LeadershipTeam;
