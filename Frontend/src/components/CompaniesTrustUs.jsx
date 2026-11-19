import { motion } from "framer-motion";
import bambe from "../assets/bambe.png";
import coopedhu from "../assets/COOPEDHU.png";
import crat from "../assets/CRAT.png";
import nbhs from "../assets/nbhs.png";
import umuhuza from "../assets/umuhuza.png";
import emmaus from "../assets/emmaus.png";
import upsa from "../assets/upsa-next.png";
import rupsa from "../assets/rupsa-plc.png";
import nabe from "../assets/nabe.png";
import jot from "../assets/jot.png";
import elena from "../assets/elena-guerra.png";
import heroine from "../assets/la-heroine.png";

const logos = [
  { src: bambe, name: "Bambe" },
  { src: coopedhu, name: "Coopedhu" },
  { src: crat, name: "CRAT" },
  { src: nbhs, name: "NBHS" },
  { src: umuhuza, name: "Umuhuza" },
  { src: emmaus, name: "Emmaus" },
  { src: upsa, name: "UPSA Next Payment" },
  { src: rupsa, name: "RUPSA Next Payment PLC" },
  { src: nabe, name: "National Benchmark Engineering" },
  { src: jot, name: "JOT" },
  { src: elena, name: "C.S Elena Guerra Butare" },
  { src: heroine, name: "La Heroine" },
];

const rows = [
  { direction: "right", items: logos.slice(0, 6) },
  { direction: "left", items: logos.slice(6) },
];

const MarqueeRow = ({ items, direction }) => {
  const strip = [...items, ...items, ...items];

  return (
    <div className="flex gap-5 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      {[0, 1].map((copy) => (
        <div
          key={copy}
          className={`flex shrink-0 items-center gap-5 ${direction === "right" ? "marquee-right" : "marquee-left"}`}
        >
          {strip.map((logo, index) => (
            <div key={`${logo.name}-${copy}-${index}`} className="flex h-16 w-40 shrink-0 items-center justify-center">
              <img
                src={logo.src}
                alt={copy === 0 && index < items.length ? logo.name : ""}
                className="h-12 w-full object-contain"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const CompaniesTrustUs = () => {
  return (
    <div className="w-full overflow-hidden py-16 text-green-950">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="px-6 text-center"
      >
        <h1 className="text-lg font-semibold sm:text-xl">Trusted companies</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mt-8 flex flex-col gap-5"
        aria-label="Trusted companies"
      >
        {rows.map((row) => (
          <MarqueeRow key={row.direction} items={row.items} direction={row.direction} />
        ))}
      </motion.div>
    </div>
  );
};

export default CompaniesTrustUs;
