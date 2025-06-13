import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import logoicon from "../assets/logo-icon.png";
import { FaSearch } from "react-icons/fa";
import { HiMenu, HiX } from "react-icons/hi";
import { Icon } from "@iconify/react";


const Navbar = () => {
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = "+250792445913";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle navigation and scrolling
  const handleNavClick = (id) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      scrollToSection(id);
    }
  };

  // Scroll to the specific section
  const scrollToSection = (id) => {
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Scroll to section after navigating back to Home page
  useEffect(() => {
    if (location.state?.scrollTo) {
      scrollToSection(location.state.scrollTo);
    }
  }, [location]);

  return (
    <div className="w-full fixed z-50 top-0 left-0">
      {/* WhatsApp Contact Button */}
      <a
        href={`https://wa.me/${phoneNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 animate-bounce flex justify-between right-4 bg-green-900 text-3xl hover:bg-green-600 text-white py-2 px-4 p-6 rounded-full z-10"
      >
        <p className="text-sm m-2 lg:block hidden">Contact our support team</p>
        <Icon icon="akar-icons:whatsapp-fill" />
      </a>

      {/* Navbar */}
      <div
        className={`bg-gray-50 flex mt-0 lg:py-0 py-3 items-center ${
          isScrolled
            ? "bg-white text-green-900 shadow-md "
            : "text-white lg:inset-0 bg-gradient-to-l from-green-900 to-transparent"
        }`}
      >
        <nav className="flex lg:justify-between items-center grid lg:grid-cols-3 lg:py-3 gap-3 lg:ml-30 ml-3 px-5 w-full">
          <div className="flex justify-between items-center w-full lg:w-auto lg:col-span-1 col-span-3">
            <div id="logo">
              <img src={logo} alt="Logo" className="w-36 hidden lg:block" />
              <img src={logoicon} alt="Logo" className="w-8 block lg:hidden" />
            </div>
            <button className="lg:hidden" onClick={() => setIsToggleOpen(!isToggleOpen)}>
              {isToggleOpen ? <HiX size={28} /> : <HiMenu size={28} />}
            </button>
          </div>

          {/* Navigation Links */}
          <div
            className={`col-span-2 flex flex-col lg:flex-row items-start lg:items-center gap-3 ${
              isToggleOpen ? "" : "hidden"
            } lg:flex`}
          >
            <div
              id="nav-links"
              className={`flex flex-col lg:flex-row items-start lg:items-center lg:gap-5 gap-2 font-small ${
                isScrolled ? "text-green-900" : "lg:text-white text-green-900"
              }`}
            >
              <button onClick={() => handleNavClick("home")}>Home</button>
              <button onClick={() => handleNavClick("about-us")}>About Us</button>
              <button onClick={() => handleNavClick("our-services")}>Services</button>
              <button onClick={() => handleNavClick("contact-us")}>Contact Us</button>
              <a href="#" onClick={() => navigate("/get-started")}>Join Us</a>
              <a href="/Carrier" onClick={() => navigate("/Carrier")}>Carrier</a>
            </div>

            {/* Search Bar and Login Button Container */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="flex items-center rounded bg-gray-300 w-full lg:w-64 max-w-md p-2">
                <input
                  type="search"
                  className="bg-transparent flex-grow outline-none placeholder-gray-600 p-1"
                  placeholder="What are you looking for?"
                />
                <button className="p-1 text-gray-600 hover:text-blue-600">
                  <FaSearch size={18} />
                </button>
              </div>
              
              {/* Login Button */}
              <button 
                onClick={() => navigate("/LoginForm")}
                className="bg-green-900 hover:bg--800 text-white px-3 py-1.5 rounded-sm h-[42px] flex items-center"
              >
                Login
              </button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;