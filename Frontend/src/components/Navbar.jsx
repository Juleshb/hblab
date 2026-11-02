import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../assets/context/AuthContext.jsx";
import logo from "../assets/logo.png";
import logoicon from "../assets/logo-icon.png";
import { FaSearch } from "react-icons/fa";
import { HiMenu, HiX } from "react-icons/hi";
import { Icon } from "@iconify/react";

const Navbar = () => {
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const phoneNumber = "+250792445913";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isToggleOpen && !event.target.closest('.mobile-menu')) {
        setIsToggleOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isToggleOpen]);

  // Handle navigation and scrolling
  const handleNavClick = (id) => {
    setIsToggleOpen(false); // Close mobile menu
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

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setIsToggleOpen(false);
  };

  const getDashboardLink = () => {
    if (user?.role === 'ADMIN') {
      return '/admin/dashboard';
    } else if (user?.role === 'STUDENT') {
      return '/student/dashboard';
    }
    return '/';
  };

  const navLinks = [
    { id: "home", label: "Home", onClick: () => handleNavClick("home") },
    { id: "about-us", label: "About Us", onClick: () => handleNavClick("about-us") },
    { id: "our-services", label: "Services", onClick: () => handleNavClick("our-services") },
    { id: "contact-us", label: "Contact Us", onClick: () => handleNavClick("contact-us") },
    { id: "join-us", label: "Join Us", onClick: () => { setIsToggleOpen(false); navigate("/get-started"); } },
    { id: "certificate", label: "Certificate", onClick: () => { setIsToggleOpen(false); navigate("/CertificateCheck"); } },
    { id: "carrier", label: "Carrier", onClick: () => { setIsToggleOpen(false); navigate("/Carrier"); } },
  ];

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
        <nav className="flex lg:justify-center items-center grid lg:grid-cols-3 lg:py-3 gap-3 px-5 w-full lg:mx-[5%] mx-[5%]">
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
            className={`col-span-2 flex flex-col lg:flex-row items-center lg:items-center gap-3 ${
              isToggleOpen ? "" : "hidden"
            } lg:flex lg:justify-center`}
          >
            <div
              id="nav-links"
              className={`flex flex-col lg:flex-row items-center lg:items-center lg:gap-4 gap-2 font-small text-xs ${
                isScrolled ? "text-green-900" : "lg:text-white text-green-900"
              }`}
            >
              <button 
                onClick={() => handleNavClick("home")}
                className="lg:px-2 lg:py-1 lg:mr-2 mr-1 hover:text-green-600 transition-colors duration-200 whitespace-nowrap"
              >
                Home
              </button>
              <button 
                onClick={() => handleNavClick("about-us")}
                className="lg:px-2 lg:py-1 lg:mr-2 mr-1 hover:text-green-600 transition-colors duration-200 whitespace-nowrap"
              >
                About Us
              </button>
              <button 
                onClick={() => handleNavClick("our-services")}
                className="lg:px-2 lg:py-1 lg:mr-2 mr-1 hover:text-green-600 transition-colors duration-200 whitespace-nowrap"
              >
                Services
              </button>
              <button 
                onClick={() => handleNavClick("contact-us")}
                className="lg:px-2 lg:py-1 lg:mr-2 mr-1 hover:text-green-600 transition-colors duration-200 whitespace-nowrap"
              >
                Contact Us
              </button>
              <a 
                href="#" 
                onClick={() => navigate("/get-started")}
                className="lg:px-2 lg:py-1 lg:mr-2 mr-1 hover:text-green-600 transition-colors duration-200 whitespace-nowrap"
              >
                Join Us
              </a>
              <a 
                href="/CertificateCheck" 
                onClick={() => navigate("/CertificateCheck")}
                className="lg:px-2 lg:py-1 lg:mr-2 mr-1 hover:text-green-600 transition-colors duration-200 whitespace-nowrap"
              >
                Certificate
              </a>
              <a 
                href="/Carrier" 
                onClick={() => navigate("/Carrier")}
                className="lg:px-2 lg:py-1 lg:mr-2 mr-1 hover:text-green-600 transition-colors duration-200 whitespace-nowrap"
              >
                Carrier
              </a>
            </div>

            {/* Search Bar and Login Button Container */}
            <div className="flex items-center gap-2 w-full lg:w-auto lg:justify-end">
              {/* Search Bar */}
              <div className="flex items-center rounded bg-gray-300 w-full lg:w-48 max-w-md p-1">
                <input
                  type="search"
                  className="bg-transparent flex-grow outline-none placeholder-gray-600 p-1 text-xs"
                  placeholder="Search..."
                />
                <button className="p-1 text-gray-600 hover:text-blue-600">
                  <FaSearch size={14} />
                </button>
              </div>
              
              {/* User Menu or Login Button */}
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="bg-green-900 hover:bg-green-800 text-white px-3 py-1.5 rounded-sm h-[42px] flex items-center gap-2 text-xs"
                  >
                    <Icon icon="carbon:user" className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400 capitalize">{user.role?.toLowerCase()}</div>
                      </div>
                      <button
                        onClick={() => navigate(getDashboardLink())}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
              <button 
                onClick={() => navigate("/LoginForm")}
                  className="bg-green-900 hover:bg-green-800 text-white px-3 py-1.5 rounded-sm h-[42px] flex items-center text-xs"
              >
                Login
              </button>
              )}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;