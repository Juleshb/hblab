import React from "react";

const packages = [
  {
    name: "S-Basic",
    price: "400,000",
    features: ["VIP 200 photo album", "1 A3 frame", "1 full HD film", "All soft copies"],
  },
  {
    name: "Basic",
    price: "500,000",
    features: ["VIP 320 photo album", "2 A3 frames", "Flash disk", "1 full HD film", "All soft copies"],
  },
  {
    name: "Medium",
    price: "600,000",
    features: ["VIP 320 photo album", "2 A3 frames", "Flash disk", "Highlight film", "Full HD film"],
  },
  {
    name: "Premium",
    price: "700,000",
    popular: true,
    features: ["Photobook", "2 A2 frames", "Flash disk", "Highlight film", "Full HD film"],
  },
  {
    name: "Ultra Premium",
    price: "900,000",
    features: ["Photobook", "A1 frame", "Flash disk", "Highlight film", "Pre-wedding shoot"],
  },
  {
    name: "Pro",
    price: "1,200,000",
    features: ["Photobook", "360-photo VIP album", "A1 and A3 frames", "Highlight film", "Pre-wedding shoot"],
  },
];

const StudioPricing = () => {
  const book = () => {
    document.getElementById("studio-booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="studio-pricing" className="bg-[#090b0a] px-6 py-20 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] uppercase tracking-[0.38em] text-[#e7c15a]">Wedding packages</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">A clear package for the day.</h2>
        <p className="mt-4 max-w-lg text-sm leading-6 text-white/60">
          Prices are in Rwandan francs. Every package includes editing and delivery in two to three weeks. Ask for a custom day if yours does not fit.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <article
              key={pkg.name}
              className={`flex flex-col rounded-[28px] p-6 ${
                pkg.popular ? "bg-[#e7c15a] text-[#1a1406]" : "border border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{pkg.name}</h3>
                {pkg.popular ? <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Most booked</span> : null}
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {pkg.price}
                <span className="ml-2 text-sm font-medium opacity-70">RWF</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {pkg.features.map((feature) => (
                  <li key={feature} className={pkg.popular ? "text-[#1a1406]/80" : "text-white/70"}>{feature}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={book}
                className={`mt-8 rounded-full px-4 py-3 text-sm font-semibold ${
                  pkg.popular ? "bg-[#1a1406] text-[#e7c15a]" : "bg-white text-[#121614]"
                }`}
              >
                Book {pkg.name}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudioPricing;
