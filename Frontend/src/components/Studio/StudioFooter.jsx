import React from "react";
import { motion } from "framer-motion";
import { labHomeHref, studioHomePath } from "../../site";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/HB-STUDIO-FULL-1-WHITE.png";
import logoIcon from "../../assets/HB-STUDIO-WHITE.png";
import { Icon } from "@iconify/react";

const StudioFooter = () => {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate(`${studioHomePath()}#${id}`);
  };

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative w-full text-white overflow-hidden"
    >
      {/* Background matching hero section */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900 via-[#2e6b57cc] to-[#310979bb]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#01060499] to-[#010604]"></div>
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 sm:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="HB Studio" className="h-20 hidden sm:block object-contain" />
              <img src={logoIcon} alt="HB Studio" className="h-12 sm:hidden object-contain" />
              
            </div>
            <p className="text-sm text-white/70 mb-4">
              Capturing Rwanda's stories through cinematic videography, editorial photography, and premium podcast production.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/hblabrw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#f6c343] hover:text-green-900"
              >
                <Icon icon="proicons:instagram" width="20" height="20" />
              </a>
              <a
                href="https://x.com/HabaruremaJules"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#f6c343] hover:text-green-900"
              >
                <Icon icon="line-md:twitter-x-alt" width="20" height="20" />
              </a>
              <a
                href="https://www.linkedin.com/company/hb-lab/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#f6c343] hover:text-green-900"
              >
                <Icon icon="ri:linkedin-fill" width="20" height="20" />
              </a>
              <a
                href="https://www.tiktok.com/@hblabrw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#f6c343] hover:text-green-900"
              >
                <Icon icon="ic:sharp-tiktok" width="20" height="20" />
              </a>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col"
          >
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <button
                  onClick={() => scrollToSection("studio-services")}
                  className="transition hover:text-[#f6c343]"
                >
                  Videography
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("studio-services")}
                  className="transition hover:text-[#f6c343]"
                >
                  Photography
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("studio-services")}
                  className="transition hover:text-[#f6c343]"
                >
                  Podcast Production
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("studio-services")}
                  className="transition hover:text-[#f6c343]"
                >
                  Live Streaming
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("studio-pricing")}
                  className="transition hover:text-[#f6c343]"
                >
                  Wedding Packages
                </button>
              </li>
            </ul>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col"
          >
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <button
                  onClick={() => scrollToSection("studio-home")}
                  className="transition hover:text-[#f6c343]"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("studio-showreel")}
                  className="transition hover:text-[#f6c343]"
                >
                  Showreel
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("studio-booking")}
                  className="transition hover:text-[#f6c343]"
                >
                  Book a Shoot
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("studio-contact")}
                  className="transition hover:text-[#f6c343]"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const home = labHomeHref();
                    if (home.startsWith('http')) window.location.assign(home);
                    else navigate(home);
                  }}
                  className="transition hover:text-[#f6c343]"
                >
                  HB Lab
                </button>
              </li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col"
          >
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <Icon icon="mdi:map-marker" className="mt-0.5 h-5 w-5 text-[#f6c343] flex-shrink-0" />
                <span>Rubavu, Rwanda</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="mdi:phone" className="mt-0.5 h-5 w-5 text-[#f6c343] flex-shrink-0" />
                <a href="tel:+250792445913" className="transition hover:text-[#f6c343]">
                  +250 792 445 913
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="mdi:email" className="mt-0.5 h-5 w-5 text-[#f6c343] flex-shrink-0" />
                <a href="mailto:info@hblab.rw" className="transition hover:text-[#f6c343]">
                  info@hblab.rw
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon="mdi:clock-outline" className="mt-0.5 h-5 w-5 text-[#f6c343] flex-shrink-0" />
                <div>
                  <p>Mon-Fri: 8AM - 6PM</p>
                  <p>Sat: 9AM - 4PM</p>
                </div>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 border-t border-white/10 pt-8"
        >
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} HB Studio. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-white/60">
              <button
                onClick={() => navigate("/privacy-policy")}
                className="transition hover:text-[#f6c343]"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate("/terms-of-use")}
                className="transition hover:text-[#f6c343]"
              >
                Terms of Use
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default StudioFooter;

