import { motion } from "framer-motion";
import { FaAward, FaBalanceScale, FaBookOpen, FaBriefcase, FaHeart, FaLightbulb, FaUsers } from "react-icons/fa";
import portrait from "../assets/about-portrait.jpg";

const coreValues = [
  { label: "Innovation", icon: FaLightbulb },
  { label: "Excellence", icon: FaAward },
  { label: "Integrity", icon: FaBalanceScale },
  { label: "Professionalism", icon: FaBriefcase },
  { label: "Teamwork", icon: FaUsers },
  { label: "Customer satisfaction", icon: FaHeart },
  { label: "Continuous learning", icon: FaBookOpen },
];

const facts = [
  ["Legal name", "High-Technology Builder Lab Ltd"],
  ["Head office", "Rubavu, Gisenyi, Rwanda"],
  ["Status", "Private limited company"],
];

const pillars = [
  ["Training", "Practical classes in software, networking, computer systems, multimedia, electronics, accounting, and electrical technology."],
  ["HB Studio", "Photography, video, live streaming, and podcast production for companies, schools, and events."],
  ["Internship", "Workplace experience, mentorship, and real projects for TVET students, university students, and recent graduates."],
  ["Who we serve", "Government, schools, TVET, NGOs, private companies, religious organizations, and small businesses."],
  ["Why HBLab", "An experienced team, practical solutions, and services that can grow with the client."],
  ["Partnerships", "Skills programs, internships, software, multimedia, digital innovation, and youth employment."],
];

const card = "rounded-3xl border border-white/70 bg-white text-green-950 shadow-[0_16px_50px_rgba(8,24,18,0.28)]";

const AboutUs = () => {
  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#2e6b57_0%,#16382e_42%,#0e241e_100%)] py-20 text-white">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#8fd4b8]/15 blur-3xl" />
      <div className="relative">
      <div className="mx-auto w-full max-w-3xl px-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7e0d2]">About</p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">High-Technology Builder Lab Ltd</h1>
        <p className="mt-5 text-base leading-7 text-[#d7ebe4] sm:text-lg">
          HBLab Ltd is a private technology and multimedia company in Rubavu, Gisenyi. We build digital solutions, produce multimedia through HB Studio, and train young professionals with practical skills.
        </p>
      </div>

      <div className="mx-auto mt-14 grid w-full max-w-5xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-14">
        <motion.img
          src={portrait}
          alt="HBLab team member"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="h-full max-h-[32rem] w-full rounded-3xl object-cover object-top"
        />
        <div className={`${card} p-7 sm:p-9`}>
          <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-green-700">
            The company
          </span>
          <h2 className="mt-5 text-3xl font-black leading-tight">Our mission</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            To provide innovative technology solutions, high-quality multimedia services, and practical skills programs that create value for businesses, institutions, and communities.
          </p>
          <h3 className="mt-6 text-sm font-semibold text-green-950">Our vision</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Our vision is to become a leading technology, multimedia, and professional training company in Rwanda and across Africa.
          </p>
          <p className="mt-5 text-sm font-semibold text-green-950">Chief Executive Officer: HABARUREMA Jules.</p>
        </div>
      </div>

      <div className="mx-auto mt-10 grid w-full max-w-5xl gap-4 px-6 sm:grid-cols-3">
        {facts.map(([label, value]) => (
          <div key={label} className={`${card} px-5 py-5`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-green-700">{label}</p>
            <p className="mt-2 text-lg font-medium text-green-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-20 w-full max-w-5xl px-6">
        <h2 className="text-center text-3xl font-black text-white sm:text-4xl">Core values</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {coreValues.map(({ label, icon: Icon }) => (
            <div key={label} className={`${card} flex items-center gap-3 px-4 py-3`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-950 text-white">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-16 grid w-full max-w-5xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map(([title, text]) => (
          <div key={title} className={`${card} p-6`}>
            <h3 className="text-xl font-black">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default AboutUs;
