import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import heroFilm from "../assets/hblab-hero.mp4";

const checks = [
  "Software, multimedia, and networks",
  "Training center in Rubavu",
  "Internships with the HBLab team",
];

const stats = [
  {
    end: 500,
    suffix: "+",
    label: "Number of Interns Trained",
    detail: "Students Trained in Software Development, Multimedia, Networking, and Computer Systems!",
  },
  {
    end: 90,
    suffix: "%",
    label: "Internship Placement Rate",
    detail: "of Our Interns Secure Jobs or Start Their Own Tech Projects!",
  },
  {
    end: 100,
    suffix: "+",
    label: "Successful Projects Completed",
    detail: "Real-World Projects Completed by Our Interns!",
  },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const filmRef = useRef(null);

  useEffect(() => {
    const film = filmRef.current;
    if (!film) return;
    film.play().catch(() => {});
  }, []);

  return (
    <div className="bg-white px-6 pb-20 pt-40 text-center sm:pt-44">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-green-700"
      >
        Training, studio, and software
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.05 }}
        className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-tight text-green-950 sm:text-5xl lg:text-6xl"
      >
        Empowering the Next Generation of Tech Professionals!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg"
      >
        HBLab is a training center in Rubavu. Gain hands-on experience in Software Development, Multimedia, Networking, and Computer Systems.
      </motion.p>
      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-green-900"
      >
        {checks.map((item) => (
          <li key={item} className="inline-flex items-center gap-2">
            <FiCheck className="text-green-600" aria-hidden="true" />
            {item}
          </li>
        ))}
      </motion.ul>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          type="button"
          onClick={() => navigate("/training")}
          className="rounded-full bg-green-950 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
        >
          Join a training
        </button>
        <button
          type="button"
          onClick={() => navigate("/internship")}
          className="rounded-full border border-green-200 bg-white px-6 py-3 text-sm font-semibold text-green-950 hover:border-green-600"
        >
          Apply for an internship
        </button>
        </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mx-auto mt-12 w-full max-w-5xl overflow-hidden rounded-3xl"
      >
        <video
          ref={filmRef}
          src={heroFilm}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => filmRef.current?.play().catch(() => {})}
          className="aspect-video w-full object-cover"
          aria-label="HBLab training, software, and studio work"
        />
      </motion.div>

      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-10 border-t border-green-100 pt-12 text-center sm:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          >
            <p className="text-5xl font-black leading-none text-green-950 sm:text-6xl">
              <CountUp start={0} end={stat.end} duration={2.4} />
              {stat.suffix}
            </p>
            <h2 className="mt-4 text-sm font-semibold text-green-900">{stat.label}</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-600">{stat.detail}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
