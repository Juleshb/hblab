import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../assets/context/AuthContext.jsx";
import logo from "../assets/logo.png";
import aboutPortrait from "../assets/about-portrait.jpg";
import leaderPhoto from "../assets/nn.jpeg";
import serviceSoftware from "../assets/service-software.jpg";
import serviceStudio from "../assets/service-studio.jpg";
import serviceTraining from "../assets/service-training.jpg";
import serviceConsultancy from "../assets/service-consultancy.jpg";
import studioBanner from "../assets/hb-studio.jpg";
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
    const top = element.getBoundingClientRect().top + window.scrollY - 120;
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
          const top = element.getBoundingClientRect().top + window.scrollY - 120;
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
        { label: "About us", detail: "A technology and multimedia company in Rubavu, Gisenyi.", cta: "Read about HBLab", image: aboutPortrait, scroll: "about-us" },
        { label: "Leadership", detail: "The people who lead training, software, and studio work.", cta: "Meet the team", image: leaderPhoto, scroll: "our-leadership" },
        { label: "Contact", detail: "Write to the Rubavu office. We reply from info@hblab.rw.", cta: "Talk with HBLab", scroll: "contact-us" },
      ],
    },
    {
      id: "programs",
      label: "Programs",
      active: ["/training", "/get-started", "/internship", "/certificate", "/CertificateCheck"].includes(location.pathname),
      items: [
        { label: "Training", detail: "Classes in software, networks, multimedia, electronics, accounting, and electrical work.", cta: "Join a training", image: serviceTraining, to: "/training" },
        { label: "Internship", detail: "Workplace experience and real projects with the HBLab team.", cta: "Apply for an internship", image: serviceSoftware, to: "/internship" },
        { label: "Certificate", detail: "Confirm a certificate that HBLab has issued.", cta: "Check a certificate", to: "/certificate" },
      ],
    },
    {
      id: "services",
      label: "Services",
      items: [
        { label: "Software and websites", detail: "Systems, shops, and websites for schools, companies, and institutions.", cta: "See this service", image: serviceSoftware, scroll: "service-development" },
        { label: "HB Studio", detail: "Photography, video, live streaming, and podcasts.", cta: "See this service", image: serviceStudio, scroll: "service-studio" },
        { label: "Training", detail: "Practical classes and internships for students and graduates.", cta: "See this service", image: serviceTraining, scroll: "service-courses" },
        { label: "Consultancy", detail: "IT strategy, implementation, and technical problem-solving.", cta: "See this service", image: serviceConsultancy, scroll: "service-consultancy" },
      ],
    },
    {
      id: "studio",
      label: "Studio",
      active: location.pathname === "/portfolio" || location.pathname.startsWith("/studio"),
      items: [
        { label: "HB Studio", detail: "Photo, video, live streaming, and podcast production.", cta: "Open HB Studio", image: studioBanner, action: openStudio },
        { label: "Portfolio", detail: "Films, photos, and productions the studio has made.", cta: "See the portfolio", image: serviceStudio, to: "/portfolio" },
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
    `inline-flex items-center gap-1 px-3 py-2 text-sm font-medium transition ${
      active ? "text-green-800" : "text-slate-700 hover:text-green-800"
    }`;

  return (
    <div className="fixed inset-x-0 top-0 z-50" data-nav-root>
      <a
        href={`https://wa.me/${phoneNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-green-950 px-4 py-3 text-white shadow-lg hover:bg-green-800"
      >
        <span className="hidden text-sm lg:block">Contact our support team</span>
        <Icon icon="akar-icons:whatsapp-fill" className="text-2xl" />
      </a>

      <div className="bg-green-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2 text-center text-xs sm:text-sm">
          <span className="sm:hidden">Training and internships in Rubavu.</span>
          <span className="hidden sm:inline">Professional training and internships in Rubavu, Gisenyi.</span>
          <button type="button" onClick={() => navigate("/training")} className="shrink-0 font-semibold text-green-100 underline-offset-2 hover:underline">
            Join a training
          </button>
        </div>
      </div>

      <header
        className={`relative border-b bg-white ${isScrolled || openMenu ? "border-green-100 shadow-sm" : "border-transparent"}`}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
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
              </div>
            ))}
            <Link to="/careers" onClick={closeMenus} className={linkClass(location.pathname === "/careers" || location.pathname === "/carrier")}>
              Careers
            </Link>
          </div>

          <div className="ml-auto hidden items-center gap-1 lg:flex">
            {showSearch ? (
              <div className="flex items-center rounded-full border border-green-100 bg-green-50 px-3 py-1.5">
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
              <button type="button" onClick={() => { setShowSearch(true); setOpenMenu(null); }} className="rounded-full p-2 text-slate-700 hover:bg-green-50" aria-label="Search">
                <Icon icon="carbon:search" className="text-xl" />
              </button>
            )}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowUserMenu((open) => !open); setOpenMenu(null); }}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-800 hover:bg-green-50"
                >
                  <Icon icon="carbon:user" className="text-base" />
                  <span className="max-w-28 truncate">{user.name}</span>
                </button>
                {showUserMenu ? (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-green-100 bg-white p-2 shadow-[0_18px_50px_rgba(19,45,36,0.12)]">
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
              <button type="button" onClick={() => { closeMenus(); navigate("/LoginForm"); }} className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-green-800">
                Login
              </button>
            )}
            <button type="button" onClick={() => { closeMenus(); navigate("/training"); }} className="ml-2 rounded-full bg-green-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800">
              Join a training
            </button>
          </div>

          {openMenu ? (
            <div className="absolute inset-x-0 top-full hidden border-t border-green-100 bg-white shadow-[0_24px_60px_rgba(19,45,36,0.12)] lg:block">
              <div className={`mx-auto grid max-w-7xl ${groups.find((group) => group.id === openMenu)?.items.length === 4 ? "grid-cols-4" : groups.find((group) => group.id === openMenu)?.items.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {groups.find((group) => group.id === openMenu)?.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => go(item)}
                    className="border-r border-green-100 px-6 py-8 text-left last:border-r-0 hover:bg-green-50/60"
                  >
                    <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-green-700">
                      {groups.find((group) => group.id === openMenu)?.label}
                    </span>
                    <span className="mt-4 block text-xl font-black leading-tight text-green-950">{item.label}</span>
                    <span className="mt-2 block min-h-16 text-sm leading-6 text-slate-600">{item.detail}</span>
                    {item.image ? (
                      <img src={item.image} alt="" className="mt-5 aspect-[16/10] w-full rounded-2xl object-cover" />
                    ) : (
                      <span className="mt-5 flex aspect-[16/10] w-full items-end rounded-2xl bg-[radial-gradient(circle_at_top,#2e6b57,#16382e)] p-5 text-lg font-black text-white">
                        {item.label}
                      </span>
                    )}
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-green-700">
                      {item.cta}
                      <Icon icon="carbon:arrow-right" className="text-base" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button type="button" className="ml-auto rounded-full p-2 text-slate-800 hover:bg-green-50 lg:hidden" onClick={() => setIsToggleOpen((open) => !open)} aria-label="Menu">
            {isToggleOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </nav>

        {isToggleOpen ? (
          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto border-t border-green-100 bg-white px-4 py-2 shadow-lg lg:hidden">
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
            <Link to="/careers" onClick={closeMenus} className="block rounded-xl border-t border-slate-100 px-3 py-3 text-sm font-medium text-slate-800">
              Careers
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-full bg-slate-100 px-3 py-2">
                <Icon icon="carbon:search" className="text-slate-400" />
                <input type="search" className="ml-2 w-full bg-transparent text-sm outline-none" placeholder="Search" />
              </div>
              {user ? (
                <button type="button" onClick={() => { closeMenus(); navigate(getDashboardLink()); }} className="rounded-full border border-green-200 px-4 py-2 text-sm font-medium text-green-950">
                  Account
                </button>
              ) : (
                <button type="button" onClick={() => { closeMenus(); navigate("/LoginForm"); }} className="rounded-full border border-green-200 px-4 py-2 text-sm font-medium text-green-950">
                  Login
                </button>
              )}
              <button type="button" onClick={() => { closeMenus(); navigate("/training"); }} className="rounded-full bg-green-950 px-4 py-2 text-sm font-semibold text-white">
                Join
              </button>
            </div>
          </div>
        ) : null}
      </header>
    </div>
  );
};

export default Navbar;
