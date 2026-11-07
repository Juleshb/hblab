import videographyImg from "../../assets/camera-operator-shooting-on-professional-camera-1024x682.webp";
import photographyImg from "../../assets/kk2.jpg";
import podcastImg from "../../assets/Banner studio podcast.jpg";
import editingImg from "../../assets/1607004a63deefac49c5f3bd.jpg";

const coreServices = [
  {
    title: "Videography",
    image: videographyImg,
    description: "Music films, ads, documentaries, and event coverage with a multi-camera crew.",
    items: ["Music videos", "Advertisements", "Documentaries", "Events", "Short-form"],
  },
  {
    title: "Photography",
    image: photographyImg,
    description: "Portraits, products, and brand days in the studio or on location.",
    items: ["Events", "Products", "Portraits", "Lifestyle", "Corporate"],
  },
  {
    title: "Podcast studio",
    image: podcastImg,
    description: "A treated room, broadcast microphones, and a set ready for video podcasts.",
    items: ["Recording booth", "Video podcast", "Crew on set"],
  },
  {
    title: "Post production",
    image: editingImg,
    description: "Color, sound, motion, and retouching finished by the HBLab creative team.",
    items: ["Color", "Retouching", "Motion", "Sound"],
  },
];

const StudioCoreServices = () => {
  return (
    <section className="bg-[#f4f6f3] px-6 py-20 text-[#121614] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] uppercase tracking-[0.38em] text-[#1f6b4a]">Services</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
          One studio. Four ways to tell the story.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {coreServices.map((service) => (
            <article key={service.title} className="overflow-hidden rounded-[28px] bg-white shadow-[0_20px_50px_rgba(18,22,20,0.06)]">
              <img src={service.image} alt="" className="h-52 w-full object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5c675f]">{service.description}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {service.items.map((item) => (
                    <li key={item} className="rounded-full bg-[#f4f6f3] px-3 py-1 text-xs font-medium text-[#314038]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudioCoreServices;
