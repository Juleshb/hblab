import { motion } from "framer-motion";
import software from "../assets/service-software.jpg";
import studio from "../assets/service-studio.jpg";
import training from "../assets/service-training.jpg";
import consultancy from "../assets/service-consultancy.jpg";

const services = [
  {
    id: "service-development",
    label: "Software",
    title: "Software and websites",
    text: "Systems, shops, and websites for schools, companies, and institutions.",
    image: software,
    items: [
      "Management, school, and hotel systems",
      "E-commerce and custom business applications",
      "Corporate, school, NGO, and government websites",
      "Databases, APIs, and website support",
    ],
  },
  {
    id: "service-studio",
    label: "Studio",
    title: "HB Studio",
    text: "Photography, video, live streaming, and podcasts for companies, schools, and events.",
    image: studio,
    items: [
      "Corporate, event, product, and graduation photography",
      "Corporate, event, promotional, and documentary video",
      "Live streaming for conferences, churches, and graduations",
      "Podcast recording, video podcasts, and editing",
    ],
  },
  {
    id: "service-courses",
    label: "Training",
    title: "Mobile, design, and training",
    text: "Apps, design, and practical classes, plus internships for students and graduates.",
    image: training,
    items: [
      "Android apps, progressive web apps, and cross-platform apps",
      "UI and UX design, wireframes, and prototypes",
      "Training in software, networks, multimedia, electronics, accounting, and electrical work",
      "Internships for TVET, university students, and graduates",
    ],
  },
  {
    id: "service-consultancy",
    label: "Consultancy",
    title: "Consultancy",
    text: "Expert IT consulting services to help organizations optimize their technology infrastructure and strategy.",
    image: consultancy,
    items: [
      "IT Strategy and Policy Development",
      "Implementation Solutions",
      "Technical Problem-Solving",
    ],
  },
];

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M15 0C16.657 0 18 1.343 18 3V15C18 16.657 16.657 18 15 18H3C1.343 18 0 16.657 0 15V3C0 1.343 1.343 0 3 0H15ZM7.001 6.066L10.247 9.313L7 12.561L8.065 13.627L12.379 9.313L8.067 5L7.001 6.066Z" fill="currentColor" />
  </svg>
);

const OurServices = () => {
  const requestService = () => {
    const element = document.getElementById("contact-us");
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };

  return (
    <div className="bg-green-50/60 px-6 py-20">
      <div className="mx-auto w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-green-700">What we do</p>
          <h1 className="mt-3 text-3xl font-black text-green-950 sm:text-4xl">Our services</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Software, studio production, practical training, and consulting for schools, companies, and institutions.
          </p>
        </motion.div>

        <div className="mt-12 flex flex-col gap-5 md:gap-72">
          {services.map((service, index) => (
            <article
              key={service.id}
              id={service.id}
              style={{ zIndex: index + 1 }}
              className="grid items-center gap-8 rounded-3xl bg-white p-6 shadow-[0_16px_50px_rgba(19,45,36,0.08)] sm:p-8 md:sticky md:top-28 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10"
            >
              <div>
                <span className="inline-flex rounded bg-green-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-green-700">
                  {service.label}
                </span>
                <h3 className="mt-4 max-w-md text-3xl font-black leading-tight text-green-950 sm:text-4xl">
                  {service.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 sm:text-base">{service.text}</p>
                <ul className="mt-4 space-y-2">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={requestService}
                  className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-green-700 hover:text-green-900"
                >
                  Request this service
                  <Arrow />
                </button>
              </div>
              <div className="overflow-hidden rounded-2xl bg-green-50">
                <img src={service.image} alt="" className="aspect-[4/3] w-full object-cover" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurServices;
