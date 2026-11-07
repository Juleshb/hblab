import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studioHomePath, labHomeHref } from "../../site";
import logo from "../../assets/HB-STUDIO-FULL-1-WHITE.png";
import { HiMenu, HiX } from "react-icons/hi";

const studioLinks = [
  { label: "Work", target: "studio-showreel" },
  { label: "Services", target: "studio-services" },
  { label: "Weddings", target: "studio-pricing" },
  { label: "Book", target: "studio-booking" },
  { label: "Contact", target: "studio-contact" },
  { label: "Portfolio", route: "/portfolio" },
];

const StudioNavbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openLab = () => {
    const home = labHomeHref();
    if (home.startsWith("http")) window.location.assign(home);
    else navigate(home);
  };

  const handleLinkClick = (link) => {
    setIsOpen(false);
    if (link.route) {
      navigate(link.route);
      return;
    }
    const el = link.target ? document.getElementById(link.target) : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate(`${studioHomePath()}#${link.target || "studio-home"}`);
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[100] px-3 pt-3 sm:px-6">
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border px-3 py-2 transition ${
          isScrolled
            ? "border-white/10 bg-[#0c0f0e]/90 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            : "border-white/15 bg-black/35 backdrop-blur-md"
        }`}
      >
        <button type="button" onClick={() => handleLinkClick({ target: "studio-home" })} className="flex items-center gap-3 pl-1">
          <img src={logo} alt="HB Studio" className="h-10 w-auto object-contain sm:h-11" />
          <span className="hidden border-l border-white/15 pl-3 text-left sm:block">
            <span className="block text-[10px] uppercase tracking-[0.28em] text-white/45">A product of</span>
            <span className="block text-xs font-semibold text-white">HBLab</span>
          </span>
        </button>

        <div className="hidden items-center gap-1 lg:flex">
          {studioLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleLinkClick(link)}
              className="rounded-full px-3 py-2 text-xs font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openLab}
            className="hidden rounded-full px-3 py-2 text-xs font-medium text-white/60 transition hover:text-white md:inline"
          >
            HBLab
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick({ target: "studio-booking" })}
            className="rounded-full bg-[#e7c15a] px-4 py-2 text-xs font-semibold text-[#1a1406] transition hover:bg-[#f3d48a]"
          >
            Book a shoot
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-white lg:hidden"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? <HiX size={22} /> : <HiMenu size={22} />}
          </button>
        </div>
      </nav>

      {isOpen && (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl border border-white/10 bg-[#0c0f0e]/95 p-3 text-white shadow-2xl backdrop-blur-xl lg:hidden">
          {studioLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleLinkClick(link)}
              className="block w-full rounded-2xl px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10"
            >
              {link.label}
            </button>
          ))}
          <button type="button" onClick={openLab} className="block w-full rounded-2xl px-4 py-3 text-left text-sm text-white/60 hover:bg-white/10">
            Visit HBLab
          </button>
        </div>
      )}
    </div>
  );
};

export default StudioNavbar;
