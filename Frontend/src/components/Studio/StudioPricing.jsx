import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const packages = [
  {
    name: "S-Basic",
    price: "400,000",
    currency: "RWF",
    popular: false,
    features: [
      "VIP 200 Photo Album",
      "1 (A3) cadre board",
      "1 full HD video",
      "All soft copy photos & videos",
    ],
    gradient: "from-[#326567] to-[#166c44]",
  },
  {
    name: "Basic",
    price: "500,000",
    currency: "RWF",
    popular: false,
    features: [
      "VIP 320 Photo Album",
      "2 (A3) cadre boards",
      "Flash disk",
      "1 full HD video",
      "All soft copy photos & videos",
    ],
    gradient: "from-[#166c44] to-[#326567]",
  },
  {
    name: "Medium",
    price: "600,000",
    currency: "RWF",
    popular: false,
    features: [
      "VIP 320 Photo Album",
      "2 (A3) cadre boards",
      "Flash disk",
      "1 video highlight",
      "1 full HD video",
      "All soft copy photos & videos",
    ],
    gradient: "from-[#310979] to-[#166c44]",
  },
  {
    name: "Premium",
    price: "700,000",
    currency: "RWF",
    popular: true,
    features: [
      "1 Photobook",
      "2 (A2) cadre boards",
      "Flash disk",
      "1 video highlight",
      "1 full HD video",
      "All soft copy photos & videos",
    ],
    gradient: "from-[#166c44] to-[#310979]",
  },
  {
    name: "Ultra Premium",
    price: "900,000",
    currency: "RWF",
    popular: false,
    features: [
      "1 Photobook",
      "1 (A1) cadre board",
      "Flash disk",
      "1 video highlight",
      "1 full HD video",
      "Pre-wedding shoot",
    ],
    gradient: "from-[#326567] to-[#310979]",
  },
  {
    name: "Pro",
    price: "1,200,000",
    currency: "RWF",
    popular: false,
    features: [
      "1 Photobook",
      "1 VIP Album of 360 photos",
      "1 (A1) & (A3) cadre boards",
      "Flash disk",
      "1 video highlight",
      "1 full HD video",
      "Pre-wedding shoot",
    ],
    gradient: "from-[#f6c343] to-[#166c44]",
  },
];

const StudioPricing = () => {
  const navigate = useNavigate();

  return (
    <section id="studio-pricing" className="relative bg-gradient-to-b from-gray-50 to-white px-6 py-20 text-green-900 sm:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="text-xs uppercase tracking-[0.45em] text-green-700">Wedding Packages</p>
          <h2 className="mt-4 text-4xl font-black sm:text-5xl">
            Choose Your Perfect Wedding Package
          </h2>
          <p className="mt-4 text-lg text-green-800/80">
            From intimate ceremonies to grand celebrations — we capture every moment with cinematic precision.
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`group relative overflow-hidden rounded-3xl border-2 ${
                pkg.popular
                  ? "border-[#f6c343] bg-white shadow-2xl scale-105"
                  : "border-green-900/20 bg-white shadow-lg"
              }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute right-0 top-0 z-10 rounded-bl-2xl rounded-tr-3xl bg-gradient-to-br from-[#f6c343] to-[#d4a832] px-6 py-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-green-900">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${pkg.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>

              <div className="relative p-8">
                {/* Package Name & Price */}
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-green-900">{pkg.name}</h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-black text-green-900">{pkg.price}</span>
                    <span className="text-lg text-green-700">{pkg.currency}</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="mb-8 space-y-3">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#f6c343] shadow-[0_0_6px_rgba(246,195,67,0.7)]"></span>
                      <span className="text-sm text-green-800">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/get-started")}
                  className={`w-full rounded-xl py-3.5 px-6 text-sm font-semibold uppercase tracking-wider transition ${
                    pkg.popular
                      ? "bg-gradient-to-r from-[#166c44] to-[#326567] text-white shadow-lg hover:shadow-xl"
                      : "border-2 border-green-900/30 bg-white text-green-900 hover:border-green-900 hover:bg-green-900 hover:text-white"
                  }`}
                >
                  Book {pkg.name}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-green-700/80">
            All packages include professional editing, color grading, and delivery within 2-3 weeks.
            <br />
            <span className="font-semibold">Custom packages available upon request.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default StudioPricing;

