import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaBolt, FaBroadcastTower, FaCalculator, FaCode, FaMicrochip, FaNetworkWired, FaPhotoVideo } from "react-icons/fa";

const programs = [
  {
    title: "Software Development",
    icon: FaCode,
    text: "You learn to build websites, mobile apps, and business software. The class covers the pages people use, the server behind them, and the database that stores the information. You leave with a project you can show to an employer.",
  },
  {
    title: "Networking & Internet Technology",
    icon: FaNetworkWired,
    text: "You learn how computers connect and how the internet carries information. Practice includes setting up a network, configuring servers, and keeping the connection secure. This prepares you for network support in a school, office, or company.",
  },
  {
    title: "Computer System and Architecture",
    icon: FaMicrochip,
    text: "You learn how a computer is built, from the parts inside the machine to the system that runs the software. The class covers assembly, troubleshooting, and day-to-day system care. You can then set up and repair computers with confidence.",
  },
  {
    title: "Multimedia Production",
    icon: FaPhotoVideo,
    text: "You learn photography, video, graphic design, and editing. Practice happens on real pictures, films, and designs for events, companies, and social media. You finish able to produce a complete piece of media, not only use one tool.",
  },
  {
    title: "Electronics & Telecommunications",
    icon: FaBroadcastTower,
    text: "You learn electronic circuits and how voice and data travel through communication systems. The class covers testing, installation, and basic repair. It is practical preparation for telecom and electronics work.",
  },
  {
    title: "Accounting",
    icon: FaCalculator,
    text: "You learn how a business records money, checks the books, and prepares clear reports. Practice follows the records a shop, school, or company uses every day. You leave able to keep accounts in order and explain the numbers.",
  },
  {
    title: "Electrical Technology",
    icon: FaBolt,
    text: "You learn electrical installation, measurement, safety, and maintenance. The class follows the work used in buildings and workshops, with care for correct and safe practice. You can then support electrical jobs under proper supervision.",
  },
];

const Courses = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 text-green-900">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-green-600">Training</p>
        <h1 className="mt-2 text-3xl font-black text-green-950 sm:text-4xl">Professional Training</h1>
        <p className="mt-4 text-base leading-7 text-green-800 sm:text-lg">
          Comprehensive IT training programs designed to equip you with industry-ready skills and hands-on experience.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program, index) => {
          const Icon = program.icon;
          return (
            <motion.article
              key={program.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="flex h-full flex-col rounded-3xl border border-green-200 bg-white p-5 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-black text-green-950">{program.title}</h2>
              <p className="mt-2 text-sm leading-6 text-green-800">{program.text}</p>
            </motion.article>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => navigate("/get-started")}
          className="rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
        >
          Join a training
        </button>
      </div>
    </div>
  );
};

export default Courses;
