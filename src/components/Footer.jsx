import React from "react";
import { motion } from "framer-motion";
import Logo from "../assets/logo-white.png";
import { Icon } from "@iconify/react";

function Footer() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }}
      className="bg-green-900 w-full flex justify-center"
    >
      <div className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-20 text-white w-full max-w-6xl">
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center lg:items-start text-center lg:text-left"
        >
          <img src={Logo} alt="Logo" className="lg:w-full w-32 mb-4 p-2" />
        </motion.div>

        {/* Support */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center lg:text-left"
        >
          <p className="text-lg font-semibold mb-4">Support</p>
          <p className="text-sm">Rubavu, Gisenyi</p>
          <a className="block text-sm mt-2" href="mailto:hblabltd@gmail.com">hblabltd@gmail.com</a>
          <a className="block text-sm" href="tel:+250783224032">+250 789 028 283</a>
        </motion.div>

        {/* Quick Links */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center lg:text-left"
        >
          <p className="text-lg font-semibold mb-4">Quick Links</p>
          <p className="text-sm mb-2">Privacy Policy</p>
          <p className="text-sm mb-2">Terms of Use</p>
          <p className="text-sm mb-2">FAQ</p>
          <p className="text-sm">Contact</p>
        </motion.div>

        {/* Get in Touch */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col items-center lg:items-start text-center lg:text-left"
        >
          <p className="text-lg font-semibold mb-4">Get in touch with us!</p>
          <div className="flex justify-center lg:justify-start space-x-3">
            <a href="https://www.instagram.com/hblabrw"><Icon icon="proicons:instagram" width="24" height="24" /></a>
            <a href="https://x.com/HabaruremaJules"><Icon icon="line-md:twitter-x-alt" width="24" height="24" /></a>
            <a href="https://www.linkedin.com/company/hb-lab/"><Icon icon="ri:linkedin-fill" width="24" height="24" /></a>
            <a href="https://www.tiktok.com/@hblabrw"><Icon icon="ic:sharp-tiktok" width="24" height="24" /></a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Footer;
