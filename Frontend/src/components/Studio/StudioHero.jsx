import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import StudioNavbar from "./StudioNavbar";
import StudioShowreel from "./StudioShowreel";
import StudioCoreServices from "./StudioCoreServices";
import StudioPricing from "./StudioPricing";
import StudioBooking from "./StudioBooking";
import StudioContactUs from "./StudioContactUs";
import StudioFooter from "./StudioFooter";
import studioBg from "../../assets/bg3.jpg";

const badges = ["Videography", "Photography", "Podcast", "Live Streaming"];

const StudioHero = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    if (!id) return undefined;
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-black text-white">
      <div id="studio-home">
        <StudioNavbar />
      </div>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={studioBg}
            alt="HB Studio background"
            className="h-full w-full object-cover contrast-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900 via-[#2e6b57cc] to-[#310979bb]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#01060499] to-[#010604]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(246,195,67,0.18),transparent_55%)] mix-blend-screen"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22160%22%20height=%22160%22%20viewBox=%220%200%20160%20160%22%3E%3Cpath%20d=%22M0%2080%20L80%200%20L160%2080%20L80%20160%20Z%22%20fill=%22none%22%20stroke=%22rgba(255,255,255,0.05)%22%20stroke-width=%222%22/%3E%3C/svg%3E')] opacity-60 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-24 pt-32 sm:px-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[11px] uppercase tracking-[0.4em]"
            >
              HB Studio
              <span className="h-1 w-1 rounded-full bg-[#f6c343]"></span>
              Rubavu · 
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.9rem]"
            >
              Rwandan stories filmed, photographed, and streamed with cinematic precision.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 text-base text-white/80 sm:text-lg"
            >
              HB Studio delivers videography, photography, live streaming, and podcast production that amplifies
              Rwanda’s creative ecosystem to audiences across the continent and diaspora.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              {badges.map((badge) => (
                <motion.span
                  key={badge}
                  whileHover={{ y: -3 }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f6c343] shadow-[0_0_8px_rgba(246,195,67,0.8)]" />
                  {badge}
                </motion.span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <motion.button
                whileHover={{ y: -4, boxShadow: "0px 15px 30px rgba(22,108,68,0.35)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const el = document.getElementById("studio-booking");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="rounded-full bg-[#2e6b57] px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white"
              >
                Book a Shoot
              </motion.button>
              <motion.button
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/portfolio")}
                className="rounded-full border border-white/40 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur"
              >
                View Portfolio
              </motion.button>
            </motion.div>
          </div>

        <div className="lg:col-span-6" id="studio-showreel">
            <StudioShowreel />
          </div>
        </div>

        <div className="pointer-events-none absolute -left-16 top-20 h-32 w-32 rounded-full border border-white/30"></div>
        <div className="pointer-events-none absolute -right-12 bottom-28 h-40 w-40 border border-white/20"></div>
      </section>

      <div id="studio-services">
        <StudioCoreServices />
      </div>

      <StudioPricing />

      <StudioBooking />

      <StudioContactUs />

      <StudioFooter />
    </div>
  );
};

export default StudioHero;

