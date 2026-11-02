import React, { useState } from "react";
import { motion } from "framer-motion";
import kids from "../assets/nn.jpg";

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
          <label className="lg:text-3xl text-2xl md:font-bold font-black mb-8 lg:w-full text-center">Invest in your career growth</label>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex"
        >
          <p className="break-words text-black p-4">
            The technology industry is evolving faster than ever, so HB-Lab
            provides the support and resources you need to stay one step ahead.
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
              <h1 className="font-black lg:text-2xl text-xl">Thrive with HB-Lab</h1>
              <p className="font-small lg:text-start lg:w-3/4 w-full leading-relaxed text-black h-full flex items-center">
                Access carefully curated programs designed to help you network,
                develop your skills, and improve your quality of life. From
                mentorship to events and training opportunities, you'll have the
                chance to meet like-minded peers, problem-solve, and collaborate
                with global tech experts.
              </p>
            </div>
          </motion.div>
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
              <p className="text-black">We'll help you upskill in advanced technologies so you can land your ideal role.</p>
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
              <h1 className="font-bold text-xl">Events</h1>
              <p className="text-black">Gain insights from leaders who will take you behind the scenes at their top global companies.</p>
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
              <h1 className="font-bold text-xl">Mentorship</h1>
              <p className="text-black">Receive peer-to-peer support and guidance from HB-Lab experts and community members, 24/7.</p>
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
              <h1 className="font-bold text-xl">Perks</h1>
              <p className="text-black">Access opportunities and more from our trusted partners.</p>
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
              <h1 className="font-bold text-xl">Wellness</h1>
              <p className="text-black">Join wellness sessions, including virtual meditation, yoga, and community health initiatives.</p>
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
              <h1 className="font-bold text-xl">Meet-ups</h1>
              <p className="text-black">Connect with like-minded technologists at quarterly, in-person events in your region.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
