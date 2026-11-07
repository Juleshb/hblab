import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiOrigin } from "../../apiOrigin";
import { youtubeThumb } from "../../youtube";
import weddingImg from "../../assets/19670a1bd1113d6879b33b93d9e13b5b.jpg";
import indoorImg from "../../assets/1607004a63deefac49c5f3bd.jpg";
import corporateImg from "../../assets/camera-operator-shooting-on-professional-camera-1024x682.webp";
import podcastImg from "../../assets/Banner studio podcast.jpg";
import outdoorImg from "../../assets/kk2.jpg";
import musicVideoImg from "../../assets/kk.jpg";

const showreelItems = [
  { title: "Weddings", note: "Ceremony, vows, reception", image: weddingImg },
  { title: "Studio portraits", note: "Editorial light, Rubavu", image: indoorImg },
  { title: "Brands", note: "Launches and corporate days", image: corporateImg },
  { title: "Podcasts", note: "Set, sound, and picture", image: podcastImg },
  { title: "Lake Kivu", note: "Lifestyle and outdoor", image: outdoorImg },
  { title: "Music films", note: "Direction and edit", image: musicVideoImg },
];

const StudioShowreel = () => {
  const navigate = useNavigate();
  const [films, setFilms] = useState([]);

  useEffect(() => {
    let gone = false;
    fetch(`${apiOrigin}/api/studio/works`)
      .then((response) => response.json())
      .then((data) => {
        if (!gone && Array.isArray(data.works)) {
          const featured = data.works.filter((work) => work.featured);
          setFilms((featured.length ? featured : data.works).slice(0, 8));
        }
      })
      .catch(() => {});
    return () => {
      gone = true;
    };
  }, []);

  return (
    <section id="studio-showreel" className="bg-[#090b0a] px-6 py-20 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.38em] text-[#e7c15a]">Selected work</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">What the studio makes.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/55">
            HB Studio is HBLab’s production house: picture, sound, and live coverage for people and companies in Rwanda.
          </p>
        </div>
        {films.length > 0 && (
          <div className="mt-10 flex gap-4 overflow-x-auto pb-2">
            {films.map((film) => (
              <button
                key={film.id}
                type="button"
                onClick={() => navigate(`/portfolio?film=${film.id}`)}
                className="group min-w-[260px] flex-1 snap-start text-left sm:min-w-[320px]"
              >
                <div className="relative aspect-video overflow-hidden rounded-[28px] bg-[#161a18]">
                  {youtubeThumb(film.youtubeUrl) && (
                    <img src={youtubeThumb(film.youtubeUrl)} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e7c15a]">{film.category}</span>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="text-lg font-semibold">{film.title}</h3>
                    <p className="mt-1 text-sm text-white/70">{film.client}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="mt-10 flex gap-4 overflow-x-auto pb-2">
          {showreelItems.map((item) => (
            <article key={item.title} className="group min-w-[240px] flex-1 snap-start sm:min-w-[280px]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#161a18]">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{item.note}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudioShowreel;
