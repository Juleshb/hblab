import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../assets/context/AuthContext.jsx";
import logo from "../assets/logo.png";
import { HiMenu, HiX } from "react-icons/hi";
import { Icon } from "@iconify/react";
import { studioSiteHref } from "../site";

const Navbar = () => {
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const phoneNumber = "+250789028283";

  const closeMenus = () => {
    setOpenMenu(null);
    setIsToggleOpen(false);
    setShowUserMenu(false);
    setShowSearch(false);
  };

  const scrollToId = (id) => {
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 84;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };

  const handleNavClick = (id) => {
    closeMenus();
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      scrollToId(id);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (location.state?.scrollTo) {
      const id = location.state.scrollTo;
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const top = element.getBoundingClientRect().top + window.scrollY - 84;
          window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
        }
      }, 100);
    }
  }, [location]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") closeMenus();
    };
    const onPointer = (event) => {
      if (!event.target.closest("[data-nav-root]")) {
        setOpenMenu(null);
        setShowUserMenu(false);
        setShowSearch(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, []);

  const openStudio = () => {
    closeMenus();
    const href = studioSiteHref();
    if (href.startsWith("http")) window.location.assign(href);
    else navigate(href);
  };

  const groups = [
    {
      id: "about",
      label: "About",
      active: location.pathname === "/leadership",
      items: [
        { label: "About us", detail: "Who HBLab is", scroll: "about-us" },
        { label: "Leadership", detail: "The people at HBLab", scroll: "our-leadership" },
        { label: "Contact", detail: "Talk to the team", scroll: "contact-us" },
      ],
    },
    {
      id: "programs",
      label: "Programs",
      active: ["/get-started", "/internship", "/CertificateCheck"].includes(location.pathname),
      items: [
        { label: "Training", detail: "Join a class in Rubavu", to: "/get-started" },
        { label: "Internship", detail: "Work with the HBLab team", to: "/internship" },
        { label: "Certificate", detail: "Check a certificate", to: "/CertificateCheck" },
      ],
    },
    {
      id: "services",
      label: "Services",
      items: [
        { label: "Software and websites", detail: "Systems, shops, and sites", scroll: "service-development" },
        { label: "HB Studio", detail: "Photo, video, and podcasts", scroll: "service-studio" },
        { label: "Training", detail: "Practical digital skills", scroll: "service-courses" },
        { label: "Consultancy", detail: "Strategy, setup, and problem-solving", scroll: "service-consultancy" },
      ],
    },
    {
      id: "studio",
      label: "Studio",
      active: location.pathname === "/portfolio" || location.pathname.startsWith("/studio"),
      items: [
        { label: "HB Studio", detail: "Video, photo, and podcasts", action: openStudio },
        { label: "Portfolio", detail: "Work we have made", to: "/portfolio" },
      ],
    },
  ];

  const go = (item) => {
    if (item.action) {
      item.action();
      return;
    }
    if (item.scroll) {
      handleNavClick(item.scroll);
      return;
    }
    closeMenus();
    if (item.to) navigate(item.to);
  };

  const getDashboardLink = () => {
    if (user?.role === "ADMIN") return "/admin/dashboard";
    if (user?.role === "STUDENT") return "/student/dashboard";
    return "/";
  };

  const linkClass = (active) =>
    `inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition ${
      active ? "bg-white/80 text-emerald-900 shadow-sm" : "text-slate-800 hover:bg-white/60 hover:text-emerald-900"
    }`;

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5" data-nav-root>
      <a
        href={`https://wa.me/${phoneNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-3 text-white shadow-lg hover:bg-emerald-700"
      >
        <span className="hidden text-sm lg:block">Contact our support team</span>
        <Icon icon="akar-icons:whatsapp-fill" className="text-2xl" />
      </a>

      <header className="mx-auto max-w-7xl">
        <nav className={`flex h-[4.25rem] items-center gap-2 rounded-full border border-white/70 px-3 shadow-[0_10px_40px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl ${isScrolled ? "bg-white/75" : "bg-white/50"}`}>
          <button type="button" onClick={() => { closeMenus(); navigate("/"); }} className="shrink-0">
            <img src={logo} alt="HBLab" className="h-10 w-auto" />
          </button>

          <div className="ml-4 hidden items-center gap-1 lg:flex">
            <button type="button" onClick={() => handleNavClick("home")} className={linkClass(location.pathname === "/")}>
              Home
            </button>
            {groups.map((group) => (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => setOpenMenu(group.id)}
              >
                <button
                  type="button"
                  aria-expanded={openMenu === group.id}
                  onClick={() => setOpenMenu((current) => (current === group.id ? null : group.id))}
                  className={linkClass(group.active || openMenu === group.id)}
                >
                  {group.label}
                  <Icon icon="carbon:chevron-down" className={`text-base transition ${openMenu === group.id ? "rotate-180" : ""}`} />
                </button>
                {openMenu === group.id ? (
                  <div className="absolute left-0 top-full z-50 w-64 pt-2">
                    <div className="rounded-3xl border border-white/70 bg-white/70 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
                      {group.items.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => go(item)}
                          className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-emerald-50"
                        >
                          <span className="text-sm font-medium text-slate-900">{item.label}</span>
                          <span className="text-xs text-slate-500">{item.detail}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            <Link to="/carrier" onClick={closeMenus} className={linkClass(location.pathname === "/carrier")}>
              Careers
            </Link>
          </div>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            {showSearch ? (
              <div className="flex items-center rounded-full border border-white/70 bg-white/50 px-3 py-1.5">
                <input
                  type="search"
                  autoFocus
                  className="w-36 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  placeholder="Search"
                />
                <button type="button" onClick={() => setShowSearch(false)} className="text-slate-500" aria-label="Close search">
                  <HiX size={16} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => { setShowSearch(true); setOpenMenu(null); }} className="rounded-full p-2 text-slate-700 hover:bg-white/70" aria-label="Search">
                <Icon icon="carbon:search" className="text-xl" />
              </button>
            )}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowUserMenu((open) => !open); setOpenMenu(null); }}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900"
                >
                  <Icon icon="carbon:user" className="text-base" />
                  <span className="max-w-28 truncate">{user.name}</span>
                </button>
                {showUserMenu ? (
                  <div className="absolute right-0 mt-3 w-56 rounded-3xl border border-white/70 bg-white/75 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <button type="button" onClick={() => { closeMenus(); navigate(getDashboardLink()); }} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                      Dashboard
                    </button>
                    <button type="button" onClick={() => { logout(); closeMenus(); }} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <button type="button" onClick={() => { closeMenus(); navigate("/LoginForm"); }} className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900">
                Login
              </button>
            )}
          </div>

          <button type="button" className="ml-auto rounded-full p-2 text-slate-800 hover:bg-white/70 lg:hidden" onClick={() => setIsToggleOpen((open) => !open)} aria-label="Menu">
            {isToggleOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </nav>

        {isToggleOpen ? (
          <div className="mt-2 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-white/70 bg-white/70 px-3 py-2 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur-2xl lg:hidden">
            <button type="button" onClick={() => handleNavClick("home")} className="block w-full rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50">
              Home
            </button>
            {groups.map((group) => (
              <div key={group.id} className="border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenMenu((current) => (current === group.id ? null : group.id))}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-slate-800"
                >
                  {group.label}
                  <Icon icon="carbon:chevron-down" className={`transition ${openMenu === group.id ? "rotate-180" : ""}`} />
                </button>
                {openMenu === group.id ? (
                  <div className="mb-2 space-y-1 pl-3">
                    {group.items.map((item) => (
                      <button key={item.label} type="button" onClick={() => go(item)} className="block w-full rounded-xl px-3 py-2 text-left hover:bg-emerald-50">
                        <span className="block text-sm font-medium text-slate-900">{item.label}</span>
                        <span className="block text-xs text-slate-500">{item.detail}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <Link to="/carrier" onClick={closeMenus} className="block rounded-xl border-t border-slate-100 px-3 py-3 text-sm font-medium text-slate-800">
              Careers
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-full bg-slate-100 px-3 py-2">
                <Icon icon="carbon:search" className="text-slate-400" />
                <input type="search" className="ml-2 w-full bg-transparent text-sm outline-none" placeholder="Search" />
              </div>
              {user ? (
                <button type="button" onClick={() => { closeMenus(); navigate(getDashboardLink()); }} className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white">
                  Account
                </button>
              ) : (
                <button type="button" onClick={() => { closeMenus(); navigate("/LoginForm"); }} className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white">
                  Login
                </button>
              )}
            </div>
          </div>
        ) : null}
      </header>
    </div>
  );
};

export default Navbar;
