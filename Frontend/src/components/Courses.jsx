import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TrainingDemo from "./TrainingDemo";

const programs = [
  {
    id: "training-software",
    tab: "Software",
    title: "Software Development",
    intro: "You learn to build websites, mobile apps, and business software.",
    practice: [
      "The pages people use",
      "The server behind them",
      "The database that stores the information",
    ],
    leave: ["A project you can show to an employer"],
  },
  {
    id: "training-networking",
    tab: "Networking",
    title: "Networking & Internet Technology",
    intro: "You learn how computers connect and how the internet carries information.",
    practice: [
      "Setting up a network",
      "Configuring servers",
      "Keeping the connection secure",
    ],
    leave: ["Preparation for network support in a school, office, or company"],
  },
  {
    id: "training-systems",
    tab: "Computer systems",
    title: "Computer System and Architecture",
    intro: "You learn how a computer is built, from the parts inside the machine to the system that runs the software.",
    practice: ["Assembly", "Troubleshooting", "Day-to-day system care"],
    leave: ["You can set up and repair computers with confidence"],
  },
  {
    id: "training-multimedia",
    tab: "Multimedia",
    title: "Multimedia Production",
    intro: "You learn photography, video, graphic design, and editing.",
    practice: ["Real pictures, films, and designs for events, companies, and social media"],
    leave: ["You can produce a complete piece of media, not only use one tool"],
  },
  {
    id: "training-electronics",
    tab: "Electronics",
    title: "Electronics & Telecommunications",
    intro: "You learn electronic circuits and how voice and data travel through communication systems.",
    practice: ["Testing", "Installation", "Basic repair"],
    leave: ["Practical preparation for telecom and electronics work"],
  },
  {
    id: "training-accounting",
    tab: "Accounting",
    title: "Accounting",
    intro: "You learn how a business records money, checks the books, and prepares clear reports.",
    practice: ["The records a shop, school, or company uses every day"],
    leave: ["You can keep accounts in order and explain the numbers"],
  },
  {
    id: "training-electrical",
    tab: "Electrical",
    title: "Electrical Technology",
    intro: "You learn electrical installation, measurement, safety, and maintenance.",
    practice: ["The work used in buildings and workshops", "Correct and safe practice"],
    leave: ["You can support electrical jobs under proper supervision"],
  },
];

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M15 0C16.657 0 18 1.343 18 3V15C18 16.657 16.657 18 15 18H3C1.343 18 0 16.657 0 15V3C0 1.343 1.343 0 3 0H15ZM7.001 6.066L10.247 9.313L7 12.561L8.065 13.627L12.379 9.313L8.067 5L7.001 6.066Z" fill="currentColor" />
  </svg>
);

const Courses = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(programs[0].id);

  useEffect(() => {
    const nodes = programs.map((program) => document.getElementById(program.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0.15, 0.4, 0.7] }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const tab = document.querySelector(`[data-training-tab="${active}"]`);
    const scroller = tab?.parentElement;
    if (!tab || !scroller) return;
    const left = tab.offsetLeft - scroller.clientWidth / 2 + tab.clientWidth / 2;
    scroller.scrollTo({ left: Math.max(left, 0), behavior: "smooth" });
  }, [active]);

  const openProgram = (id) => {
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 168;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    setActive(id);
  };

  return (
    <div className="bg-[#f4f7f6] text-green-950">
      <div className="mx-auto w-full max-w-6xl px-6 pb-6 pt-20 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-green-700">Training</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Professional Training</h1>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          Comprehensive IT training programs designed to equip you with industry-ready skills and hands-on experience.
        </p>
      </div>

      <div className="sticky top-[104px] z-30 px-4 py-3">
        <div className="mx-auto flex w-max max-w-full gap-1 overflow-x-auto rounded-full border border-white/70 bg-white/35 p-1.5 shadow-[0_8px_32px_rgba(19,45,36,0.12)] backdrop-blur-xl backdrop-saturate-150 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {programs.map((program) => {
            const selected = active === program.id;
            return (
              <button
                key={program.id}
                type="button"
                data-training-tab={program.id}
                onClick={() => openProgram(program.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                  selected ? "bg-green-950/90 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]" : "text-slate-700 hover:bg-white/50 hover:text-green-950"
                }`}
              >
                {program.tab}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {programs.map((program, index) => (
          <article id={program.id} key={program.id} className="flex min-h-[calc(100svh-10.5rem)] scroll-mt-44 items-center px-6">
            <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div className={`rounded-3xl border border-green-100 bg-white p-7 shadow-[0_16px_50px_rgba(19,45,36,0.08)] sm:p-9 ${index % 2 === 0 ? "lg:order-2" : ""}`}>
                <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-green-700">
                  Training
                </span>
                <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">{program.title}</h2>
                <p className="mt-4 text-base leading-7 text-slate-600">{program.intro}</p>
                <p className="mt-6 text-sm font-semibold text-green-950">What you practice</p>
                <ul className="mt-3 space-y-2">
                  {program.practice.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm font-semibold text-green-950">What you leave with</p>
                <ul className="mt-3 space-y-2">
                  {program.leave.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => navigate("/training")}
                  className="mt-8 inline-flex items-center gap-3 rounded-full bg-green-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-900"
                >
                  Join a training
                  <Arrow />
                </button>
              </div>
              <TrainingDemo id={program.id} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Courses;
