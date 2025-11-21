import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import weddingImg from "../../assets/19670a1bd1113d6879b33b93d9e13b5b.jpg";
import indoorImg from "../../assets/1607004a63deefac49c5f3bd.jpg";
import corporateImg from "../../assets/camera-operator-shooting-on-professional-camera-1024x682.webp";
import livestreamImg from "../../assets/1607004a63deefac49c5f3bd.jpg";
import podcastImg from "../../assets/Banner studio podcast.jpg";
import outdoorImg from "../../assets/kk2.jpg";
import musicVideoImg from "../../assets/kk.jpg";

const showreelItems = [
  {
    title: "Wedding Videography",
    description: "Traditional and modern Rwandan ceremonies, vows, and receptions captured in cinematic detail.",
    categories: ["Wedding", "Videography"],
    stat: "120+ couples",
    image: weddingImg,
  },
  {
    title: "Indoor Studio Photoshoot",
    description: "Editorial lighting, creative props, and retouch-ready imagery for brands and personalities.",
    categories: ["Studio", "Photography"],
    stat: "Creative sets",
    image: indoorImg,
  },
  {
    title: "Corporate Event Coverage",
    description: "Investor forums, launches, and board retreats with multi-camera filming and instant edits.",
    categories: ["Corporate", "Event"],
    stat: "40+ summits",
    image: corporateImg,
  },
  {
    title: "Live Streaming Control Room",
    description: "Seminars, conferences, and church experiences streamed in HD with redundant networks.",
    categories: ["Livestream", "Seminar"],
    stat: "4K ready",
    image: livestreamImg,
  },
  {
    title: "Outdoor Lifestyle Portraits",
    description: "Lake Kivu sunsets, Rubavu streets, and nature excursions with lifestyle storytelling.",
    categories: ["Lifestyle", "Outdoor"],
    stat: "Lake Kivu",
    image: outdoorImg,
  },
  {
    title: "Podcast Sessions",
    description: "LED-lit sets, broadcast microphones, and remote guest routing for premium storytelling.",
    categories: ["Podcast", "Audio"],
    stat: "50+ shows",
    image: podcastImg,
  },
  {
    title: "Music Video Direction",
    description: "Storyboards, choreography, and on-location direction tailored for artists and brands.",
    categories: ["Music", "Film"],
    stat: "Cinematic edits",
    image: musicVideoImg,
  },
];

const StudioShowreel = () => {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return undefined;
    const timer = setInterval(
      () => setActiveIndex((prev) => (prev + 1) % showreelItems.length),
      4500
    );
    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.children[activeIndex];
    if (card) {
      container.scrollTo({
        left: card.offsetLeft - 24,
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  return (
    <div className="flex h-full flex-col gap-6 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Studio Showreel</p>
          <h3 className="text-2xl font-bold">Live workbench of HB Studio</h3>
        </div>
       
      </div>

      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
      >
        {showreelItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            whileHover={{ y: -6 }}
            className="group snap-center min-w-[260px] max-w-[260px] rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur-xl"
          >
            <div className="relative h-40 overflow-hidden rounded-2xl border border-white/10">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold">
                {item.stat}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <h4 className="text-lg font-semibold text-white">{item.title}</h4>
              <p className="text-sm text-white/70">{item.description}</p>
              <div className="flex flex-wrap gap-2">
                {item.categories.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#f6c343]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-2">
        {showreelItems.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 w-2 rounded-full transition ${activeIndex === idx ? "w-6 bg-[#f6c343]" : "bg-white/30"}`}
            aria-label={`Show reel card ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default StudioShowreel;

