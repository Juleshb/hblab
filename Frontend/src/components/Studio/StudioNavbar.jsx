import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/HB-STUDIO-FULL-1.png";
import logoIcon from "../../assets/HB-STUDIO-FULL.png";
import { HiMenu, HiX } from "react-icons/hi";

const studioLinks = [
  { label: "Home", target: "studio-home" },
  { label: "Services", target: "studio-services" },
  { label: "Pricing", target: "studio-pricing" },
  { label: "Booking", target: "studio-booking" },
  { label: "Contact", target: "studio-contact" },
  { label: "Portfolio", route: "/portfolio" },
];

const StudioNavbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (link) => {
    setIsOpen(false);
    if (link.route) {
      navigate(link.route);
      return;
    }
    if (link.target) {
      setTimeout(() => {
        const el = document.getElementById(link.target);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  return (
    <div className="w-full fixed z-[100] top-0 left-0">
      <div
        className={`bg-gray-50 flex items-center px-6 py-4 sm:px-10 ${
          isScrolled
            ? "bg-white text-green-900 shadow-md"
            : "text-white lg:inset-0 bg-gradient-to-l from-green-900 to-transparent"
        }`}
      >
       
        <nav className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <img src={logo} alt="HB Studio" className="hidden h-20 sm:block object-contain" />
            <img src={logoIcon} alt="HB Studio" className="h-14 sm:hidden object-contain" />
            <div className="hidden md:block">
              <p className={`text-xs uppercase tracking-[0.5em] ${isScrolled ? "text-green-700" : "text-white/70"}`}>
                HB Studio
              </p>
              <p className={`text-sm font-semibold ${isScrolled ? "text-green-900" : "text-white"}`}>
                Video · Photo · Live Streaming
              </p>
            </div>
          </div>

          <div className={`hidden items-center gap-6 text-sm font-medium lg:flex ${
            isScrolled ? "text-green-900" : "text-white"
          }`}>
            {studioLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link)}
                className={`uppercase tracking-wide transition ${
                  isScrolled ? "hover:text-green-600" : "hover:text-[#f6c343]"
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => {
                const el = document.getElementById("studio-booking");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`rounded-full border px-5 py-2 text-xs uppercase tracking-[0.3em] ${
                isScrolled
                  ? "border-green-900 text-green-900 hover:bg-green-900 hover:text-white"
                  : "border-white/40 text-white hover:bg-white/10"
              }`}
            >
              Book a Shoot
            </button>
          </div>

          <button
            className={`lg:hidden ${isScrolled ? "text-green-900" : "text-white"}`}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? <HiX size={28} /> : <HiMenu size={28} />}
          </button>
        </nav>

        {isOpen && (
          <div
            className={`mt-4 space-y-3 rounded-2xl border p-4 backdrop-blur lg:hidden ${
              isScrolled
                ? "border-green-900/20 bg-white/95 text-green-900"
                : "border-white/10 bg-white/5 text-white"
            }`}
          >
            {studioLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link)}
                className={`block w-full rounded-lg px-3 py-2 text-left uppercase tracking-wide transition ${
                  isScrolled ? "hover:bg-green-50" : "hover:bg-white/10"
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => {
                setIsOpen(false);
                const el = document.getElementById("studio-booking");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`w-full rounded-lg border px-3 py-2 uppercase tracking-[0.3em] ${
                isScrolled
                  ? "border-green-900 text-green-900 hover:bg-green-900 hover:text-white"
                  : "border-white/40 text-white hover:bg-white/10"
              }`}
            >
              Book a Shoot
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioNavbar;

