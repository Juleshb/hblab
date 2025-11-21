import React from "react";
import videographyImg from "../../assets/camera-operator-shooting-on-professional-camera-1024x682.webp";
import photographyImg from "../../assets/kk2.jpg";
import podcastImg from "../../assets/Banner studio podcast.jpg";
import editingImg from "../../assets/1607004a63deefac49c5f3bd.jpg";

const coreServices = [
  {
    title: "Videography Services",
    image: videographyImg,
    accent: "from-[#326567] to-[#166c44]",
    description: "Multi-camera direction for cultural moments, corporate launches, and brand storytelling.",
    items: [
      "Music videos",
      "Advertisements",
      "Documentaries",
      "Event coverage",
      "YouTube / short-form content",
    ],
  },
  {
    title: "Photography Services",
    image: photographyImg,
    accent: "from-[#310979] to-[#166c44]",
    description: "Editorial lighting and on-location sessions across Kigali, Rubavu, and Lake Kivu.",
    items: [
      "Events",
      "Product shoots",
      "Studio portraits",
      "Branding & lifestyle",
      "Corporate photography",
    ],
  },
  {
    title: "Podcast Studio",
    image: podcastImg,
    accent: "from-[#166c44] to-[#326567]",
    description: "Acoustically treated space with broadcast microphones, LED sets, and remote guest routing.",
    items: ["Recording booth", "Video podcast support", "Production team on set"],
  },
  {
    title: "Production & Editing",
    image: editingImg,
    accent: "from-[#326567] to-[#310979]",
    description: "Finish every project with cinematic polish from our Kigali post lab.",
    items: ["Color grading", "Photo retouching", "Motion graphics", "Sound design"],
  },
];

const StudioCoreServices = () => {
  return (
    <section className="relative z-10 bg-gray-100 px-6 py-16 text-green-900 sm:px-10">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs uppercase tracking-[0.45em] text-green-700">Core Capabilities</p>
        <h2 className="mt-4 text-3xl font-black sm:text-4xl">
          Full-service creative studio for Rwanda’s weddings, brands, and corporate events.
        </h2>
        <p className="mt-4 text-green-800/80">
          We merge cultural nuance with premium production — giving every couple, founder, and organization a cinematic
          voice across videography, photography, podcasts, and post-production.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2">
        {coreServices.map((service) => (
          <div
            key={service.title}
            className="relative overflow-hidden rounded-3xl border border-green-900/10 bg-white shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
          >
            <div className={`absolute inset-0 opacity-20 blur-3xl bg-gradient-to-br ${service.accent}`}></div>
            <div className="relative">
              <img src={service.image} alt={service.title} className="h-44 w-full rounded-t-3xl object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-16 rounded-t-3xl bg-gradient-to-t from-black/70 to-transparent"></div>
            </div>
            <div className="relative flex flex-col gap-3 p-6">
              <div>
                <h3 className="text-xl font-semibold text-green-900">{service.title}</h3>
                <p className="text-sm text-green-800">{service.description}</p>
              </div>
              <ul className="space-y-2 text-sm text-green-900/80">
                {service.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f6c343] shadow-[0_0_6px_rgba(246,195,67,0.7)]"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StudioCoreServices;

