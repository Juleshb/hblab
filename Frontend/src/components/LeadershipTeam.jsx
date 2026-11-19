import { motion } from "framer-motion";
import avatar from "../assets/avatar.png";
import jules from "../assets/nn.jpeg";
import fab from "../assets/fab.jpeg";
import gribert from "../assets/mubea.jpeg";
import prince from "../assets/prince-mucyo.png";
import kevine from "../assets/kevine-mugabire.png";
import aimable from "../assets/aimable-niyomugabo.png";

const teamMembers = [
  { name: "Jules HABARUREMA", role: "CEO & Founder", image: jules },
  { name: "Fabrice MBARUSHIMANA", role: "Full Stack Software Engineer", image: fab },
  { name: "Ferdinand KWIZERA", role: "IT Support and Training Coordinator", image: avatar },
  { name: "Gilbert HABARUREMA", role: "UX/UI (Project Design)", image: gribert },
  { name: "Prince MUCYO", role: "Developer", image: prince },
  { name: "Kevine MUGABIRE", role: "Marketing Manager", image: kevine },
  { name: "Aimable NIYOMUGABO", role: "Project Manager", image: aimable },
];

const LeadershipTeam = () => {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-20 text-green-950">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-green-700">People</p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-3 text-3xl font-black sm:text-4xl"
        >
          Meet Our Team
        </motion.h1>
        <p className="mt-5 text-base leading-7 text-slate-600">
          At HB-Lab, our team is made up of passionate, highly skilled professionals dedicated to shaping the future of technology. With expertise in software development, multimedia, networking, and computer systems, we work together to mentor, innovate, and empower the next generation of tech leaders. Our collective experience drives success, ensuring that we provide world-class learning opportunities and groundbreaking solutions.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {teamMembers.map((member) => (
          <div key={member.name} className="text-center">
            <img
              src={member.image}
              alt={member.name}
              className="mx-auto h-36 w-36 rounded-full object-cover object-top ring-4 ring-white"
            />
            <p className="mt-4 text-sm font-semibold text-green-950">{member.name}</p>
            <p className="mt-1 text-sm text-slate-500">{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadershipTeam;
