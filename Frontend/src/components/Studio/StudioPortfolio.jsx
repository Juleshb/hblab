import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StudioNavbar from "./StudioNavbar";
import StudioFooter from "./StudioFooter";
import { Icon } from "@iconify/react";
import weddingImg from "../../assets/19670a1bd1113d6879b33b93d9e13b5b.jpg";
import indoorImg from "../../assets/1607004a63deefac49c5f3bd.jpg";
import corporateImg from "../../assets/camera-operator-shooting-on-professional-camera-1024x682.webp";
import livestreamImg from "../../assets/Banner studio podcast.jpg";
import outdoorImg from "../../assets/kk2.jpg";
import podcastImg from "../../assets/kk1.jpg";
import musicVideoImg from "../../assets/kk.jpg";

const portfolioItems = [
  {
    id: 1,
    title: "Traditional Rwandan Wedding",
    category: "Videography",
    tags: ["Wedding", "Cultural", "Cinematic"],
    image: weddingImg,
    description: "A beautiful traditional Rwandan wedding ceremony captured with cinematic precision, showcasing cultural heritage and modern storytelling.",
    client: "Private Client",
    year: "2024",
    location: "Rubavu, Rwanda",
  },
  {
    id: 2,
    title: "Editorial Studio Portrait",
    category: "Photography",
    tags: ["Portrait", "Studio", "Editorial"],
    image: indoorImg,
    description: "Professional studio portrait session with creative lighting and editorial styling for brand identity.",
    client: "Brand Client",
    year: "2024",
    location: "HB Studio, Rubavu",
  },
  {
    id: 3,
    title: "Corporate Summit Coverage",
    category: "Videography",
    tags: ["Corporate", "Event", "Multi-camera"],
    image: corporateImg,
    description: "Multi-camera coverage of a major corporate summit with live streaming and instant highlights.",
    client: "Corporate Client",
    year: "2024",
    location: "Kigali, Rwanda",
  },
  {
    id: 4,
    title: "Live Streaming Production",
    category: "Live Streaming",
    tags: ["Livestream", "Conference", "HD"],
    image: livestreamImg,
    description: "Professional live streaming setup for conferences and seminars with redundant networks and 4K capability.",
    client: "Conference Organizer",
    year: "2024",
    location: "Kigali Convention Centre",
  },
  {
    id: 5,
    title: "Lake Kivu Lifestyle Shoot",
    category: "Photography",
    tags: ["Lifestyle", "Outdoor", "Nature"],
    image: outdoorImg,
    description: "Stunning outdoor lifestyle photography session at Lake Kivu, capturing natural beauty and authentic moments.",
    client: "Lifestyle Brand",
    year: "2024",
    location: "Lake Kivu, Rubavu",
  },
  {
    id: 6,
    title: "Podcast Recording Session",
    category: "Podcast",
    tags: ["Podcast", "Audio", "Video"],
    image: podcastImg,
    description: "Premium podcast recording with LED-lit sets, broadcast microphones, and professional production.",
    client: "Media Company",
    year: "2024",
    location: "HB Studio, Rubavu",
  },
  {
    id: 7,
    title: "Music Video Production",
    category: "Videography",
    tags: ["Music", "Film", "Creative"],
    image: musicVideoImg,
    description: "Cinematic music video production with storyboards, choreography, and on-location direction.",
    client: "Music Artist",
    year: "2024",
    location: "Various Locations",
  },
  {
    id: 8,
    title: "Product Photography",
    category: "Photography",
    tags: ["Product", "Commercial", "Studio"],
    image: indoorImg,
    description: "Professional product photography with studio lighting and retouching for e-commerce and marketing.",
    client: "E-commerce Brand",
    year: "2024",
    location: "HB Studio, Rubavu",
  },
  {
    id: 9,
    title: "Documentary Film",
    category: "Videography",
    tags: ["Documentary", "Storytelling", "Cultural"],
    image: corporateImg,
    description: "Documentary film production capturing Rwanda's cultural heritage and modern development stories.",
    client: "Cultural Organization",
    year: "2024",
    location: "Rwanda",
  },
];

const categories = ["All", "Videography", "Photography", "Podcast", "Live Streaming"];

const StudioPortfolio = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredItems =
    activeCategory === "All"
      ? portfolioItems
      : portfolioItems.filter((item) => item.category === activeCategory);

  return (
    <div className="bg-black text-white min-h-screen">
      <StudioNavbar />
      
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-green-900 via-[#2e6b57cc] to-[#310979bb]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#01060499] to-[#010604]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(246,195,67,0.18),transparent_55%)] mix-blend-screen"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[11px] uppercase tracking-[0.4em]"
            >
              Portfolio
              <span className="h-1 w-1 rounded-full bg-[#f6c343]"></span>
              HB Studio
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            >
              Our Creative Work
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 text-lg text-white/80 max-w-2xl mx-auto"
            >
              Explore our collection of videography, photography, podcast, and live streaming projects that showcase Rwanda's stories with cinematic precision.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="relative z-10 bg-[#010604] py-8 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-6 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${
                  activeCategory === category
                    ? "border-[#f6c343] bg-[#f6c343] text-green-900"
                    : "border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:text-white"
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="relative z-10 bg-[#010604] py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  onClick={() => setSelectedItem(item)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        whileHover={{ scale: 1 }}
                        className="rounded-full bg-[#f6c343] p-4"
                      >
                        <Icon icon="mdi:eye" className="h-6 w-6 text-green-900" />
                      </motion.div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#f6c343]">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <p className="text-xl text-white/60">No projects found in this category.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Modal/Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-[#010604]"
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              >
                <Icon icon="mdi:close" className="h-6 w-6" />
              </button>

              <div className="relative aspect-video overflow-hidden">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#010604] via-transparent to-transparent"></div>
              </div>

              <div className="p-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-full bg-[#f6c343] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-green-900">
                    {selectedItem.category}
                  </span>
                  <span className="text-sm text-white/60">{selectedItem.year}</span>
                </div>

                <h2 className="mb-4 text-3xl font-black text-white">{selectedItem.title}</h2>
                <p className="mb-6 text-lg text-white/80">{selectedItem.description}</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Client</p>
                    <p className="mt-1 text-white">{selectedItem.client}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Location</p>
                    <p className="mt-1 text-white">{selectedItem.location}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Year</p>
                    <p className="mt-1 text-white">{selectedItem.year}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {selectedItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.2em] text-[#f6c343]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <StudioFooter />
    </div>
  );
};

export default StudioPortfolio;

