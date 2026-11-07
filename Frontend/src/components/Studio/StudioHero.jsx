import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudioNavbar from "./StudioNavbar";
import StudioShowreel from "./StudioShowreel";
import StudioCoreServices from "./StudioCoreServices";
import StudioPricing from "./StudioPricing";
import StudioBooking from "./StudioBooking";
import StudioContactUs from "./StudioContactUs";
import StudioFooter from "./StudioFooter";
import studioBg from "../../assets/camera-operator-shooting-on-professional-camera-1024x682.webp";

const facts = [
  { value: "Rubavu", label: "Studio floor" },
  { value: "Film", label: "Photo · Podcast · Live" },
  { value: "HBLab", label: "Parent company" },
];

const StudioHero = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return undefined;
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-[#090b0a] text-white">
      <div id="studio-home">
        <StudioNavbar />
      </div>
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <img src={studioBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,11,10,0.92)_0%,rgba(9,11,10,0.72)_46%,rgba(9,11,10,0.28)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090b0a] via-transparent to-black/30" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-16 pt-36 sm:px-10">
          <p className="text-[11px] uppercase tracking-[0.42em] text-[#e7c15a]">HB Studio</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            The creative studio inside HBLab.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
            Weddings, brands, podcasts, and live broadcasts, filmed in Rubavu and finished with the same care HBLab brings to every product.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollTo("studio-booking")}
              className="rounded-full bg-[#e7c15a] px-6 py-3 text-sm font-semibold text-[#1a1406]"
            >
              Book a shoot
            </button>
            <button
              type="button"
              onClick={() => navigate("/portfolio")}
              className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur"
            >
              See the work
            </button>
          </div>
          <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-sm font-semibold text-white">{fact.value}</dt>
                <dd className="mt-1 text-xs text-white/55">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <StudioShowreel />
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
